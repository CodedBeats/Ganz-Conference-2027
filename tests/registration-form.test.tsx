import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { RegistrationForm, type RegistrationFormProps } from "../src/components/register/RegistrationForm";
import { APPROVAL_TURNAROUND, JOIN_GANZ_URL, MEMBERSHIP_CHECK_FAILED_NOTE } from "../src/lib/registration/config";
import { DEFAULT_POLICY_AGREEMENT } from "../src/lib/registration/policy";
import { MEMBERSHIP_CHOICE_LABELS } from "../src/lib/registration/options";
import { toRegistrationOffer } from "../src/lib/registration/quote";
import type { RegistrationPreviewResult } from "../src/lib/registration/schema";
import { makePricing } from "./fixtures/pricing";

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

const PREVIEW: RegistrationPreviewResult = {
    status: "preview",
    preview: { ticket: "Three-day conference only", audience: "Non-members", tier: "Early Bird", amount: "$635" },
};

const renderForm = (overrides: Partial<RegistrationFormProps> = {}) => {
    const action = vi.fn<RegistrationFormProps["action"]>().mockResolvedValue(PREVIEW);
    render(
        <RegistrationForm
            action={action}
            offer={toRegistrationOffer(makePricing())}
            policy={{ agreement: DEFAULT_POLICY_AGREEMENT, version: "abc123def456" }}
            terms={<p>The registration terms</p>}
            preselection={{}}
            {...overrides}
        />,
    );
    return { action };
};

const membership = (choice: keyof typeof MEMBERSHIP_CHOICE_LABELS) =>
    screen.getByRole("radio", { name: MEMBERSHIP_CHOICE_LABELS[choice] });
const conferenceOnly = () => screen.getByRole("radio", { name: /three-day conference only/i });
const workshop = () => screen.getByRole("radio", { name: /pre-conference workshop/i });
const dietary = (name: string) => screen.getByRole("checkbox", { name });
const submit = () => fireEvent.click(screen.getByRole("button", { name: "Check my registration" }));

const fillValidNonMember = () => {
    fireEvent.click(membership("non_member"));
    fireEvent.click(conferenceOnly());
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Sam Taylor" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "sam@example.com" } });
    fireEvent.click(dietary("No dietary requirements"));
    fireEvent.click(screen.getByRole("checkbox", { name: /I have read and agree/ }));
};

