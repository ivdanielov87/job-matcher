# Project status & ideas

A living snapshot of what the app does today and what's parked for later. Keep it short;
update it when features land or decisions change. (Architecture/conventions live in
`CLAUDE.md`.)

## Current features (shipped)

**Search flow**
- Upload a CV (PDF, ≤5 MB) via drag-and-drop or file picker.
- Preferences: location (Remote + BG cities), period (1 / 2 / 3 weeks), optional email.
  Preferences are remembered across visits (`localStorage: cvjm:prefs`).
- n8n pipeline: parse CV (LlamaParse + LLM extractor → profile incl. `primary_stack`) →
  scrape dev.bg for the role's categories → keyword pre-filter to the best ~15 by MAIN
  stack → deterministic scoring → return jobs scoring ≥ the adaptive threshold (30/40%).
- Cancel a running search: stops the n8n execution (cooperative stop-flag: Data Table +
  stop webhook + per-stage checkpoints), releases the lock, returns to the form.
- Optional results email (n8n sends it when an email is provided).

**Results UI**
- Results card: trophy header + funnel tiles (В dev.bg / За периода / По профила /
  Оценени / Съвпадения / Под прага), collapsible detailed analysis (accordion on
  mobile & tablet), "Твоят профил" vs "Най-търсени в обявите" panels, score legend
  (segmented gauge).
- Job cards: score badge, matched/missing skills, main technologies, AI summary,
  "Нова обява" badge + relative date for ads ≤3 days old, link to the ad.
- CV review: market gaps (in-demand skills you're missing) + AI CV tips.
- Results persist across refresh (`sessionStorage: cvjm:last-results`); light/dark theme;
  SEO metadata + dynamic OG image.

## Parked ideas & decisions (not built yet)

- **Accounts + database (Supabase)** — under consideration, undecided. Strongest driver
  would be **weekly job alerts** (re-match a saved profile on a schedule, email new hits).
  Caveats: don't gate the anonymous flow; CVs are personal data → GDPR (prefer storing the
  derived profile JSON over raw PDFs).
- **Second job source** (e.g. jobs.bg) — the per-card source badge is commented out in
  `JobCard.tsx` until there's more than one source; restore it then.
- **Role/seniority targeting** (e.g. surface team-lead ads) — separate future feature;
  dev.bg matching is by tech tags, not role.
- **Domain-specific experience** (e.g. "X yrs frontend" vs total years) — deferred;
  matching currently uses total years of experience.
- **Custom domain** — will replace the Vercel alias via `NEXT_PUBLIC_SITE_URL`.
- **Parked n8n sub-flow**: a CV-Tips profile-enrichment path exists but is unpublished —
  do not publish without asking.
