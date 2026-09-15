/**
 * Determines whether early bird pricing is still available.
 *
 * @param now - The current date to check against.
 * @param earlyBirdCutoff - The date early bird pricing ends.
 * @returns `true` if early bird pricing still applies.
 */
export function isEarlyBird(now: Date, earlyBirdCutoff: Date): boolean {
    return now < earlyBirdCutoff;
}
