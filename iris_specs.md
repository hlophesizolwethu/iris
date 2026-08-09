METAPHOENIX TECH (PTY) LTD
AI-Augmented Cybersecurity  —  Kingdom of Eswatini
IRIS
Identity Risk & Intelligence Shield
Free Public Threat Intelligence, Exposure & Identity-Security Platform
Technical & Product Specification — v1.0
Prepared for internal review — Founders & Functional Leads  |  August 2026
1. Executive Summary
MetaPhoenix Tech has strong technology (AegisAgent) and a strong narrative, but investors keep asking the same question: where is the proof? We have no live user base, no independent validation, and no traction metrics to point to — which makes the pitch a claim rather than a demonstration.
IRIS is proposed as a free, public-facing platform that puts a real slice of AegisAgent's detection capability directly in front of businesses and the public at no cost. It exists to generate three things simultaneously: (1) traction — signed-up users and scans run, (2) validation — real detections against real infrastructure, not staged demos, and (3) a pipeline — free users who convert into paying AegisAgent customers.
The platform combines two things MetaPhoenix has already built: the CyberWatch threat-intelligence dashboard and AegisAgent's Hunter-agent reconnaissance capability. It is scoped in three phases so that the “self-improving algorithm” narrative is honest and defensible at every stage, rather than an unsubstantiated AI claim made before any data exists.
2. Strategic Rationale
The core problem this solves is credibility, not just product-market fit. Investors and prospective enterprise customers cannot verify claims about AegisAgent's capability from a pitch deck alone. A free public tool converts “trust us” into “try it yourself,” and every scan run becomes a data point MetaPhoenix can cite — number of organisations scanned, vulnerabilities surfaced, public users educated. This directly addresses the traction gap raised during the Startup World Cup process.
    • Traction: signups, scans completed, dashboard visits — metrics investors actually trust
    • Validation: real findings on real domains, not a simulated demo environment
    • Pipeline: every free scan is a qualified lead into AegisAgent's paid SOC tier
    • Brand: positions MetaPhoenix as the security authority in the region, reinforcing the Cyber Security Awareness Month tour
3. Product Overview
IRIS has three connected surfaces, all served from one platform:
3.1 Business Exposure Scanner
A business submits a domain. The platform runs a live, automated reconnaissance pass — the same category of work AegisAgent's Hunter agent performs — and returns a scored report: exposed subdomains, open ports, SSL/TLS configuration issues, DNS misconfigurations, and any credentials associated with that domain found in known public breach data. This is real signal, not a mock report, which is exactly what makes it credible as a demonstration of the underlying technology.
3.2 Public Cyber Hygiene Check
A simplified, non-technical entry point for individuals: an email breach-exposure check, a short awareness quiz, and a shareable “cyber hygiene score.” This is designed to be shared — it is the awareness-tour content turned into a self-serve, viral loop, and it builds the public-facing user base that gives the platform a credible “users” number, not just “companies.”
3.3 Public Threat Dashboard
A live, always-on dashboard (built on the existing CyberWatch prototype) showing regional threat trends: live CISA KEV / NVD CVE feeds, and — once volume exists — anonymised, aggregated statistics drawn from IRIS's own scan data. This is the platform's shop window: it is what makes the tool feel alive to a first-time visitor and what a journalist or investor would screenshot.
3.4 MFA / 2FA Readiness & Guided Setup
This is the feature that turns IRIS from a diagnostic tool into something that actually improves a user's security posture in the same session — and it is where the “Shield” in the name earns its place. Rather than an automated switch-flipping feature, which would require IRIS to hold third-party credentials (an unacceptable liability for a security company), MFA support works as detection plus guidance:
    • Provider detection — for a submitted domain, IRIS reads MX records to identify the underlying email platform (Google Workspace, Microsoft 365, Zoho, or self-hosted) without ever requesting login credentials
    • Email authentication check — SPF, DKIM and DMARC records are checked as a proxy for email security maturity, the same signals a real attacker would check first
    • Guided, provider-specific walkthroughs — step-by-step instructions with deep links straight to the provider's own 2FA/MFA settings pages, for both individual users and IT admins rolling out an org-wide policy
    • MFA contribution to score — the hygiene/risk score visibly improves once a re-check confirms better email-auth posture, giving users a reason to come back
    • Public users — the same walkthrough logic applies to personal email/social accounts, generalised into a short “secure your top 5 accounts” checklist tied to the awareness-tour content
