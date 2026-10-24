import { describe, expect, it } from "vitest";
import { FOOTER_LINKS, NAV_LINKS, REGISTER_CTA_DEFAULTS, getRegisterCta, sectionHref } from "../src/lib/content/site";

const section = (subheading: string | null, excerpt: string | null) => ({ subheading, excerpt });

describe("getRegisterCta", () => {
    it("defaults to the not-open-yet button pointing at the prices", () => {
        expect(getRegisterCta(undefined)).toEqual({
            label: REGISTER_CTA_DEFAULTS.label,
            href: "/#registrations",
            isOpen: false,
        });
        expect(getRegisterCta(section("  ", ""))).toEqual(getRegisterCta(undefined));
    });

    it("uses the CMS label and treats any in-page link as not open", () => {
        expect(getRegisterCta(section("Opening November", "#registrations"))).toEqual({
            label: "Opening November",
            href: "/#registrations",
            isOpen: false,
        });
        expect(getRegisterCta(section(null, "#faqs")).isOpen).toBe(false);
    });

    it("is open once the link leaves the page", () => {
        expect(getRegisterCta(section("Register Now", "/register"))).toEqual({
            label: "Register Now",
            href: "/register",
            isOpen: true,
        });
        expect(getRegisterCta(section("Register Now", "www.example.com/tickets")).href).toBe("https://www.example.com/tickets");
    });

    it("falls back to the default link when the CMS link isn't allowed", () => {
        const cta = getRegisterCta(section("Register Now", "javascript:alert(1)"));

        expect(cta.href).toBe("/#registrations");
        expect(cta.isOpen).toBe(false);
    });
});

describe("sectionHref", () => {
    it("points at the home page so links work from other pages", () => {
        expect(sectionHref("faqs")).toBe("/#faqs");
    });
});

describe("FOOTER_LINKS", () => {
    it("puts Workshop before and Submissions after Registrations, and keeps both out of the navbar", () => {
        const ids = FOOTER_LINKS.map((link) => link.id);
        const registrations = ids.indexOf("registrations");

        expect(ids.slice(registrations - 1, registrations + 2)).toEqual(["workshop", "registrations", "submissions"]);
        expect(NAV_LINKS.map((link) => link.id)).not.toContain("workshop");
    });
});