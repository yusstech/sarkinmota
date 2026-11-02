import { useQuery } from '@tanstack/react-query';

import { supabase } from './supabase';

export type CarListing = {
  id: string;
  brand_name: string;
  brand_slug: string;
  category_name: string;
  category_slug: string;
  model: string;
  trim: string | null;
  year: number;
  condition: 'brand_new' | 'foreign_used' | 'nigerian_used';
  mileage_km: number;
  body_type: string | null;
  engine: string | null;
  horsepower: number | null;
  transmission: string | null;
  drivetrain: string | null;
  fuel: string | null;
  exterior_color: string | null;
  interior_color: string | null;
  seats: number | null;
  location_city: string;
  vin_last6: string | null;
  price_ngn: number;
  plan_eligible: boolean;
  deposit_ngn: number | null;
  deposit_percent: number;
  headline: string | null;
  description: string | null;
  scarcity_note: string | null;
  is_rare: boolean;
  customs_cleared: boolean;
  registration_status: 'unregistered' | 'registered' | 'included';
  papers_included: string[];
  included: string[];
  delivery_estimate: string | null;
  status: 'available' | 'reserved' | 'sold';
  published_at: string;
  cover_url: string | null;
};

export type CarMedia = { id: string; kind: 'image' | 'video'; url: string; poster_url: string | null; caption: string | null };

export type ConditionItem = { section: string; item: string; status: 'pass' | 'attention'; note?: string };
export type ConditionReport = {
  inspected_at: string;
  inspector: string | null;
  overall: 'excellent' | 'very_good' | 'good' | 'fair';
  summary: string | null;
  accident_history: string;
  disclosed_issues: string[];
  items: ConditionItem[];
};

export type HeroSlide = {
  id: string;
  kind: 'image' | 'video';
  media_url: string;
  poster_url: string | null;
  eyebrow: string | null;
  headline: string;
  subline: string | null;
  car_id: string | null;
  car: Pick<CarListing, 'price_ngn' | 'deposit_ngn' | 'year' | 'mileage_km' | 'condition'> | null;
};

export type Category = { id: string; name: string; slug: string; image_url: string | null };
export type DeliveryStory = { id: string; image_url: string; car_label: string; city: string; caption: string | null; delivered_at: string };
export type StoreSettings = { deposit_percent: number; whatsapp_number: string | null; showroom_address: string | null; showroom_maps_url: string | null };

const LISTED = ['available', 'reserved'];

async function unwrap<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data as T;
}

export function useHeroSlides() {
  return useQuery({
    queryKey: ['hero'],
    queryFn: async () => {
      const slides = await unwrap<Omit<HeroSlide, 'car'>[]>(
        supabase.from('hero_slides').select('id,kind,media_url,poster_url,eyebrow,headline,subline,car_id').order('sort_order'),
      );
      const ids = slides.map((s) => s.car_id).filter(Boolean) as string[];
      const cars = ids.length
        ? await unwrap<(HeroSlide['car'] & { id: string })[]>(
            supabase.from('car_listings').select('id,price_ngn,deposit_ngn,year,mileage_km,condition').in('id', ids),
          )
        : [];
      return slides.map((s) => ({ ...s, car: cars.find((c) => c?.id === s.car_id) ?? null })) as HeroSlide[];
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => unwrap<Category[]>(supabase.from('categories').select('id,name,slug,image_url').order('sort_order')),
    staleTime: 10 * 60_000,
  });
}

export type CarFilter = {
  category?: string;
  rare?: boolean;
  plan?: boolean;
  search?: string;
  excludeId?: string;
  limit?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
};

export function useCars(filter: CarFilter = {}) {
  return useQuery({
    queryKey: ['cars', filter],
    queryFn: () => {
      let q = supabase.from('car_listings').select('*').in('status', LISTED);
      if (filter.category) q = q.eq('category_slug', filter.category);
      if (filter.rare) q = q.eq('is_rare', true);
      if (filter.plan) q = q.eq('plan_eligible', true);
      if (filter.excludeId) q = q.neq('id', filter.excludeId);
      const term = filter.search?.trim().replace(/[%,()"\\*]/g, ' ');
      if (term) q = q.or(`model.ilike.%${term}%,brand_name.ilike.%${term}%,category_name.ilike.%${term}%`);
      if (filter.sort === 'price_asc') q = q.order('price_ngn', { ascending: true });
      else if (filter.sort === 'price_desc') q = q.order('price_ngn', { ascending: false });
      else q = q.order('published_at', { ascending: false });
      if (filter.limit) q = q.limit(filter.limit);
      return unwrap<CarListing[]>(q);
    },
  });
}

export function useCar(id: string | undefined) {
  return useQuery({
    queryKey: ['car', id],
    enabled: !!id,
    queryFn: async () => {
      const [car, media, report] = await Promise.all([
        unwrap<CarListing>(supabase.from('car_listings').select('*').eq('id', id!).single()),
        unwrap<CarMedia[]>(supabase.from('car_media').select('id,kind,url,poster_url,caption').eq('car_id', id!).order('sort_order')),
        unwrap<ConditionReport | null>(supabase.from('condition_reports').select('*').eq('car_id', id!).maybeSingle()),
      ]);
      return { car, media, report };
    },
  });
}

export function useDeliveryStories() {
  return useQuery({
    queryKey: ['deliveries'],
    queryFn: () =>
      unwrap<DeliveryStory[]>(
        supabase.from('delivery_stories').select('id,image_url,car_label,city,caption,delivered_at').order('sort_order').limit(10),
      ),
  });
}

export function useStoreSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () =>
      unwrap<StoreSettings>(supabase.from('store_settings').select('deposit_percent,whatsapp_number,showroom_address,showroom_maps_url').single()),
    staleTime: 10 * 60_000,
  });
}
