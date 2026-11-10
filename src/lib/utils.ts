export { cn } from "cn"

/**
 * Marks a branch that can't be reached when every case of a union is handled.
 *
 * @remarks
 * Put it in the `default` of a `switch` over a union: adding a value to the union then fails to
 * compile until the new case is handled. Throws if it is ever reached at runtime (e.g. bad data).
 */
export function assertNever(value: never): never {
    throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}