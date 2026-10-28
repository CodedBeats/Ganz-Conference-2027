"use client";

import { useEffect, useState } from "react";

/**
 * The current time, refreshed on an interval - for relative labels like "2 min ago" and
 * countdowns that need to move without anything else re-rendering.
 *
 * @param intervalMs - How often to tick. Defaults to 30 seconds, plenty for minute-level copy.
 * @returns Milliseconds since the epoch, as of the last tick.
 */
export function useNow(intervalMs = 30_000): number {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(timer);
    }, [intervalMs]);

    return now;
}