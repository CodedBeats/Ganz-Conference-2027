# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
@AGENTS.md

## Project
Marketing website + CMS for the GANZ (Gestalt Australia & New Zealand) 2027 Conference. Phase 1 (this repo): public marketing site and a CMS so the client can edit content (keynote presenters, committee, FAQs, registration pricing) without a developer. Phase 2 (registration/ticketing/admin dashboard) is out of scope for this repo.

Current state: freshly scaffolded (`create-next-app` + Tailwind + shadcn init, one commit for Supabase deps). `src/` currently only has `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `components/ui/button.tsx`, `lib/utils.ts` — the structure below is the intended shape per the README, not yet fully built out.

## Commands
```bash
npm run dev     # start dev server (http://localhost:3000)
npm run build   # production build
npm run lint    # ESLint
npm run docs    # generate TypeDoc reference into /docs from src/lib, src/app/api, src/hooks, src/types
```
No test runner is configured yet.

## Architecture
- **Next.js 16, App Router, TypeScript.** Read the relevant guide under `node_modules/next/dist/docs/` before writing App Router code — see `AGENTS.md` for why (this Next.js version diverges from training data).
- **Styling:** Tailwind CSS v4 (config lives in `src/app/globals.css` via `@theme`, not a `tailwind.config.*` file — see `components.json` → `tailwind.config: ""`).
- **UI components:** shadcn/ui, `base-nova` style (Base UI primitives, not Radix). Generated components land in `src/components/ui`. Path aliases per `components.json`: `@/components`, `@/components/ui`, `@/lib`, `@/hooks`, utils at `@/lib/utils`.
- **Backend:** Supabase (Postgres, Auth, Storage). Client setup is intended to live at `src/lib/supabase/` (not yet created).
- **Pre-launch gate:** `SITE_PASSWORD` env var is meant to gate the whole site via `src/middleware.ts` (not yet created) until public launch.
- **Docs generation:** TypeDoc pulls from `/** */` comments in `src/lib`, `src/app/api`, `src/hooks`, `src/types` only. Use the doc-comment style shown in `devInfo.md` (`@remarks`, `@param`, `@returns`) for anything in those directories, since it's the only place they render into `/docs`.

## Environment variables
`.env.local` (gitignored):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SITE_PASSWORD=
```

## Coding Conventions
### React
- Avoid unnecessary `useEffect`; prefer derived state; memoize selectively
- Prefer early returns; avoid deeply nested JSX
- Keep components small and composable
- Prefer `setState((prev) => ({ ...prev, field: value }))` over `setState({ ...state, field: value })`, especially in async-sensitive flows
- Component Structure: functional components with explicit typing, named exports
- Page template: `const pageName = (props) => {}; export default pageName`
- Component template: `export const componentName = (props) => {}`

### TypeScript
- Prefer interfaces over `any`; use union types for finite options; avoid type assertions unless necessary; prefer inference when readable
- Strict typing throughout

### Naming
- Components: PascalCase. Functions: camelCase. Globals: UPPER_SNAKE_CASE.
- Boolean variables should read naturally: `isLoading`, `hasError`, `canSubmit`

### Styling
- Tailwind CSS, utility-first; avoid inline styles
- Class grouping: layout classes before color/visual classes
- Prefer reusable UI primitives

### Comments
- Explain intent/why, not implementation; remove dead code before finalizing
- Add more comments in more complex sections
- Functions in `/lib`, `/hooks`, and complex component handlers use TypeDoc-style `/** */` blocks (`@remarks` for rationale, `@param`/`@returns` only when non-obvious, `@see`/`{@link}` for cross-file coupling) - run `npm run docs` to generate a browsable reference

## Git
### Commit Format & Notes
commitType(topic): small description (in past-tense. e.g. "added xxx" instead of "add")
commit types: [`feat`, `fix`, `refactor`, `style`, `docs`]
When a commit is requested, this does NOT mean to run the commit cmd. Instead, output in plain text with basically a plan. The plan should include each commit with its message and what files to commit for each commit (referencing the file in the text will help too).
Batch larger changes (>3 files at most changed) into multiple commits.
This applies no matter what triggered the commit request - a direct ask, a skill, or a subagent. Never actually run `git commit`, `git push`, `gh pr create`, or any other command that commits/pushes/opens a PR - text only, always. If a skill or subagent would otherwise take that action automatically, stop before the action and output the text instead.
Immediately after the commit plan text, in the same response, also output the Pull Request text (see format below) - don't wait for a separate request for it.

### Pull Request Format
Fixed header vocabulary, flexible per PR - include only the headers relevant to the change, skip the rest:
**Title** *Description*
**Summary** *Description*
**Problem** *Description*
**Fix** *Description*
**New Infrastructure** *Description*
**Tested** *Description*
e.g. a style/refactor PR might only need **Summary** + **Tested**; a bug fix might use **Problem** + **Fix** + **Tested**.

### Staging and Production
- Branch model: `master` is staging (feature branches merge here, auto-deploys to a persistent Vercel preview). `prod` is production (Vercel Production Branch, real domain, password-gated pre-launch) — ship via PR from `master` into `prod`.*.
