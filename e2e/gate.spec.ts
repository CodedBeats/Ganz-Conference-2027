// Requires SITE_PASSWORD to be set in the shell that starts Playwright's webServer
// (e.g. `SITE_PASSWORD=test1234 npx playwright test e2e/gate.spec.ts` in PowerShell:
// `$env:SITE_PASSWORD = 'test1234'; npx playwright test e2e/gate.spec.ts`), since
// .env.local is gitignored and isn't loaded automatically here.
import { test, expect } from "@playwright/test";

const PASSWORD = process.env.SITE_PASSWORD ?? "";

test.skip(!PASSWORD, "SITE_PASSWORD is not set in this environment");

test.describe("pre-launch gate", () => {
    test("unauthenticated visitors are redirected to the gate", async ({ page }) => {
        await page.goto("/");
        await expect(page).toHaveURL(/\/gate\?from=%2F/);
    });

    test("wrong password shows an error and stays on the gate", async ({ page }) => {
        await page.goto("/gate");
        await page.getByPlaceholder("Password").fill("definitely-wrong");
        await page.getByRole("button", { name: "Enter site" }).click();
        await expect(page.getByRole("alert")).toHaveText(/Incorrect password/);
        await expect(page).toHaveURL(/\/gate/);
    });

    test("correct password unlocks the site and persists across reloads", async ({ page }) => {
        await page.goto("/");
        await expect(page).toHaveURL(/\/gate/);

        await page.getByPlaceholder("Password").fill(PASSWORD);
        await page.getByRole("button", { name: "Enter site" }).click();
        await expect(page).toHaveURL("/");

        await page.reload();
        await expect(page).toHaveURL("/");

        await page.getByRole("button", { name: "Remove access (dev only)" }).click();
        await expect(page).toHaveURL(/\/gate/);

        await page.goto("/");
        await expect(page).toHaveURL(/\/gate/);
    });
});
