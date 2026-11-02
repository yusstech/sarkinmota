-- Slice 1: catalogue (brands, categories, cars, media, condition reports, hero slides,
-- delivery stories), store settings, profiles, saved cars.
-- Customers read the catalogue; only staff (service role / admin web, later) write it.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Store settings (single row). Plan maths lives here so it is never trusted from the client.
-- ---------------------------------------------------------------------------
create table public.store_settings (
  id                boolean primary key default true check (id),
  deposit_percent   numeric(5,2) not null default 40 check (deposit_percent > 0 and deposit_percent < 100),
  whatsapp_number   text,           -- E.164 without '+', e.g. 2348012345678. Null = not configured yet.
  showroom_address  text,
  showroom_maps_url text,
  updated_at        timestamptz not null default now()
);
insert into public.store_settings (id) values (true);

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table public.brands (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  slug       text not null unique,
  logo_url   text,
  sort_order int  not null default 0
);

create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  slug       text not null unique,
  image_url  text,
  sort_order int  not null default 0
);

create type public.car_status    as enum ('draft', 'available', 'reserved', 'sold');
create type public.car_condition as enum ('brand_new', 'foreign_used', 'nigerian_used');

create table public.cars (
  id                  uuid primary key default gen_random_uuid(),
  brand_id            uuid not null references public.brands (id),
  category_id         uuid not null references public.categories (id),
  model               text not null,
  trim                text,
  year                int  not null check (year between 1950 and 2100),
  condition           public.car_condition not null,
  mileage_km          int  not null default 0 check (mileage_km >= 0),
  body_type           text,
  engine              text,
  horsepower          int,
  transmission        text,
  drivetrain          text,
  fuel                text,
  exterior_color      text,
  interior_color      text,
  seats               int,
  location_city       text not null default 'Abuja',
  vin_last6           text check (vin_last6 ~ '^[A-Z0-9]{6}$'),
  price_ngn           bigint not null check (price_ngn > 0),
  plan_eligible       boolean not null default true,
  headline            text,             -- short editorial line on the car page / hero
  description         text,
  scarcity_note       text,             -- honest scarcity only, e.g. 'Only 2 in Nigeria'
  is_rare             boolean not null default false,
  -- Trust: papers & what's included
  customs_cleared     boolean not null default false,
  registration_status text not null default 'unregistered' check (registration_status in ('unregistered', 'registered', 'included')),
  papers_included     text[] not null default '{}',
  included            text[] not null default '{}',
  delivery_estimate   text,             -- e.g. 'Abuja: 24–48 hours · Lagos: 3–5 days'
  status              public.car_status not null default 'draft',
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index cars_status_published_idx on public.cars (status, published_at desc);
create index cars_category_idx on public.cars (category_id);
create index cars_brand_idx on public.cars (brand_id);

create table public.car_media (
  id         uuid primary key default gen_random_uuid(),
  car_id     uuid not null references public.cars (id) on delete cascade,
  kind       text not null check (kind in ('image', 'video')),
  url        text not null,
  poster_url text,                       -- for video
  caption    text,
  sort_order int  not null default 0
);
create index car_media_car_idx on public.car_media (car_id, sort_order);

create table public.condition_reports (
  car_id           uuid primary key references public.cars (id) on delete cascade,
  inspected_at     date not null,
  inspector        text,
  overall          text not null check (overall in ('excellent', 'very_good', 'good', 'fair')),
  summary          text,
  accident_history text not null default 'none_reported',
  disclosed_issues text[] not null default '{}',
  -- [{ "section": "Exterior", "item": "Paint", "status": "pass|attention", "note": "..." }]
  items            jsonb not null default '[]'::jsonb
);

create table public.hero_slides (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('image', 'video')),
  media_url  text not null,
  poster_url text,
  eyebrow    text,
  headline   text not null,
  subline    text,
  car_id     uuid references public.cars (id) on delete set null,
  sort_order int not null default 0,
  active     boolean not null default true,
  starts_at  timestamptz,
  ends_at    timestamptz
);

create table public.delivery_stories (
  id           uuid primary key default gen_random_uuid(),
  image_url    text not null,
  car_label    text not null,          -- e.g. '2024 Lexus LX 600'
  city         text not null,
  caption      text,
  delivered_at date not null,
  sort_order   int not null default 0,
  published    boolean not null default true
);

-- updated_at maintenance
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;
create trigger cars_touch before update on public.cars
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Listing view: what the app reads. Deposit is computed here, server-side.
-- security_invoker so the caller's RLS on cars applies.
-- ---------------------------------------------------------------------------
create view public.car_listings with (security_invoker = true) as
select
  c.*,
  b.name  as brand_name,
  b.slug  as brand_slug,
  cat.name as category_name,
  cat.slug as category_slug,
  case when c.plan_eligible
       then ceil(c.price_ngn * s.deposit_percent / 100)::bigint
  end as deposit_ngn,
  s.deposit_percent,
  (select m.url from public.car_media m
     where m.car_id = c.id and m.kind = 'image'
     order by m.sort_order limit 1) as cover_url
from public.cars c
join public.brands b       on b.id = c.brand_id
join public.categories cat on cat.id = c.category_id
cross join public.store_settings s;

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  phone      text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, phone) values (new.id, new.phone);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.saved_cars (
  user_id    uuid not null references auth.users (id) on delete cascade,
  car_id     uuid not null references public.cars (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, car_id)
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.store_settings    enable row level security;
alter table public.brands            enable row level security;
alter table public.categories        enable row level security;
alter table public.cars              enable row level security;
alter table public.car_media         enable row level security;
alter table public.condition_reports enable row level security;
alter table public.hero_slides       enable row level security;
alter table public.delivery_stories  enable row level security;
alter table public.profiles          enable row level security;
alter table public.saved_cars        enable row level security;

-- Public catalogue (anon + authenticated): read-only. No write policies = writes denied.
create policy "settings readable"   on public.store_settings for select using (true);
create policy "brands readable"     on public.brands         for select using (true);
create policy "categories readable" on public.categories     for select using (true);

-- Only published cars are visible; drafts stay internal.
create policy "published cars readable" on public.cars for select
  using (status <> 'draft' and published_at is not null and published_at <= now());

create policy "media of visible cars" on public.car_media for select
  using (exists (select 1 from public.cars c where c.id = car_id));      -- cars RLS applies inside
create policy "reports of visible cars" on public.condition_reports for select
  using (exists (select 1 from public.cars c where c.id = car_id));

create policy "active hero slides" on public.hero_slides for select
  using (active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy "published delivery stories" on public.delivery_stories for select
  using (published);

-- Profiles: own row only.
create policy "own profile read"   on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Saved cars: own rows only.
create policy "own saved read"   on public.saved_cars for select to authenticated using (user_id = (select auth.uid()));
create policy "own saved insert" on public.saved_cars for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own saved delete" on public.saved_cars for delete to authenticated using (user_id = (select auth.uid()));

-- Grants: views need explicit select.
grant select on public.car_listings to anon, authenticated;
