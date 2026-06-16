-- Collect a unique username at signup, stored on the profile.
alter table public.profiles add column if not exists username text;

-- Case-insensitive uniqueness.
create unique index if not exists profiles_username_key on public.profiles (lower(username)) where username is not null;

-- Populate username from signup metadata. If the username is already taken (race
-- between the live check and submit), still create the profile without it rather
-- than aborting the whole signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1));
  v_user text := nullif(new.raw_user_meta_data ->> 'username', '');
  v_role text := coalesce(new.raw_user_meta_data ->> 'role', 'buyer');
begin
  begin
    insert into public.profiles (id, full_name, username, role)
    values (new.id, v_name, v_user, v_role)
    on conflict (id) do nothing;
  exception when unique_violation then
    insert into public.profiles (id, full_name, role)
    values (new.id, v_name, v_role)
    on conflict (id) do nothing;
  end;
  return new;
end;
$$;
