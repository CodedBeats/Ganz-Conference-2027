import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ShareDialog } from "../src/components/shared/ShareDialog";

const writeText = vi.fn();

const openDialog = () => {
    render(<ShareDialog ariaLabel="Share the conference">Share</ShareDialog>);
    fireEvent.click(screen.getByRole("button", { name: "Share the conference" }));
};

beforeEach(() => {
    writeText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    // jsdom has no Web Share API; tests that add one remove it again
    Reflect.deleteProperty(navigator, "share");
    Reflect.deleteProperty(navigator, "canShare");
});

describe("ShareDialog", () => {
    it("shows the networks, and hides Messenger without a Facebook app id", async () => {
        openDialog();

        for (const name of ["WhatsApp", "Facebook", "Instagram", "LinkedIn", "X", "Threads", "Email"]) {
            expect(await screen.findByRole("button", { name })).toBeTruthy();
        }
        expect(screen.queryByRole("button", { name: "Messenger" })).toBeNull();
    });

    it("shares the site root, not the current section hash", async () => {
        window.history.replaceState(null, "", "/#keynotes");
        openDialog();

        const input = await screen.findByRole<HTMLInputElement>("textbox", { name: "Conference link" });
        expect(input.value).toBe(`${window.location.origin}/`);
    });

    it("copies the link", async () => {
        openDialog();
        fireEvent.click(await screen.findByRole("button", { name: "Copy" }));

        expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/`);
        expect(await screen.findByText("Link copied.")).toBeTruthy();
    });

    it("tells the visitor to copy by hand when the clipboard is blocked", async () => {
        writeText.mockRejectedValue(new Error("denied"));
        openDialog();
        fireEvent.click(await screen.findByRole("button", { name: "Copy" }));

        expect(await screen.findByText(/select the link above/)).toBeTruthy();
    });

    it("copies the link for Instagram when there's no share sheet", async () => {
        openDialog();
        fireEvent.click(await screen.findByRole("button", { name: "Instagram" }));

        expect(writeText).toHaveBeenCalledOnce();
        expect(await screen.findByText(/paste it into a story/)).toBeTruthy();
        expect(screen.queryByRole("button", { name: "More options" })).toBeNull();
    });

    it("uses the share sheet for Instagram when the device has one", async () => {
        const share = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, "share", { value: share, configurable: true });
        Object.defineProperty(navigator, "canShare", { value: () => true, configurable: true });
        openDialog();

        fireEvent.click(await screen.findByRole("button", { name: "Instagram" }));

        await waitFor(() => expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: `${window.location.origin}/` })));
        expect(writeText).not.toHaveBeenCalled();
        expect(screen.getByRole("button", { name: "More options" })).toBeTruthy();
    });
});