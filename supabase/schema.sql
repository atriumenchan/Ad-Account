-- Admexo Workspace: manual entries, admin writes, members can read.
-- Run once in the Supabase SQL editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text not null default '',
  company text not null default 'Admexo',
  role text not null default 'member' check (role in ('admin', 'member'))
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create table if not exists public.workspaces (
  id text primary key,
  name text not null,
  region text not null default '',
  currency text not null default 'USD'
);

create table if not exists public.ad_accounts (
  id text primary key,
  workspace_id text not null references public.workspaces (id) on delete cascade,
  name text not null,
  platform text not null,
  status text not null,
  currency text not null,
  balance numeric not null default 0,
  spend_7d numeric not null default 0,
  spend_30d numeric not null default 0,
  revenue_30d numeric not null default 0,
  business_manager text not null default '',
  page text not null default '',
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  appeal text
);

create table if not exists public.campaigns (
  id text primary key,
  account_id text not null references public.ad_accounts (id) on delete cascade,
  name text not null,
  objective text not null,
  status text not null,
  daily_budget numeric not null default 0,
  spend numeric not null default 0,
  impressions integer not null default 0,
  clicks integer not null default 0,
  conversions integer not null default 0,
  revenue numeric not null default 0,
  countries text[] not null default '{}',
  start_date date,
  end_date date
);

create table if not exists public.transactions (
  id text primary key,
  type text not null,
  amount numeric not null,
  status text not null,
  method text not null default '',
  description text not null default '',
  created_at timestamptz not null default now(),
  account_id text
);

create table if not exists public.wallet (
  id integer primary key default 1 check (id = 1),
  available numeric not null default 0,
  pending numeric not null default 0,
  cashback numeric not null default 0
);

create table if not exists public.invites (
  email text primary key,
  full_name text not null default '',
  role text not null default 'member' check (role in ('admin', 'member'))
);

insert into public.wallet (id) values (1) on conflict (id) do nothing;
insert into public.workspaces (id, name, region, currency)
values ('ws_main', 'Admexo', 'Global', 'USD')
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.ad_accounts enable row level security;
alter table public.campaigns enable row level security;
alter table public.transactions enable row level security;
alter table public.wallet enable row level security;
alter table public.invites enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.workspaces to authenticated;
grant select, insert, update, delete on public.ad_accounts to authenticated;
grant select, insert, update, delete on public.campaigns to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.wallet to authenticated;
grant select, insert, update, delete on public.invites to authenticated;

drop policy if exists profiles_read on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (public.is_admin() or (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid())));

drop policy if exists workspaces_read on public.workspaces;
drop policy if exists workspaces_write on public.workspaces;
create policy workspaces_read on public.workspaces for select to authenticated using (true);
create policy workspaces_write on public.workspaces for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists accounts_read on public.ad_accounts;
drop policy if exists accounts_write on public.ad_accounts;
create policy accounts_read on public.ad_accounts for select to authenticated using (true);
create policy accounts_write on public.ad_accounts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists campaigns_read on public.campaigns;
drop policy if exists campaigns_write on public.campaigns;
create policy campaigns_read on public.campaigns for select to authenticated using (true);
create policy campaigns_write on public.campaigns for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists transactions_read on public.transactions;
drop policy if exists transactions_write on public.transactions;
create policy transactions_read on public.transactions for select to authenticated using (true);
create policy transactions_write on public.transactions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists wallet_read on public.wallet;
drop policy if exists wallet_write on public.wallet;
create policy wallet_read on public.wallet for select to authenticated using (true);
create policy wallet_write on public.wallet for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists invites_read on public.invites;
drop policy if exists invites_write on public.invites;
create policy invites_read on public.invites for select to authenticated using (true);
create policy invites_write on public.invites for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned text;
begin
  select invites.role into assigned
  from public.invites
  where lower(invites.email) = lower(new.email);

  if lower(coalesce(new.email, '')) = 'admin@admexo.co' then
    assigned := 'admin';
  elsif assigned is null then
    if not exists (select 1 from public.profiles) then
      assigned := 'admin';
    else
      assigned := 'member';
    end if;
  end if;

  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    assigned
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Built-in logins. Safe to run more than once.
create or replace function public.ensure_hardcoded_users()
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_instance uuid;
  v_id uuid;
  v_email text;
  v_password text;
  v_name text;
  v_phone text;
  v_role text;
  rec record;
begin
  select id into v_instance from auth.instances limit 1;
  if v_instance is null then
    v_instance := '00000000-0000-0000-0000-000000000000';
  end if;

  for rec in
    select *
    from (
      values
        ('admin@admexo.co', 'Admexo2026', 'Admexo Admin', '+14155550100', 'admin'),
        ('member@admexo.co', 'Member2026', 'Admexo Member', '+14155550101', 'member')
    ) as seed(email, password, full_name, phone, role)
  loop
    v_email := rec.email;
    v_password := rec.password;
    v_name := rec.full_name;
    v_phone := rec.phone;
    v_role := rec.role;

    select id into v_id from auth.users where lower(email) = lower(v_email);
    if v_id is null then
      v_id := gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
      ) values (
        v_instance,
        v_id,
        'authenticated',
        'authenticated',
        v_email,
        crypt(v_password, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name, 'phone', v_phone),
        now(),
        now(),
        '',
        '',
        '',
        ''
      );
      insert into auth.identities (
        id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(),
        v_id,
        jsonb_build_object('sub', v_id::text, 'email', v_email),
        'email',
        v_id::text,
        now(),
        now(),
        now()
      );
    else
      update auth.users
      set
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        encrypted_password = crypt(v_password, gen_salt('bf')),
        raw_user_meta_data = jsonb_build_object('full_name', v_name, 'phone', v_phone),
        updated_at = now()
      where id = v_id;
    end if;

    insert into public.profiles (id, email, full_name, phone, company, role)
    values (v_id, v_email, v_name, v_phone, 'Admexo', v_role)
    on conflict (id) do update
      set role = excluded.role,
          full_name = excluded.full_name,
          phone = excluded.phone,
          email = excluded.email;
  end loop;

  if not exists (select 1 from public.ad_accounts) then
    insert into public.ad_accounts (
      id, workspace_id, name, platform, status, currency, balance, spend_7d, spend_30d, revenue_30d,
      business_manager, page, timezone, created_at
    ) values (
      'acc_main', 'ws_main', 'Main account', 'Meta', 'active', 'USD', 5000, 1200, 4800, 14400,
      'Admexo', 'Admexo', 'UTC', now()
    );
    insert into public.campaigns (
      id, account_id, name, objective, status, daily_budget, spend, impressions, clicks, conversions, revenue, countries, start_date
    ) values (
      'cmp_main', 'acc_main', 'Prospecting', 'Sales', 'active', 200, 1200, 180000, 2400, 80, 3600, array['United States'], current_date
    );
    update public.wallet set available = 10000, pending = 0, cashback = 0 where id = 1;
  end if;
end;
$$;

grant execute on function public.ensure_hardcoded_users() to anon, authenticated;
