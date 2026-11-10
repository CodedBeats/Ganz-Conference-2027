// @vitest-environment node
/**
 * Drift layer 3: the committed `src/types/database.ts` must match what the migrations produce.
 *
 * Catches a migration that was added (or changed) without running `npm run db:types`. Layers 1
 * and 2 (TS tuples vs the generated types) are in `tests/registration-enums.test.ts`.
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { format } from "prettier";
import { describe, expect, it } from "vitest";
import { isDbMode } from "./helpers";

const TYPES_PATH = "src/types/database.ts";

/** Git may check the file out with CRLF line endings on Windows. */
const normaliseLineEndings = (text: string) => text.replace(/\r\n/g, "\n");

describe.runIf(isDbMode)("generated DB types", () => {
    it(
        `${TYPES_PATH} is up to date with the local database`,
        async () => {
            const generated = execSync("npx supabase gen types typescript --local", { encoding: "utf8" });
            // Same formatting as `npm run db:types`
            const formatted = await format(generated, { parser: "typescript", tabWidth: 4 });
            const committed = readFileSync(TYPES_PATH, "utf8");

            expect(normaliseLineEndings(committed), "run `npm run db:types`").toBe(normaliseLineEndings(formatted));
        },
        60_000,
    );
});