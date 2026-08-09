-- IRIS production baseline schema. Apply through Supabase MCP.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  domain text not null check (domain = lower(domain) and length(domain) between 1 and 253),
  status text not null default 'queued' check (status in ('queued','running','complete','failed')),
  risk_score integer check (risk_score between 0 and 100),
  mail_provider text check (mail_provider in ('google_workspace','microsoft_365','zoho','self_hosted','unknown')),
  requested_by_ip inet,
  error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.findings (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  category text not null check (category in ('subdomain_exposure','open_port','ssl_tls','dns_misconfig','credential_leak','email_auth','mfa_readiness')),
  severity text not null check (severity in ('info','low','medium','high','critical')),
  title text not null,
  description text not null,
  weight integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.mfa_checklist_progress (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.scans(id) on delete cascade,
  step_key text not null,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (scan_id, step_key)
);

create table if not exists public.hygiene_checks (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null,
  breach_count integer not null default 0 check (breach_count >= 0),
  quiz_score integer check (quiz_score between 0 and 100),
  hygiene_score integer check (hygiene_score between 0 and 100),
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid references public.scans(id) on delete set null,
  contact_email text not null,
  organisation text,
  risk_score integer check (risk_score between 0 and 100),
  status text not null default 'new' check (status in ('new','contacted','qualified','converted','dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists scans_domain_idx on public.scans(domain);
create index if not exists scans_owner_idx on public.scans(owner_id);
create index if not exists scans_status_created_idx on public.scans(status, created_at);
create index if not exists findings_scan_idx on public.findings(scan_id);
create index if not exists hygiene_checks_created_idx on public.hygiene_checks(created_at);

alter table public.profiles enable row level security;
alter table public.scans enable row level security;
alter table public.findings enable row level security;
alter table public.mfa_checklist_progress enable row level security;
alter table public.hygiene_checks enable row level security;
alter table public.leads enable row level security;

create policy profiles_owner_select on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_owner_update on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy profiles_owner_insert on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy scans_select_own on public.scans for select to authenticated using ((select auth.uid()) = owner_id);
create policy scans_insert_own on public.scans for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy findings_select_own_scan on public.findings for select to authenticated using (exists (select 1 from public.scans s where s.id = findings.scan_id and s.owner_id = (select auth.uid())));
create policy mfa_progress_select_own_scan on public.mfa_checklist_progress for select to authenticated using (exists (select 1 from public.scans s where s.id = mfa_checklist_progress.scan_id and s.owner_id = (select auth.uid())));
create policy mfa_progress_insert_own_scan on public.mfa_checklist_progress for insert to authenticated with check (exists (select 1 from public.scans s where s.id = mfa_checklist_progress.scan_id and s.owner_id = (select auth.uid())));
create policy mfa_progress_update_own_scan on public.mfa_checklist_progress for update to authenticated using (exists (select 1 from public.scans s where s.id = mfa_checklist_progress.scan_id and s.owner_id = (select auth.uid()))) with check (exists (select 1 from public.scans s where s.id = mfa_checklist_progress.scan_id and s.owner_id = (select auth.uid())));
create policy hygiene_checks_insert_anon on public.hygiene_checks for insert to anon, authenticated with check (true);
create policy leads_insert_anon on public.leads for insert to anon, authenticated with check (true);
create policy leads_select_admin on public.leads for select to authenticated using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

create or replace function public.handle_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
create trigger on_profiles_updated before update on public.profiles for each row execute function public.handle_updated_at();
create trigger on_scans_updated before update on public.scans for each row execute function public.handle_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$ begin insert into public.profiles(id, display_name) values (new.id, split_part(coalesce(new.email,''),'@',1)) on conflict (id) do nothing; return new; end; $$;
revoke all on function public.handle_new_user() from public;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
