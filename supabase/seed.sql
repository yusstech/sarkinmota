-- DEMO DATA for local development only. Prices, VINs, condition reports and delivery stories
-- are placeholders, not SarkinMota's real inventory. Photos: Unsplash License (unsplash.com/license).

insert into public.categories (name, slug, image_url, sort_order) values
  ('Executive Class',     'executive-class',  'https://images.unsplash.com/photo-1584978591559-8b58d6e5089f?w=800&q=80&auto=format&fit=crop', 1),
  ('Premium SUVs',        'premium-suvs',     'https://images.unsplash.com/photo-1759505738499-8c9b26c1b7e7?w=800&q=80&auto=format&fit=crop', 2),
  ('Sport & Performance', 'sport-performance','https://images.unsplash.com/photo-1642056095922-7ade96f52674?w=800&q=80&auto=format&fit=crop', 3),
  ('Electric',            'electric',         'https://images.unsplash.com/photo-1683743407090-71803be0b4e0?w=800&q=80&auto=format&fit=crop', 4),
  ('Power Bikes',         'power-bikes',      'https://images.unsplash.com/photo-1753476981086-d16060e71e35?w=800&q=80&auto=format&fit=crop', 5),
  ('Executive Buses',     'executive-buses',  'https://images.unsplash.com/photo-1535655685871-dc8158ff167e?w=800&q=80&auto=format&fit=crop', 6);

insert into public.brands (name, slug, sort_order) values
  ('Rolls-Royce','rolls-royce',1), ('Mercedes-Benz','mercedes-benz',2), ('Land Rover','land-rover',3),
  ('Lamborghini','lamborghini',4), ('Lexus','lexus',5), ('Bentley','bentley',6), ('Tesla','tesla',7),
  ('BMW','bmw',8), ('Ducati','ducati',9), ('Ferrari','ferrari',10);

update public.store_settings set
  showroom_address = 'Beside NNPC Mega Station, Central Business District, Abuja';

-- Helper for seeding only: insert a car and its photos, return its id.
create or replace function pg_temp.car(
  p_brand text, p_category text, p_model text, p_trim text, p_year int, p_condition public.car_condition,
  p_km int, p_price bigint, p_specs jsonb, p_photos text[], p_extra jsonb default '{}'::jsonb, p_days_ago int default 1
) returns uuid language plpgsql as $$
declare v_id uuid; i int;
begin
  insert into public.cars (
    brand_id, category_id, model, trim, year, condition, mileage_km, price_ngn,
    body_type, engine, horsepower, transmission, drivetrain, fuel, exterior_color, interior_color, seats,
    vin_last6, headline, description, scarcity_note, is_rare, plan_eligible,
    customs_cleared, registration_status, papers_included, included, delivery_estimate,
    status, published_at)
  values (
    (select id from public.brands where slug = p_brand),
    (select id from public.categories where slug = p_category),
    p_model, p_trim, p_year, p_condition, p_km, p_price,
    p_specs->>'body', p_specs->>'engine', (p_specs->>'hp')::int, p_specs->>'trans', p_specs->>'drive',
    p_specs->>'fuel', p_specs->>'ext', p_specs->>'int', (p_specs->>'seats')::int,
    upper(substr(md5(p_model || p_year), 1, 6)),
    p_extra->>'headline', p_extra->>'description', p_extra->>'scarcity',
    coalesce((p_extra->>'rare')::boolean, false), coalesce((p_extra->>'plan')::boolean, true),
    coalesce((p_extra->>'customs')::boolean, true),
    coalesce(p_extra->>'reg', 'included'),
    array['Customs duty receipt', 'Bill of lading', 'Proof of ownership'],
    coalesce((select array_agg(x) from jsonb_array_elements_text(p_extra->'included') x),
             array['Registration & plates', 'Full detailing before delivery', 'Full tank on delivery']),
    'Abuja: 24–48 hours · Lagos & other states: 3–5 days',
    coalesce((p_extra->>'status')::public.car_status, 'available'),
    now() - make_interval(days => p_days_ago))
  returning id into v_id;

  for i in 1 .. array_length(p_photos, 1) loop
    insert into public.car_media (car_id, kind, url, sort_order)
    values (v_id, 'image', p_photos[i] || '?w=1600&q=80&auto=format&fit=crop', i);
  end loop;

  -- Standard inspection checklist; cars flagged with "attention" get one honest note.
  insert into public.condition_reports (car_id, inspected_at, inspector, overall, summary, disclosed_issues, items)
  values (
    v_id, current_date - (p_days_ago + 2), 'SarkinMota Inspection Team',
    coalesce(p_extra->>'overall', case when p_km = 0 then 'excellent' else 'very_good' end),
    p_extra->>'summary',
    coalesce((select array_agg(x) from jsonb_array_elements_text(p_extra->'issues') x), '{}'),
    jsonb_build_array(
      jsonb_build_object('section','Exterior','item','Paint & panels','status','pass'),
      jsonb_build_object('section','Exterior','item','Glass & mirrors','status','pass'),
      jsonb_build_object('section','Exterior','item','Lights','status','pass'),
      jsonb_build_object('section','Exterior','item','Wheels & tyres','status', case when p_extra ? 'issues' then 'attention' else 'pass' end,
                         'note', case when p_extra ? 'issues' then p_extra->'issues'->>0 end),
      jsonb_build_object('section','Interior','item','Seats & trim','status','pass'),
      jsonb_build_object('section','Interior','item','Infotainment & screens','status','pass'),
      jsonb_build_object('section','Interior','item','Climate control','status','pass'),
      jsonb_build_object('section','Mechanical','item','Engine start & idle','status','pass'),
      jsonb_build_object('section','Mechanical','item','Transmission','status','pass'),
      jsonb_build_object('section','Mechanical','item','Brakes','status','pass'),
      jsonb_build_object('section','Mechanical','item','Suspension','status','pass'),
      jsonb_build_object('section','Electronics','item','Diagnostic scan (no fault codes)','status','pass'),
      jsonb_build_object('section','Electronics','item','Keys & remotes','status','pass'),
      jsonb_build_object('section','Road test','item','Road test','status','pass')
    ));
  return v_id;
