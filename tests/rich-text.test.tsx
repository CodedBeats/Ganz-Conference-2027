import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { RichText } from "../src/components/shared/RichText";

afterEach(cleanup);

describe("RichText", () => {
    it("opens external links in a new tab", () => {
        render(<RichText text="Visit [GANZ](https://ganz.org.au)." />);

        const link = screen.getByRole("link", { name: "GANZ" });
        expect(link.getAttribute("href")).toBe("https://ganz.org.au");
        expect(link.getAttribute("target")).toBe("_blank");
        expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    });

    it("keeps on-site links in the same tab", () => {
        render(<RichText text="See [the program](#program)." />);

        const link = screen.getByRole("link", { name: "the program" });
        expect(link.getAttribute("href")).toBe("#program");
        expect(link.getAttribute("target")).toBeNull();
    });

    it("renders a mailto link in the same tab", () => {
        render(<RichText text="Apply by emailing [contact@ganz.org.au](mailto:contact@ganz.org.au)." />);

        const link = screen.getByRole("link", { name: "contact@ganz.org.au" });
        expect(link.getAttribute("href")).toBe("mailto:contact@ganz.org.au");
        expect(link.getAttribute("target")).toBeNull();
    });

    it("renders a link inside a highlight within the accent span", () => {
        render(<RichText text="*Read [more](/more)*" accentClassName="text-gold" />);

        expect(screen.getByRole("link", { name: "more" }).closest("span")?.className).toBe("text-gold");
    });

    it("shows a disallowed link as plain text", () => {
        const { container } = render(<RichText text="[x](javascript:alert(1))" />);

        expect(screen.queryByRole("link")).toBeNull();
        expect(container.textContent).toBe("[x](javascript:alert(1))");
    });
});