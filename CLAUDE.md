@AGENTS.md

# CV Job Matcher

Bulgarian web app: a candidate uploads a CV (PDF), and the app returns the best-matching
IT job ads from **dev.bg**, each scored against the CV, plus deterministic CV-improvement
tips. UI text is in Bulgarian.

For the current feature set and parked ideas/decisions, see **`docs/STATUS.md`**.

## Architecture

Two parts:

- **Frontend** — Next.js (App Router) + Bootstrap 5 + SCSS. Lives in this repo.
- **Backend** — an **n8n workflow** (id `VLO8ouPtHCTmyZUm`, "CV Job Matcher — dev.bg",
  on localhost:5678) that does CV parsing, dev.bg scraping, and scoring. The frontend
  does NOT score anything — it only renders what n8n returns.

Request flow: browser → `app/api/analyze/route.ts` (proxy) → n8n webhook
`/webhook/cv-job-matcher` (multipart form-data) → n8n runs the pipeline → JSON back.
The route holds a single-flight `isRunning` lock and forwards `req.signal` so a client
cancel releases the lock. Cancel also hits `app/api/stop/route.ts` → n8n stop webhook.

## Commands

- `npm run dev` — dev server (usually already running on :3000).
- `npm run build` / `npm run start` — production build / serve.
- `npm run lint` — runs `eslint` over the project (flat config in `eslint.config.mjs`).
  Lint the whole project this way; **`npx eslint app/some-file.tsx` may report "No files
  matching the pattern"** — that's a flat-config glob quirk, not a real error, so don't
  chase it. (This project uses bare `eslint`, not `next lint`.)
- `npx tsc --noEmit` is the authoritative typecheck. To sanity-check SCSS without the app:
  `npx sass app/globals.scss /tmp/out.css --no-source-map`.

## Frontend conventions

- Bootstrap 5 (pre-compiled CSS imported in `app/layout.tsx`) + `bootstrap-icons`.
  **No Tailwind.** All custom styling is in `app/globals.scss` using CSS variables.
- Brand palette: primary blue `#4361ee` → indigo `#4f46e5` gradients. Dark theme
  overrides `--bs-primary` to `#7f9cff` so blue text/icons stay legible. Keep blue
  dominant — avoid drifting toward purple.
- Client state only: last results in `sessionStorage` (`cvjm:last-results`), form
  preferences in `localStorage` (`cvjm:prefs`). No backend persistence, no accounts.
- Restore-from-storage runs in a mount `useEffect` (client-only, guarded with an
  eslint-disable for `react-hooks/set-state-in-effect`) to avoid hydration mismatch.
- SEO/social: metadata + dynamic OG image in `app/layout.tsx` / `app/opengraph-image.tsx`
  (+ `twitter-image.tsx` re-export). `metadataBase` uses `NEXT_PUBLIC_SITE_URL`.

## n8n backend (read before touching scoring/matching)

- **Scoring is deterministic in code**, NOT done by an LLM. Set-membership and score
  live in the `Build Scoring Input` Code node. LLMs are only used to read job text →
  tech list and to write the Bulgarian summary sentence. Don't move scoring to an LLM.
- The Code-node logic is **mirrored** in `n8n/*.js` (e.g. `build-scoring-input.js`,
  `keyword-pre-score.js`, `analyze-cv-gaps.js`, `build-devbg-target-url.js`) and the
  whole graph in `n8n/workflow.json`. These are the source of truth in git and MUST be
  kept in sync with the live workflow.
- **Editing the live workflow** (via the `n8n-mcp` MCP): re-fetch the live node FIRST
  (it may have been hand-edited in the UI and drifted from the mirror), edit, push with
  `update_workflow`, then **`publish_workflow`** (webhook runs use the ACTIVE version,
  not the draft). Verify by diffing the pushed node against the mirror, then update the
  mirror + `workflow.json`. The n8n UI can clobber API edits if left open.
- PDF parsing uses the LlamaParse Platform community node (output key `text`); heavy
  PDFs (~2MB+) can time out.

## Gotchas

- **Any LLM-extracted value that indexes a map or builds a URL must be normalized in
  code.** The extractor's `job_type` once came back as free text ("Full-Stack Web
  Developer") and produced an `undefined` scrape URL → zero results. `build-devbg-target-url.js`
  now fuzzy-maps it to a canonical category. Apply the same defensiveness elsewhere.
- Tech-name normalization: watch space-variants (e.g. "TailwindCSS" vs "Tailwind CSS")
  — they can otherwise appear as both matched AND missing. Add aliases.

## Environment variables

- `N8N_WEBHOOK_URL` — main analyze webhook (default `http://localhost:5678/webhook/cv-job-matcher`).
- `N8N_STOP_WEBHOOK_URL` — cancel/stop webhook (default `.../webhook/cv-job-matcher-stop`).
- `NEXT_PUBLIC_SITE_URL` — public origin for absolute OG/canonical URLs (prod falls back
  to the Vercel alias).

## Data & privacy

Currently stateless: CVs are parsed in-flight and never stored server-side. If accounts
or a database are added later, note that CVs contain personal data (names, emails, work
history) → EU/GDPR obligations (consent, retention, deletion). Prefer storing the derived
profile JSON over raw PDFs, and keep the anonymous flow un-gated.
