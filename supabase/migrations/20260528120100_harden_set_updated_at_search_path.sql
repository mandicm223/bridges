-- Harden set_updated_at: pin search_path to satisfy the
-- function_search_path_mutable Supabase security advisor.
-- now() resolves via pg_catalog, which is always implicitly available.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
