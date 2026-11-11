
drop trigger if exists on_auth_user_created on auth.users;
drop table if exists user_favorites, recipes, categories, profiles cascade;

create table categories (
  id   bigint generated always as identity primary key,
  name text not null unique
);

create table profiles (
  id   uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'User',
  role text not null default 'user' check (role in ('admin', 'user'))
);

create table recipes (
  id           bigint generated always as identity primary key,
  title        text not null,
  description  text,
  cooking_time text,
  servings     int,
  ingredients  text,  
  instructions text,   
  image        text,
  image2       text,
  image3       text,
  category_id  bigint references categories(id),
  created_at   timestamptz default now()
);

create table user_favorites (
  user_id   uuid   references auth.users(id) on delete cascade,
  recipe_id bigint references recipes(id)    on delete cascade,
  primary key (user_id, recipe_id)
);

insert into categories (name) values
  ('Main Course'), ('Soup'), ('Noodles'), ('Appetizer'), ('Dessert');

create or replace function is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

create or replace function keep_at_least_one_recipe()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from deleted_rows) and not exists (select 1 from recipes) then
    raise exception 'Cannot delete the last remaining recipe';
  end if;
  return null;
end;
$$;

create trigger keep_one_recipe
after delete on recipes
referencing old table as deleted_rows
for each statement execute function keep_at_least_one_recipe();

alter table categories     enable row level security;
alter table profiles       enable row level security;
alter table recipes        enable row level security;
alter table user_favorites enable row level security;

create policy "Anyone can read categories" on categories for select using (true);
create policy "Anyone can read recipes"    on recipes    for select using (true);

create policy "Admins can add recipes"    on recipes for insert to authenticated with check (is_admin());
create policy "Admins can edit recipes"   on recipes for update to authenticated using (is_admin()) with check (is_admin());
create policy "Admins can delete recipes" on recipes for delete to authenticated using (is_admin());

create policy "Users can read own profile" on profiles for select to authenticated using (auth.uid() = id);

create policy "Users read own favorites"   on user_favorites for select to authenticated using (auth.uid() = user_id);
create policy "Users add own favorites"    on user_favorites for insert to authenticated with check (auth.uid() = user_id);
create policy "Users remove own favorites" on user_favorites for delete to authenticated using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do nothing;

create policy "Anyone can view recipe images"
  on storage.objects for select using (bucket_id = 'recipe-images');
create policy "Admins can upload recipe images"
  on storage.objects for insert to authenticated with check (bucket_id = 'recipe-images' and public.is_admin());
create policy "Admins can update recipe images"
  on storage.objects for update to authenticated using (bucket_id = 'recipe-images' and public.is_admin());
create policy "Admins can delete recipe images"
  on storage.objects for delete to authenticated using (bucket_id = 'recipe-images' and public.is_admin());