end $$;

do $$
declare cullinan uuid; sf90 uuid; g63 uuid; urus uuid;
begin
  cullinan := pg_temp.car('rolls-royce','premium-suvs','Cullinan','Black Badge',2024,'foreign_used',6200, 850000000,
    '{"body":"SUV","engine":"6.75L twin-turbo V12","hp":592,"trans":"8-speed automatic","drive":"AWD","fuel":"Petrol","ext":"Diamond Black","int":"Mandarin leather","seats":5}',
    array['https://images.unsplash.com/photo-1772990915311-0710c4e7e74a','https://images.unsplash.com/photo-1689010088367-af31b12b52d9','https://images.unsplash.com/photo-1625510872834-7db6c4273870','https://images.unsplash.com/photo-1695334650970-21f964219461'],
    '{"headline":"The quietest room in Abuja, on four wheels.","description":"One owner, full Rolls-Royce service history. Starlight headliner, rear theatre configuration, Bespoke Audio.","scarcity":"Only 2 in Nigeria","rare":true,"summary":"As-new condition throughout. Full dealer service history.","overall":"excellent","included":["Registration & plates","Full detailing before delivery","Chauffeur handover walkthrough"]}', 1);

  sf90 := pg_temp.car('ferrari','sport-performance','SF90 Stradale','Assetto Fiorano',2023,'foreign_used',3100, 950000000,
    '{"body":"Coupé","engine":"4.0L twin-turbo V8 hybrid","hp":986,"trans":"8-speed dual-clutch","drive":"AWD","fuel":"Plug-in hybrid","ext":"Rosso Corsa","int":"Nero Alcantara","seats":2}',
    array['https://images.unsplash.com/photo-1642056095922-7ade96f52674','https://images.unsplash.com/photo-1708516893277-232fb2bfb198','https://images.unsplash.com/photo-1678026607507-b55a699aa80d','https://images.unsplash.com/photo-1675426513303-1d094c26cc92'],
    '{"headline":"986 horsepower. Zero to 100 in 2.5 seconds.","scarcity":"Only one in West Africa","rare":true,"plan":false,"summary":"Collector-grade. Paint protection film fitted from new."}', 2);

  g63 := pg_temp.car('mercedes-benz','premium-suvs','G 63','AMG',2024,'brand_new',0, 450000000,
    '{"body":"SUV","engine":"4.0L twin-turbo V8","hp":577,"trans":"9-speed automatic","drive":"4MATIC","fuel":"Petrol","ext":"Obsidian Black","int":"Black Nappa","seats":5}',
    array['https://images.unsplash.com/photo-1759505738499-8c9b26c1b7e7','https://images.unsplash.com/photo-1634636208509-63bcd2a1b13f','https://images.unsplash.com/photo-1709072245743-8db1c97e457c'],
    '{"headline":"Brand new, zero kilometres, ready for your plates."}', 3);

  urus := pg_temp.car('lamborghini','sport-performance','Urus','Performante',2023,'foreign_used',9800, 520000000,
    '{"body":"SUV","engine":"4.0L twin-turbo V8","hp":657,"trans":"8-speed automatic","drive":"AWD","fuel":"Petrol","ext":"Viola Pasifae (purple)","int":"Nero Ade","seats":5}',
    array['https://images.unsplash.com/photo-1773266110293-380325e192ae','https://images.unsplash.com/photo-1746151890879-5a1f648855e9','https://images.unsplash.com/photo-1575650681837-c0ca3b1e7275','https://images.unsplash.com/photo-1745196068411-a395e0b2c5b3'],
    '{"headline":"A super SUV that will still do the school run.","issues":["Light kerb scuff on rear-left wheel (to be refinished before delivery)"],"overall":"very_good"}', 4);

  perform pg_temp.car('land-rover','premium-suvs','Range Rover','Autobiography LWB',2023,'foreign_used',14500, 380000000,
    '{"body":"SUV","engine":"4.4L twin-turbo V8","hp":523,"trans":"8-speed automatic","drive":"AWD","fuel":"Petrol","ext":"Santorini Black","int":"Caraway leather","seats":5}',
    array['https://images.unsplash.com/photo-1652741938599-42b4aa7f1259'],
    '{"headline":"Long wheelbase, executive rear seats, massage in every seat."}', 5);

  perform pg_temp.car('lexus','premium-suvs','LX 570','Sport',2021,'nigerian_used',38000, 165000000,
    '{"body":"SUV","engine":"5.7L V8","hp":383,"trans":"8-speed automatic","drive":"4WD","fuel":"Petrol","ext":"Pearl White","int":"Saddle Tan","seats":8}',
    array['https://images.unsplash.com/photo-1570523986973-787a8f2c004b'],
    '{"headline":"The Abuja favourite: unstoppable, comfortable, easy to maintain.","reg":"registered","overall":"good","issues":["Front tyres at 40% tread (replacement offered at cost)"]}', 6);

  perform pg_temp.car('mercedes-benz','executive-class','S 580','Maybach',2023,'foreign_used',11200, 280000000,
    '{"body":"Saloon","engine":"4.0L twin-turbo V8 mild hybrid","hp":496,"trans":"9-speed automatic","drive":"4MATIC","fuel":"Petrol","ext":"Obsidian Black","int":"Macchiato Nappa","seats":4}',
    array['https://images.unsplash.com/photo-1584978591559-8b58d6e5089f'],
    '{"headline":"Executive rear seating with reclining chauffeur package."}', 2);

  perform pg_temp.car('bentley','executive-class','Bentayga','EWB Azure',2024,'foreign_used',4800, 420000000,
    '{"body":"SUV","engine":"4.0L twin-turbo V8","hp":542,"trans":"8-speed automatic","drive":"AWD","fuel":"Petrol","ext":"Glacier White","int":"Beluga & Linen","seats":4}',
    array['https://images.unsplash.com/photo-1712385592326-383dcf3fbe35','https://images.unsplash.com/photo-1643398015757-46c17c2745a3'],
    '{"headline":"Airline Seat Specification rear seats. Built for being driven.","scarcity":"Only 3 in Nigeria","rare":true}', 7);

  perform pg_temp.car('bmw','premium-suvs','X7','M60i',2023,'foreign_used',16700, 230000000,
    '{"body":"SUV","engine":"4.4L twin-turbo V8","hp":523,"trans":"8-speed automatic","drive":"xDrive","fuel":"Petrol","ext":"Carbon Black","int":"Tartufo Merino","seats":7}',
    array['https://images.unsplash.com/photo-1638980701292-11fa1ca2e41e','https://images.unsplash.com/photo-1548087713-b1fdffcfddff'],
    '{"headline":"Seven seats, sports-car pace.","status":"reserved"}', 8);

  perform pg_temp.car('tesla','electric','Model X','Plaid',2023,'foreign_used',12900, 190000000,
    '{"body":"SUV","engine":"Tri-motor electric","hp":1020,"trans":"Single-speed","drive":"AWD","fuel":"Electric","ext":"Ultra Red","int":"White","seats":6}',
    array['https://images.unsplash.com/photo-1683743407090-71803be0b4e0','https://images.unsplash.com/photo-1722611127433-d18df9ae119f'],
    '{"headline":"Falcon-wing doors, 1,020 hp, no more fuel queues.","included":["Registration & plates","Home wall charger installed","Full detailing before delivery"]}', 3);

  perform pg_temp.car('mercedes-benz','executive-buses','Sprinter','VIP Executive 9-seat',2024,'brand_new',0, 145000000,
    '{"body":"Van","engine":"3.0L V6 diesel","hp":188,"trans":"9-speed automatic","drive":"RWD","fuel":"Diesel","ext":"Obsidian Black","int":"Captain chairs, black leather","seats":9}',
    array['https://images.unsplash.com/photo-1535655685871-dc8158ff167e','https://images.unsplash.com/photo-1688619102322-cee55c13f89e'],
    '{"headline":"A boardroom that moves: captain chairs, partition, Starlink-ready."}', 9);

  perform pg_temp.car('bmw','power-bikes','S 1000 RR','M Package',2024,'brand_new',0, 48000000,
    '{"body":"Superbike","engine":"999cc inline-4","hp":207,"trans":"6-speed","drive":"Chain","fuel":"Petrol","ext":"Light White / M Motorsport","seats":2}',
    array['https://images.unsplash.com/photo-1753476981086-d16060e71e35','https://images.unsplash.com/photo-1657695721053-54b2df2fb5f3'],
    '{"headline":"207 hp, carbon wheels, M package.","included":["Registration & plates","Two helmets","Delivery by covered truck"]}', 4);

  perform pg_temp.car('ducati','power-bikes','Panigale V4','S',2023,'foreign_used',2100, 55000000,
    '{"body":"Superbike","engine":"1103cc V4","hp":215,"trans":"6-speed","drive":"Chain","fuel":"Petrol","ext":"Ducati Red","seats":2}',
    array['https://images.unsplash.com/photo-1615172282427-9a57ef2d142e'],
    '{"headline":"Öhlins suspension, Akrapovič exhaust."}', 10);

  insert into public.hero_slides (kind, media_url, eyebrow, headline, car_id, sort_order) values
    ('image', 'https://images.unsplash.com/photo-1772990915311-0710c4e7e74a?w=1600&q=80&auto=format&fit=crop', 'Just arrived', 'Rolls-Royce Cullinan Black Badge', cullinan, 1),
    ('image', 'https://images.unsplash.com/photo-1642056095922-7ade96f52674?w=1600&q=80&auto=format&fit=crop', 'Only one in West Africa', 'Ferrari SF90 Stradale', sf90, 2),
    ('image', 'https://images.unsplash.com/photo-1759505738499-8c9b26c1b7e7?w=1600&q=80&auto=format&fit=crop', 'Brand new · 40% available', 'Mercedes-AMG G 63', g63, 3),
    ('image', 'https://images.unsplash.com/photo-1773266110293-380325e192ae?w=1600&q=80&auto=format&fit=crop', 'Sport & Performance', 'Lamborghini Urus Performante', urus, 4);
end $$;

insert into public.delivery_stories (image_url, car_label, city, caption, delivered_at, sort_order) values
  ('https://images.unsplash.com/photo-1689010088367-af31b12b52d9?w=1000&q=80&auto=format&fit=crop', '2023 Rolls-Royce Cullinan', 'Abuja',  'Demo story. Replace with real handover photos.', current_date - 12, 1),
  ('https://images.unsplash.com/photo-1634636208509-63bcd2a1b13f?w=1000&q=80&auto=format&fit=crop', '2024 Mercedes-AMG G 63',    'Lagos',  'Demo story. Replace with real handover photos.', current_date - 20, 2),
  ('https://images.unsplash.com/photo-1548087713-b1fdffcfddff?w=1000&q=80&auto=format&fit=crop',  '2023 BMW X7',               'Kano',   'Demo story. Replace with real handover photos.', current_date - 31, 3);
