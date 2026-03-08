create extension if not exists pgcrypto;

create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  visitor_id text,
  query text not null,
  category_id integer,
  island text,
  results_count integer,
  created_at timestamptz not null default timezone('utc', now()),
  constraint search_history_identity_check check (user_id is not null or visitor_id is not null),
  constraint search_history_query_check check (char_length(trim(query)) >= 2)
);

create table if not exists public.product_click_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  visitor_id text,
  product_id uuid not null references public.products(id) on delete cascade,
  source text not null default 'unknown',
  created_at timestamptz not null default timezone('utc', now()),
  constraint product_click_history_identity_check check (user_id is not null or visitor_id is not null)
);

create index if not exists search_history_user_created_idx on public.search_history (user_id, created_at desc);
create index if not exists search_history_visitor_created_idx on public.search_history (visitor_id, created_at desc);
create index if not exists product_click_history_user_created_idx on public.product_click_history (user_id, created_at desc);
create index if not exists product_click_history_visitor_created_idx on public.product_click_history (visitor_id, created_at desc);
create index if not exists product_click_history_product_idx on public.product_click_history (product_id, created_at desc);

alter table public.search_history enable row level security;
alter table public.product_click_history enable row level security;

create or replace function public.log_search_history(
  p_query text,
  p_category_id integer default null,
  p_island text default null,
  p_results_count integer default null,
  p_visitor_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_query is null or char_length(trim(p_query)) < 2 then
    return;
  end if;

  insert into public.search_history (user_id, visitor_id, query, category_id, island, results_count)
  values (
    auth.uid(),
    nullif(trim(p_visitor_id), ''),
    trim(p_query),
    p_category_id,
    nullif(trim(p_island), ''),
    p_results_count
  );
end;
$$;

create or replace function public.log_product_click(
  p_product_id uuid,
  p_source text default 'unknown',
  p_visitor_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_product_id is null then
    return;
  end if;

  insert into public.product_click_history (user_id, visitor_id, product_id, source)
  values (
    auth.uid(),
    nullif(trim(p_visitor_id), ''),
    p_product_id,
    coalesce(nullif(trim(p_source), ''), 'unknown')
  );
end;
$$;

create or replace function public.get_personalization_snapshot(
  p_visitor_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_recent_searches text[] := '{}'::text[];
  v_clicked_product_ids uuid[] := '{}'::uuid[];
  v_viewed_product_ids uuid[] := '{}'::uuid[];
  v_favorite_product_ids uuid[] := '{}'::uuid[];
  v_preferred_categories integer[] := '{}'::integer[];
  v_preferred_sub_categories text[] := '{}'::text[];
  v_preferred_islands text[] := '{}'::text[];
  v_average_price numeric := null;
begin
  select coalesce(array_agg(searches.query order by searches.created_at desc), '{}'::text[])
    into v_recent_searches
  from (
    select trim(query) as query, max(created_at) as created_at
    from public.search_history
    where (v_user_id is not null and user_id = v_user_id)
       or (v_user_id is null and p_visitor_id is not null and visitor_id = p_visitor_id)
    group by trim(query)
    order by max(created_at) desc
    limit 10
  ) searches;

  if v_user_id is not null then
    select coalesce(array_agg(product_id), '{}'::uuid[])
      into v_favorite_product_ids
    from public.favorites
    where user_id = v_user_id;

    select coalesce(array_agg(product_id order by created_at desc), '{}'::uuid[])
      into v_viewed_product_ids
    from (
      select product_id, created_at
      from public.product_views
      where viewer_id = v_user_id
      order by created_at desc
      limit 30
    ) views;
  end if;

  select coalesce(array_agg(clicks.product_id order by clicks.created_at desc), '{}'::uuid[])
    into v_clicked_product_ids
  from (
    select product_id, created_at
    from public.product_click_history
    where (v_user_id is not null and user_id = v_user_id)
       or (v_user_id is null and p_visitor_id is not null and visitor_id = p_visitor_id)
    order by created_at desc
    limit 30
  ) clicks;

  with interaction_products as (
    select p.category_id, p.sub_category, p.location_island, p.price
    from public.products p
    join public.product_click_history clicks on clicks.product_id = p.id
    where (v_user_id is not null and clicks.user_id = v_user_id)
       or (v_user_id is null and p_visitor_id is not null and clicks.visitor_id = p_visitor_id)

    union all

    select p.category_id, p.sub_category, p.location_island, p.price
    from public.products p
    join public.product_views views on views.product_id = p.id
    where v_user_id is not null and views.viewer_id = v_user_id

    union all

    select p.category_id, p.sub_category, p.location_island, p.price
    from public.products p
    join public.favorites favorites on favorites.product_id = p.id
    where v_user_id is not null and favorites.user_id = v_user_id
  )
  select
    coalesce(array_agg(category_id), '{}'::integer[]),
    coalesce(array_agg(sub_category), '{}'::text[]),
    coalesce(array_agg(location_island), '{}'::text[]),
    avg(price)
  into v_preferred_categories, v_preferred_sub_categories, v_preferred_islands, v_average_price
  from interaction_products;

  return jsonb_build_object(
    'recent_searches', v_recent_searches,
    'clicked_product_ids', v_clicked_product_ids,
    'viewed_product_ids', v_viewed_product_ids,
    'favorite_product_ids', v_favorite_product_ids,
    'preferred_categories', v_preferred_categories,
    'preferred_sub_categories', v_preferred_sub_categories,
    'preferred_islands', v_preferred_islands,
    'average_price', v_average_price
  );
end;
$$;

grant execute on function public.log_search_history(text, integer, text, integer, text) to anon, authenticated;
grant execute on function public.log_product_click(uuid, text, text) to anon, authenticated;
grant execute on function public.get_personalization_snapshot(text) to anon, authenticated;
