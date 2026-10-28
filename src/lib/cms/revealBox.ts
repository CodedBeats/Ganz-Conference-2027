/**
 * Scrolls an editor box into view and focuses its first field, if it has one open.
 *
 * @remarks
 * Matches the box's `data-cms-box` id exactly, or failing that any image slot inside the
 * same row (`table:row:field`) - so a Recent changes entry, which only knows `table:row`,
 * still lands on an image it changed. Does nothing if the box isn't on this page.
 *
 * @param id - `${table}:${rowId}`, or an image slot's `${table}:${rowId}:${field}`.
 */
export function revealBox(id: string) {
    const escaped = CSS.escape(id);
    const box =
        document.querySelector<HTMLElement>(`[data-cms-box="${escaped}"]`) ??
        document.querySelector<HTMLElement>(`[data-cms-box^="${escaped}:"]`);

    box?.scrollIntoView({ behavior: "smooth", block: "center" });
    box?.querySelector<HTMLElement>("textarea, input, select")?.focus({ preventScroll: true });
}