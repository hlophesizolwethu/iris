# IRIS — Identity Risk & Intelligence Shield

Free, public exposure-scanning platform from MetaPhoenix Tech. Phase 1 scope, per the
IRIS Technical Spec: domain scanning (email-auth checks: SPF/DKIM/DMARC), a deterministic
explainable risk score, and credential-free guided MFA setup walkthroughs.

## What's implemented in this scaffold

- Full Supabase schema with RLS on every table (`supabase/migrations/001_initial.sql`)
- Passive DNS-based email-auth + MFA-readiness detection (`apps/web/lib/scanEngine/dnsChecks.ts`)
- Deterministic, explainable risk scoring engine (`apps/web/lib/scanEngine/riskScore.ts`)
- Provider-specific MFA guided setup content — Google Workspace, Microsoft 365, Zoho,
  self-hosted, and a generic fallback (`apps/web/lib/mfa/providerGuides.ts`)
- Scan submission API route wiring detection → scoring → storage (`apps/web/app/api/scan/route.ts`)
- Landing page, scan report page, and an interactive MFA checklist component

## What's intentionally NOT in this scaffold yet

These are called out as follow-ups so the Phase 1 story stays honest about scope:

- **Subdomain enumeration, port scanning, breach-data lookups** — heavier checks that
  belong in a queued background job, not the synchronous API route used here for the
  DNS checks. Wire these in via Supabase Edge Functions or a small worker service once
  a job queue (e.g. `pg_cron` + a `scan_jobs` table, or a hosted queue) is chosen.
- **Rate limiting / abuse prevention** — required before public launch (Section 8 of
  the spec). Add at the edge (Vercel's built-in rate limiting, or Upstash Redis) rather
  than in application code.
- **Auth screens (sign in / sign up)** — anonymous scanning works today; add these once
  "saved scan history" is prioritised.
- **Public aggregate dashboard** — reads from `hygiene_checks` / `scans` need a
  service-role scheduled job to compute anonymised aggregates; not yet built.
- **Lead-routing automation** — `leads` table exists; wiring it to an actual CRM/email
  handoff is a follow-up.

## Local setup

1. Create a Supabase project, then run the migration:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```
2. Copy `apps/web/.env.example` to `apps/web/.env.local` and fill in your Supabase URL,
   anon key, and service role key (Project Settings → API in the Supabase dashboard).
3. Install dependencies from the repo root:
   ```bash
   npm install
   ```
4. Regenerate types against your real schema (replace the placeholder):
   ```bash
   supabase gen types typescript --project-id <your-project-id> > packages/types/database.types.ts
   ```
5. Run the dev server:
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`, submit a domain, and confirm a report renders at
   `/scan/[id]` with findings and the MFA checklist.

## Next steps checklist

- [ ] Stand up the Supabase project and run the migration
- [ ] Wire a real breach-lookup API (HaveIBeenPwned or similar) — budget line item per spec
- [ ] Move subdomain/port scanning to a queued worker
- [ ] Add rate limiting before any public traffic
- [ ] Build the public hygiene-check flow (`hygiene_checks` table already exists)
- [ ] Build the public aggregate threat dashboard (CyberWatch feed reuse)
