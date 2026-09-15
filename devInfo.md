# I need this, don't judge :)

## Local Dev
```bash
npm install
npm run dev             # start the dev server
npm run build           # production build
npm run lint            # lint the codebase
npm run docs            # generate browsable TypeDoc reference from /** */ comments
npm run test            # run Vitest unit tests in watch mode
npm run test:run        # Run Vitest unit tests once
npx playwright test     # run playwright e2e tests
```

## Docs
### Comment sytax
```ts
/**
 * Fetches the published keynote presenters, ordered by display order.
 *
 * @remarks
 * Only returns presenters marked as `published` in the CMS — draft entries are excluded.
 *
 * @param limit - Maximum number of presenters to return. Defaults to all.
 * @returns A promise resolving to the list of keynote presenters.
 */
export async function getKeynotePresenters(limit?: number): Promise<KeynotePresenter[]> {
  // ...
}
```

## Testing
### ViteTest
Best used for testing lib logic.
Everytime a file/function/helper is added in there, write corresponding tests (in possibly a new file) for it

`npm run test`
Runs all tests in `/tests`

`npm run test:run -- tests/pricing.test.ts`
Run sinlge test


### Playwright
Best used for testing all UI/UX and e2e tests
`npx playwright test`
Runs the end-to-end tests.

`npx playwright test tests/foo.spec.ts`
Run sinlge test

`npx playwright test --ui`
Starts the interactive UI mode.

`npx playwright test --project=chromium`
Runs the tests only on Desktop Chrome.

`npx playwright test example`
Runs the tests in a specific file.

`npx playwright test --debug`
Runs the tests in debug mode.

`npx playwright codegen`
Auto generate tests with Codegen.


## GIT stuff
### Branches
- prod
- docs

### Commit format & Notes
commitType(topic): small description
commit types: [`feat`, `fix`, `refactor`, `style`, `docs`, `tests`]

### Pull Request Format
Fixed header vocabulary, flexible per PR - include only the headers relevant to the change, skip the rest:
**Title** *Description*
**Summary** *Description*
**Problem** *Description*
**Fix** *Description*
**New Infrastructure** *Description*
**Tested** *Description* 
(A style/refactor PR might only need **Summary** + **Tested**) 
(A bug fix might use **Problem** + **Fix** + **Tested**)