Because IRIS never touches credentials, this feature is safe to ship in Phase 1 and adds no meaningful new attack surface — it is guidance and detection only.
3.5 Conversion Path
Every free report ends with a clear, specific upsell: “This scan found 3 issues, and MFA isn't enforced on your domain. AegisAgent monitors these continuously and can enforce policy automatically — talk to us.” Free users are the top of a funnel, not an end state, and the platform should be built to route qualified leads to the sales team automatically.
4. Target Users
Segment	Entry Point	What They Get	What We Get
SMEs & organisations	Business Exposure Scanner	Free attack-surface report + risk score	Qualified lead + real scan data
General public	Cyber Hygiene Check	Breach check, awareness score, shareable badge	User growth, brand reach, awareness-tour funnel
Government / institutions	Business Scanner (guided)	Pilot-style exposure assessment	Case study for public-sector sales
Press / investors	Public Threat Dashboard	Visible, live proof of technical capability	Credibility artefact for fundraising
5. Feature Roadmap
The build is intentionally staged. Each phase is shippable and useful on its own, and each phase is what unlocks the next — the algorithm work in particular should not be attempted before the data to justify it exists.
Phase 1 — MVP (Weeks 1–6)
    • Domain submission + automated scan pipeline (subdomains, ports, SSL, DNS, breach lookups)
    • Scored report UI with plain-language explanations, not just raw findings
    • Public hygiene check (email breach lookup + short quiz + shareable score)
    • Public threat dashboard, powered by existing CISA KEV / NVD feed integrations
    • Lead capture on every report; CRM/email handoff for scans above a risk threshold
    • Rule-based, fully explainable risk scoring engine (deterministic — see Section 7)
    • MFA/2FA readiness detection (MX + SPF/DKIM/DMARC) and provider-specific guided setup walkthroughs
Phase 2 — Pattern Detection (once ~300–500 scans exist)
    • Cluster organisations by exposure pattern (industry, misconfig type, size)
    • Surface comparative insight: “organisations with this pattern were breached at Nx the base rate,” sourced from correlating scan data with public breach/incident feeds
    • Regional leaderboard / benchmark scoring to drive repeat visits
Phase 3 — Predictive Risk Model (once sufficient labelled outcomes exist)
    • Lightweight supervised model (gradient-boosted trees, not deep learning — matched to realistic data volume) trained on scan-to-outcome data
    • Predictive risk scoring: likelihood of compromise given current exposure profile
    • This is the point at which MetaPhoenix can honestly say the system “learns and improves” — not before

6. System Architecture
The platform reuses MetaPhoenix's existing conventions so it can be built and maintained by the same team without a new stack to learn.
Layer	Technology	Notes
Frontend	Next.js (App Router) + TypeScript + Tailwind	Matches AegisAgent and IE Trove conventions
Backend / DB	Supabase (Postgres)	RLS on every table; service-role only for the scan worker
Scan engine	Queued background jobs (Supabase Edge Functions or a small worker service)	Scans are async — never block the request thread
Threat intel feeds	CISA KEV, NVD CVE (existing integrations)	Already live in CyberWatch prototype
Breach data	Reputable breach-lookup API (e.g. HaveIBeenPwned)	Paid API — budget line item, see Section 9
MFA/email-auth check	DNS/MX lookups + SPF/DKIM/DMARC parsing	Read-only, passive — no credentials ever requested or stored
Auth	Supabase Auth	Anonymous scans allowed; account creation optional but incentivised (saved history, scheduled re-scans)
Hosting	Vercel (frontend) + Supabase (backend)	Matches current AegisAgent deployment
6.1 Data Flow
    • User submits a domain or email → request validated and rate-limited
    • Job queued to the scan worker → worker performs passive recon (no active exploitation, ever — see Section 8)
    • Findings written to Postgres → risk-scoring engine computes a deterministic score
    • Report rendered to the user in real time as findings complete (progressive, not a single blocking wait)
    • Anonymised, aggregated summary rolled into the public dashboard's regional statistics
