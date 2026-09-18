"use client";

import { useEffect, useState } from "react";

/**
 * Tracks which page section is currently in view so the navbar can highlight it.
 *
 * @remarks
 * Uses a single `IntersectionObserver` with a `rootMargin` that shrinks the
 * observed area to a band near the top of the viewport. That way the section
 * sitting just under the sticky navbar wins, rather than whichever section
 * happens to cover the most pixels. Ids that don't exist in the DOM are ignored.
 *
 * @param sectionIds - DOM ids of the sections to watch, in page order.
 * @returns The id of the active section, or `null` before any section has entered the band.
 */
export function useActiveSection(sectionIds: string[]): string | null {
    const [activeId, setActiveId] = useState<string | null>(null);

    // join() gives a stable dependency so a freshly-mapped array doesn't re-subscribe every render
    const idsKey = sectionIds.join(",");

    useEffect(() => {
        const elements = idsKey
            .split(",")
            .map((id) => document.getElementById(id))
            .filter((el): el is HTMLElement => el !== null);

        if (elements.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                // several sections can flip in one tick - prefer the one nearest the top
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

                if (visible.length > 0) setActiveId(visible[0].target.id);
            },
            // top 20% is hidden under the navbar; bottom 60% is excluded so only the upper band counts
            { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
        );

        elements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [idsKey]);

    return activeId;
}