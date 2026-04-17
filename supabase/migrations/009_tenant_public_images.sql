alter table public.tenants
  add column if not exists hero_image_url text,
  add column if not exists about_image_url text;