describe("RegistrationForm", () => {
    it("asks for the membership answer before showing prices", () => {
        renderForm();
        expect(screen.getByText(/Choose your membership above to see your price/)).toBeTruthy();
        expect(screen.queryByText("$635")).toBeNull();
    });

    it("shows the price for the chosen membership, and switches it when the answer changes", () => {
        renderForm();

        fireEvent.click(membership("non_member"));
        expect(within(conferenceOnly().closest("label")!).getByText("$635")).toBeTruthy();
        expect(within(workshop().closest("label")!).getByText("$1,235")).toBeTruthy();

        fireEvent.click(membership("current_member"));
        expect(within(conferenceOnly().closest("label")!).getByText("$485")).toBeTruthy();
        expect(within(workshop().closest("label")!).getByText("$1,085")).toBeTruthy();
    });

    it("asks members for the name and email they joined with, and copies them from their details", () => {
        renderForm();
        expect(screen.queryByLabelText("Name you joined GANZ with")).toBeNull();

        fireEvent.click(membership("current_member"));
        fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Sam Taylor" } });
        fireEvent.change(screen.getByLabelText("Email"), { target: { value: "sam@example.com" } });
        fireEvent.click(screen.getByRole("button", { name: "Same as my details below" }));

        expect(screen.getByLabelText<HTMLInputElement>("Name you joined GANZ with").value).toBe("Sam Taylor");
        expect(screen.getByLabelText<HTMLInputElement>("Email you joined GANZ with").value).toBe("sam@example.com");

        fireEvent.click(membership("non_member"));
        expect(screen.queryByLabelText("Name you joined GANZ with")).toBeNull();
    });

    it("tells members the registration stays pending, and what happens if the check fails", () => {
        renderForm();
        expect(screen.queryByText(MEMBERSHIP_CHECK_FAILED_NOTE)).toBeNull();

        for (const choice of ["current_member", "joining_member"] as const) {
            fireEvent.click(membership(choice));
            expect(screen.getByText(new RegExp(`${APPROVAL_TURNAROUND.label}.*stays pending`))).toBeTruthy();
            expect(screen.getByText(MEMBERSHIP_CHECK_FAILED_NOTE)).toBeTruthy();
        }

        fireEvent.click(membership("non_member"));
        expect(screen.queryByText(MEMBERSHIP_CHECK_FAILED_NOTE)).toBeNull();
    });

    it("shows people joining GANZ the Join link, opening in a new tab", () => {
        renderForm();
        fireEvent.click(membership("joining_member"));

        const link = screen.getByRole("link", { name: /Join GANZ/ });
        expect(link.getAttribute("href")).toBe(JOIN_GANZ_URL);
        expect(link.getAttribute("target")).toBe("_blank");
    });

    it("keeps 'No dietary requirements' on its own", () => {
        renderForm();
        const none = dietary("No dietary requirements") as HTMLInputElement;
        const vegan = dietary("Vegan") as HTMLInputElement;

        fireEvent.click(vegan);
        fireEvent.click(none);
        expect([none.checked, vegan.checked]).toEqual([true, false]);

        fireEvent.click(vegan);
        expect([none.checked, vegan.checked]).toEqual([false, true]);
    });

    it("shows the workshop places left, and disables the workshop once it's sold out", () => {
        renderForm({ offer: toRegistrationOffer(makePricing({ placesLeft: 3 })) });
        expect(screen.getByText("3 places left")).toBeTruthy();
        cleanup();

        renderForm({
            offer: toRegistrationOffer(makePricing({ placesLeft: 0 })),
            preselection: { ticketOption: "conference_workshop", audience: "member" },
        });
        expect((workshop() as HTMLInputElement).disabled).toBe(true);
        expect((workshop() as HTMLInputElement).checked).toBe(false);
        expect(screen.getByText(/Sold out/)).toBeTruthy();
    });

    it("preselects the ticket and membership from the card link", () => {
        renderForm({ preselection: { ticketOption: "conference_workshop", audience: "non_member" } });
        expect((membership("non_member") as HTMLInputElement).checked).toBe(true);
        expect((workshop() as HTMLInputElement).checked).toBe(true);
    });

    it("shows member prices for a member link without guessing current or joining", () => {
        renderForm({ preselection: { ticketOption: "conference_only", audience: "member" } });
        expect((membership("current_member") as HTMLInputElement).checked).toBe(false);
        expect(within(conferenceOnly().closest("label")!).getByText("$485")).toBeTruthy();
    });

    it("marks invalid fields and focuses the first one without calling the server", () => {
        const { action } = renderForm();
        submit();

        expect(action).not.toHaveBeenCalled();
        expect(screen.getByLabelText("Full name").getAttribute("aria-invalid")).toBe("true");
        expect(screen.getByText("Choose whether you're a GANZ member.")).toBeTruthy();
        expect(document.activeElement?.id).toBe("register-membership");
    });

    it("clears a field's error once it's edited", () => {
        renderForm();
        submit();
        fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Sam" } });
        expect(screen.getByLabelText("Full name").getAttribute("aria-invalid")).toBe("false");
    });

    it("sends a valid form to the server and shows the preview", async () => {
        const { action } = renderForm();
        fillValidNonMember();
        submit();

        await waitFor(() => expect(screen.getByText("Everything checks out.")).toBeTruthy());
        expect(action).toHaveBeenCalledOnce();

        const formData = action.mock.calls[0][1];
        expect(formData.get("quotedTier")).toBe("early_bird");
        expect(formData.get("policyVersion")).toBe("abc123def456");
        expect(screen.getByText(/nothing was saved/)).toBeTruthy();
    });

    it("explains a refusal from the server", async () => {
        const { action } = renderForm();
        action.mockResolvedValueOnce({ status: "error", error: "tier_changed" });
        fillValidNonMember();
        submit();

        const alert = await screen.findByRole("alert");
        expect(within(alert).getByText(/Prices changed while you were registering/)).toBeTruthy();
        expect(within(alert).getByRole("button", { name: "Reload the page" })).toBeTruthy();
    });

    it("shows the terms above the agreement checkbox, labelled with the CMS sentence", () => {
        renderForm({ policy: { agreement: "I agree to the edited terms.", version: "abc123def456" } });
        const terms = screen.getByText("The registration terms");
        const checkbox = screen.getByRole("checkbox", { name: "I agree to the edited terms." });
        expect(terms.compareDocumentPosition(checkbox) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("can't be submitted when prices couldn't be loaded", () => {
        renderForm({ offer: { isAvailable: false } });
        expect((screen.getByRole("button", { name: "Check my registration" }) as HTMLButtonElement).disabled).toBe(true);
    });
});
