-- Съвместимост: някои среди имат `sort_order`, а кодът ползва `order_index`.
alter table public.gallery
  add column if not exists order_index integer not null default 0;

-- Ако има старо поле `sort_order`, прехвърляме стойностите при нужда.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'gallery' and column_name = 'sort_order'
  ) then
    update public.gallery
    set order_index = coalesce(sort_order, 0)
    where order_index is null or order_index = 0;
  end if;
end
$$;

create index if not exists idx_gallery_salon_order on public.gallery (salon_slug, order_index);
