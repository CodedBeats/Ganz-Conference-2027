import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NavMoreMenu } from "../src/components/layout/NavMoreMenu";
import { NAV_LINKS } from "../src/lib/content/site";

const LINKS = [
    { id: "accommodation", label: "Accommodation" },
    { id: "sponsors", label: "Sponsors" },
];

afterEach(cleanup);

describe("NavMoreMenu", () => {
    it("opens to show its links as anchors", async () => {
        render(<NavMoreMenu links={LINKS} activeId={null} />);
        fireEvent.click(screen.getByRole("button", { name: "More" }));

        const sponsors = await screen.findByRole("menuitem", { name: "Sponsors" });
        expect(sponsors.getAttribute("href")).toBe("/#sponsors");
        expect(screen.getByRole("menuitem", { name: "Accommodation" })).toBeTruthy();
    });

    it("underlines the trigger only while one of its sections is active", () => {
        const { rerender } = render(<NavMoreMenu links={LINKS} activeId="sponsors" />);
        expect(screen.getByRole("button", { name: "More" }).className).toContain("nav-link-active");

        rerender(<NavMoreMenu links={LINKS} activeId="welcome" />);
        expect(screen.getByRole("button", { name: "More" }).className).not.toContain("nav-link-active");
    });
});

describe("NAV_LINKS", () => {
    it("folds the least-used sections into More", () => {
        expect(NAV_LINKS.filter((link) => link.isSecondary).map((link) => link.id)).toEqual(["accommodation", "sponsors", "committee"]);
    });
});