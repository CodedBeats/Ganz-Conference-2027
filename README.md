# GANZ Conference 2027
Marketing website and CMS for the 13th GANZ (Gestalt Australia & New Zealand) Conference - **"In Our Bodies, Of The Field"** - 25–27 June 2027, Griffith University, Gold Coast, QLD.

Client: Gestalt Australia & New Zealand (GANZ).

## Project scope
This repo covers <br /> 
**Phase 1**: the public marketing site, plus a CMS so the client can manage their own content (keynote presenters, committee, FAQs, registration pricing, etc.) without needing a developer for every change.

**Phase 2**: (registration, ticketing, admin dashboard) is scoped separately and isn't part of this repo yet.

## Tech stack
- **Framework:** Next.js 16 (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **UI components:** shadcn/ui (Base UI, Nova preset) - used for the CMS/admin interface
- **Backend:** Supabase (Postgres, Auth, Storage)
- **Docs:** TypeDoc, generated from `["src/lib", "src/app/api", "src/hooks", "src/types"]` - run with `npm run docs`
- **Testing:** Vitest (unit) + Playwright (e2e)
- **Deployment:** Vercel

## Local Dev
```bash
npm install
npm run dev       # start the dev server
npm run build     # production build
npm run lint      # lint the codebase
npm run docs      # generate browsable TypeDoc reference from /** */ comments
npm run test      # run vitest in watch mode
npm run test:run  # run vitest once
npx playwright test  # run e2e tests
```
Visit [http://localhost:3000](http://localhost:3000).

## Environment variables
Create `.env.local` in the project root:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SITE_PASSWORD=
```
`SITE_PASSWORD` gates the site behind a simple password screen while it's pre-launch - see `src/middleware.ts`.

## Scripts
| Command | What it does |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm run build` | Production build |
| `npm run lint` | Lint with ESLint |
| `npm run docs` | Generate TypeDoc reference docs into `/docs` |
| `npm run test` | Run Vitest unit tests in watch mode |
| `npm run test:run` | Run Vitest unit tests once |
| `npx playwright test` | Run Playwright e2e tests |

## Project structure
```
src/
├── app/            # Routes (Next.js App Router)
│   └── api/        # Next exposed API endpoints - documented with TypeDoc
├── components/     # UI components
├── hooks/          # custom hooks - documented with TypeDoc
├── lib/            # Business logic, Supabase queries, utilities - documented with TypeDoc
│   └── supabase/   # Supabase client setup
├── types/          # types - documented with TypeDoc
└── middleware.ts   # Password gate for pre-launch review
```

## Testing
- **Unit tests:** Vitest, config in `vite.config.mts` (jsdom environment, React plugin). Test files live in `tests/*.test.ts`.
- **E2e tests:** Playwright, config in `playwright.config.ts` (`testDir: './tests'`, chromium/firefox/webkit).
- Note: Playwright's `testDir` currently overlaps with the Vitest test folder (`tests/`) - keep this in mind when adding new test files so Playwright doesn't try to pick up Vitest specs (or vice versa).

## Deployment
Deployed on Vercel, using a two-branch model:
- **`master`** - *staging*. Feature/fix/design branches merge here first. auto-deploys to a persistent Vercel preview URL for ongoing checks.
- **`prod`** - *production*. Set as the Vercel Production Branch, deployed to the real GANZ domain (password-gated via `SITE_PASSWORD` until public launch). When a batch of changes on `main` is ready to ship, open a PR from `main` into `prod` and merge.