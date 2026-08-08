-- IRIS (Identity Risk & Intelligence Shield) — initial schema
-- Convention: uuid PKs, RLS enabled on every table, created_at/updated_at everywhere.

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- profiles — optional account for users who want saved history / re-scans
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role         text not null default 'user' check (role in ('user', 'admin')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_owner_select"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_owner_update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_owner_insert"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- scans — one row per domain submitted to the Business Exposure Scanner
-- owner_id is nullable: anonymous scans are allowed (see Section 3.1 of spec)
-- ---------------------------------------------------------------------------
create table public.scans (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid references public.profiles(id) on delete set null,
  domain       text not null,
  status       text not null default 'queued'
               check (status in ('queued', 'running', 'complete', 'failed')),
  risk_score   integer check (risk_score between 0 and 100),
  mail_provider text check (mail_provider in (
                 'google_workspace', 'microsoft_365', 'zoho', 'self_hosted', 'unknown'
               )),
  requested_by_ip inet,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.scans enable row level security;

-- Anonymous scans are readable by anyone holding the scan id (share links);
-- owned scans are private to the owner. We enforce "holding the id" at the
-- application layer (ids are unguessable uuids) and restrict listing here.
create policy "scans_select_own_or_anonymous"
  on public.scans for select
  using (owner_id is null or owner_id = auth.uid());

create policy "scans_insert_any"
  on public.scans for insert
  with check (owner_id is null or owner_id = auth.uid());

create policy "scans_update_service_role_only"
  on public.scans for update
  using (auth.role() = 'service_role');

create index scans_domain_idx on public.scans (domain);
create index scans_owner_idx on public.scans (owner_id);

-- ---------------------------------------------------------------------------
-- findings — individual issues discovered during a scan
-- ---------------------------------------------------------------------------
create table public.findings (
  id          uuid primary key default gen_random_uuid(),
  scan_id     uuid not null references public.scans(id) on delete cascade,
  category    text not null check (category in (
                'subdomain_exposure', 'open_port', 'ssl_tls', 'dns_misconfig',
                'credential_leak', 'email_auth', 'mfa_readiness'
              )),
  severity    text not null check (severity in ('info', 'low', 'medium', 'high', 'critical')),
  title       text not null,
  description text not null,
  weight      integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.findings enable row level security;

create policy "findings_select_via_scan"
  on public.findings for select
  using (
    exists (
      select 1 from public.scans s
      where s.id = findings.scan_id
        and (s.owner_id is null or s.owner_id = auth.uid())
    )
  );

create policy "findings_insert_service_role_only"
  on public.findings for insert
  with check (auth.role() = 'service_role');

create index findings_scan_idx on public.findings (scan_id);

-- ---------------------------------------------------------------------------
-- mfa_checklist_progress — tracks which guided MFA steps a user has completed
-- for a given scan. Detection + guidance only — never stores credentials.
-- ---------------------------------------------------------------------------
create table public.mfa_checklist_progress (
  id          uuid primary key default gen_random_uuid(),
  scan_id     uuid not null references public.scans(id) on delete cascade,
  step_key    text not null,
  completed   boolean not null default false,
  updated_at  timestamptz not null default now(),
  unique (scan_id, step_key)
);

alter table public.mfa_checklist_progress enable row level security;

create policy "mfa_progress_select_via_scan"
  on public.mfa_checklist_progress for select
  using (
    exists (
      select 1 from public.scans s
      where s.id = mfa_checklist_progress.scan_id
        and (s.owner_id is null or s.owner_id = auth.uid())
    )
  );

create policy "mfa_progress_upsert_via_scan"
  on public.mfa_checklist_progress for insert
  with check (
    exists (
      select 1 from public.scans s
      where s.id = mfa_checklist_progress.scan_id
        and (s.owner_id is null or s.owner_id = auth.uid())
    )
  );

create policy "mfa_progress_update_via_scan"
  on public.mfa_checklist_progress for update
  using (
    exists (
      select 1 from public.scans s
      where s.id = mfa_checklist_progress.scan_id
        and (s.owner_id is null or s.owner_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- hygiene_checks — the lightweight public-facing personal check
-- ---------------------------------------------------------------------------
create table public.hygiene_checks (
  id            uuid primary key default gen_random_uuid(),
  email_hash    text not null, -- sha256 of lowercased email; raw email never stored
  breach_count  integer not null default 0,
  quiz_score    integer check (quiz_score between 0 and 100),
  hygiene_score integer check (hygiene_score between 0 and 100),
  created_at    timestamptz not null default now()
);

alter table public.hygiene_checks enable row level security;

create policy "hygiene_checks_insert_any"
  on public.hygiene_checks for insert
  with check (true);

-- No public select policy — results are returned directly from the insert
-- response to the requester and are not queryable afterward. Aggregate,
-- anonymised stats for the public dashboard are computed via a service-role
-- scheduled job, not client-side queries.

-- ---------------------------------------------------------------------------
-- leads — qualified handoff to the AegisAgent sales funnel
-- ---------------------------------------------------------------------------
create table public.leads (
  id           uuid primary key default gen_random_uuid(),
  scan_id      uuid references public.scans(id) on delete set null,
  contact_email text not null,
  organisation  text,
  risk_score    integer,
  status        text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'converted', 'dismissed')),
  created_at    timestamptz not null default now()
);

alter table public.leads enable row level security;

create policy "leads_insert_any"
  on public.leads for insert
  with check (true);

create policy "leads_select_admin_only"
  on public.leads for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- updated_at trigger, reused across tables
-- ---------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger on_scans_updated
  before update on public.scans
  for each row execute procedure public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- auto-create profile on signup (optional accounts)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