7. The Learning / Improvement Algorithm
This is the section most likely to be scrutinised by a technical investor, so it is written to be defensible rather than impressive. The system does not claim to “learn” until Phase 3, and even then the model choice is matched to realistic data volume rather than chosen for marketing appeal.
Phase 1 — Deterministic scoring
A transparent, weighted rules engine (industry-standard approach, similar in spirit to CVSS): each finding contributes a weighted score, explained in plain language on the report. Every scan is a labelled data point from day one, even though no learning happens yet.
Phase 2 — Statistical pattern detection
Once there is real volume, unsupervised clustering (k-means or similar) groups organisations by exposure pattern. Cross-referencing these clusters against public breach/incident disclosures gives comparative statistics without requiring a trained predictive model yet.
Phase 3 — Supervised predictive model
Only once there is a meaningful set of scan-to-outcome pairs does it make sense to train a real predictive model — a gradient-boosted tree model is the right scale (interpretable, works on modest data, avoids the credibility risk of an oversized deep-learning claim). This is the point at which “the system improves itself” becomes literally true and demonstrable.
Recommendation: state this staged approach explicitly to investors. It reads as more technically credible than an unqualified “AI-powered, self-learning platform” claim made before any data exists — and it gives you a concrete, honest milestone to report progress against.
8. Security, Legal & Compliance
As a security company, IRIS's own conduct has to be beyond reproach — this is both a legal requirement and a credibility requirement.
    • Passive reconnaissance only. No active exploitation, no unauthorised access attempts, ever — this is a scanner, not a penetration test, and must never be positioned as one without explicit written authorisation from the domain owner
    • Terms of Service must state clearly that users may only submit domains/assets they own or are authorised to test
    • Data handling must comply with Eswatini's Data Protection Act 2022 — particularly for the breach-lookup and email-collection flows
    • Rate limiting and abuse prevention (CAPTCHA, domain ownership verification for deeper scans) to prevent the tool being used as reconnaissance-as-a-service against third parties
    • All scan data encrypted at rest; RLS enforced so one organisation can never see another's report
    • IRIS never requests, stores, or handles third-party account credentials — MFA support is limited to detection and guided instructions, by design, not by omission
9. Success Metrics
Metric	Phase 1 target (Month 3)	Why it matters
Domains scanned	500+	Direct traction number for investor conversations
Public hygiene checks completed	2,000+	Awareness-tour reach + viral loop validation
Qualified leads to AegisAgent sales	30+	Proves the funnel converts, not just the tool
Users completing an MFA walkthrough	40% of scanned users	Direct evidence the tool improves real security posture, not just reports on it
Dashboard monthly visitors	5,000+	Brand & credibility proof for press/investors
10. Budget Considerations
The platform is free to end users but not free to run. The main line items to plan for are the breach-lookup API (typically priced per-lookup or subscription), hosting/compute for the scan worker at volume, and rate-limiting/abuse-prevention tooling. These should be scoped precisely once Phase 1 feature set is signed off, but should be modest relative to AegisAgent's own infrastructure costs.
11. Next Steps
    • Founding team review of this spec — confirm scope for Phase 1 specifically
    • Confirm working name / branding for the public-facing product
    • Select and budget the breach-lookup API provider
    • Draft Terms of Service covering authorised-use requirements (Section 8)
    • Begin Phase 1 build: database schema → scan worker → report UI → public dashboard