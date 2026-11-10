"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import type { HandledError } from "@/lib/errors";
import { saveTicketPricing } from "@/lib/registration/actions";
import { centsToDollarInput, type Cents } from "@/lib/registration/money";
import { AUDIENCE_LABELS, AUDIENCES, PRICE_TIER_LABELS, PRICE_TIERS, TICKET_OPTIONS, type Audience, type PriceTier, type TicketOption } from "@/lib/registration/options";
import { checkDollars } from "@/lib/registration/pricingForm";
import type { PricingChange } from "@/lib/registration/pricingHistory";

/** Shorter than the public labels - the editor already groups by audience. */
const OPTION_LABELS = {
    conference_only: "Conference only",
    conference_workshop: "Conference + Workshop",
} as const satisfies Record<TicketOption, string>;

export interface EditablePrice {
    id: string;
    option: TicketOption;
    audience: Audience;
    tier: PriceTier;
    amount: Cents;
}

interface SavedValues {
    cents: Record<string, number>;
    currentTier: PriceTier;
    earlyBirdClosesOn: string;
}

interface TicketsEditorProps {
    prices: EditablePrice[];
    currentTier: PriceTier;
    /** `YYYY-MM-DD`, or `null` when no date is set. */
    earlyBirdClosesOn: string | null;
    /** Worked out on the server from the saved date, so the banner can't flicker on hydration. */
    isPastEarlyBirdClose: boolean;
    placesLeft: number;
    workshopCapacity: number;
    history: PricingChange[];
}

type SaveStatus = { kind: "idle" } | { kind: "saved"; changes: number } | { kind: "error"; error: HandledError };

const INPUT_CLASS =
    "w-28 rounded-xl border border-teal-dark/15 bg-white px-3 py-2 text-right font-medium text-teal-dark outline-none focus:border-teal focus:ring-2 focus:ring-teal/30";

/**
 * Admin -> Tickets: the 8 prices (typed in dollars, saved in cents), the current tier and the
 * informational Early Bird close date, saved together with {@link saveTicketPricing}.
 *
 * @remarks
 * Fields are checked as they're typed with the same `checkDollars` the server uses; the server
 * still re-validates and re-checks the caller is an admin. Saving revalidates the public pages,
 * which also refreshes this page's props (and the history below).
 */
export const TicketsEditor = ({
    prices,
    currentTier: savedTier,
    earlyBirdClosesOn: savedDate,
    isPastEarlyBirdClose,
    placesLeft,
    workshopCapacity,
    history,
}: TicketsEditorProps) => {
    const [saved, setSaved] = useState<SavedValues>(() => ({
        cents: Object.fromEntries(prices.map((price) => [price.id, price.amount])),
        currentTier: savedTier,
        earlyBirdClosesOn: savedDate ?? "",
    }));
    const [dollars, setDollars] = useState<Record<string, string>>(() =>
        Object.fromEntries(prices.map((price) => [price.id, centsToDollarInput(price.amount)])),
    );
    const [currentTier, setCurrentTier] = useState<PriceTier>(savedTier);
    const [earlyBirdClosesOn, setEarlyBirdClosesOn] = useState(savedDate ?? "");
    const [status, setStatus] = useState<SaveStatus>({ kind: "idle" });
    const [isPending, startTransition] = useTransition();

    const checks = Object.fromEntries(prices.map((price) => [price.id, checkDollars(dollars[price.id] ?? "")]));
    const hasInvalidPrice = Object.values(checks).some((check) => !check.ok);
    const isDirty =
        currentTier !== saved.currentTier ||
        earlyBirdClosesOn !== saved.earlyBirdClosesOn ||
        prices.some((price) => {
            const check = checks[price.id];
            return !check.ok || check.cents !== saved.cents[price.id];
        });
    const canSave = isDirty && !hasInvalidPrice && !isPending;

    const findPrice = (audience: Audience, option: TicketOption, tier: PriceTier) =>
        prices.find((price) => price.audience === audience && price.option === option && price.tier === tier);

    // clear a stale "Saved" / error message as soon as anything changes again
    const edit = <T,>(setter: (value: T) => void) => (value: T) => {
        setter(value);
        setStatus({ kind: "idle" });
    };

    const handleSave = () => {
        if (!canSave) return;
        // every price is valid here (canSave), so this is exactly what the server will store
        const savingCents = Object.fromEntries(
            prices.map((price) => {
                const check = checks[price.id];
                return [price.id, check?.ok ? check.cents : saved.cents[price.id]];
            }),
        );

        startTransition(async () => {
            const result = await saveTicketPricing({
                prices: prices.map((price) => ({ id: price.id, dollars: dollars[price.id] ?? "" })),
                currentTier,
                earlyBirdClosesOn,
            });

            if (!result.ok) {
                setStatus({ kind: "error", error: result.error });
                return;
            }

            setSaved({ cents: savingCents, currentTier, earlyBirdClosesOn });
            setStatus({ kind: "saved", changes: result.changes });
        });
    };

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                handleSave();
            }}
            className="space-y-8"
            noValidate
        >
            {isPastEarlyBirdClose && saved.currentTier === "early_bird" && (
                <p role="status" className="rounded-2xl bg-gold/40 px-5 py-4 text-sm text-teal-dark">
                    The Early Bird close date has passed. Switch the current tier to Full Registration below when
                    you&apos;re ready - new registrations keep paying Early Bird prices until you do.
                </p>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                {AUDIENCES.map((audience) => (
                    <fieldset key={audience} className="min-w-0">
                        <legend className="eyebrow mb-3 text-teal-dark/60">{AUDIENCE_LABELS[audience]}</legend>
                        <div className="space-y-5">
                            {TICKET_OPTIONS.map((option) => (
                                <div key={option}>
                                    <p className="mb-2 font-medium">{OPTION_LABELS[option]}</p>
                                    <div className="space-y-2">
                                        {PRICE_TIERS.map((tier) => {
                                            const price = findPrice(audience, option, tier);
                                            if (!price) return null;
                                            const check = checks[price.id];
                                            const errorId = `price-error-${price.id}`;
                                            const isCurrent = tier === currentTier;

                                            return (
                                                <div key={tier}>
                                                    <div className="price-row gap-4 bg-white">
                                                        <label htmlFor={`price-${price.id}`} className="flex items-center gap-2">
                                                            {PRICE_TIER_LABELS[tier]}
                                                            {isCurrent && (
                                                                <span className="rounded-full bg-gold px-2.5 py-0.5 text-[0.6rem] font-medium tracking-[0.15em] uppercase">
                                                                    Current
                                                                </span>
                                                            )}
                                                        </label>
                                                        <span className="flex items-center gap-1.5">
                                                            <span aria-hidden="true">$</span>
                                                            <input
                                                                id={`price-${price.id}`}
                                                                inputMode="decimal"
                                                                autoComplete="off"
                                                                value={dollars[price.id] ?? ""}
                                                                onChange={(event) =>
                                                                    edit(setDollars)({ ...dollars, [price.id]: event.target.value })
                                                                }
                                                                aria-invalid={!check?.ok}
                                                                aria-describedby={check?.ok ? undefined : errorId}
                                                                className={cn(INPUT_CLASS, !check?.ok && "border-red-600 focus:ring-red-600/30")}
                                                            />
                                                        </span>
                                                    </div>
                                                    {check && !check.ok && (
                                                        <p id={errorId} className="mt-1 px-2 text-sm text-red-700">
                                                            {check.message}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </fieldset>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <fieldset>
                    <legend className="mb-2 font-medium">Current tier</legend>
                    <p className="mb-3 text-sm text-teal-dark/70">
                        What new registrations pay, starting as soon as you save. Existing registrations keep the price
                        they paid.
                    </p>
                    <div className="inline-flex rounded-full bg-white p-1">
                        {PRICE_TIERS.map((tier) => (
                            <label
                                key={tier}
                                className={cn(
                                    "cursor-pointer rounded-full px-5 py-2 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal",
                                    currentTier === tier ? "bg-teal-dark text-cream" : "text-teal-dark/70 hover:text-teal-dark",
                                )}
                            >
                                <input
                                    type="radio"
                                    name="currentTier"
                                    value={tier}
                                    checked={currentTier === tier}
                                    onChange={() => edit(setCurrentTier)(tier)}
                                    className="sr-only"
                                />
                                {PRICE_TIER_LABELS[tier]}
                            </label>
                        ))}
                    </div>
                </fieldset>

                <div>
                    <label htmlFor="early-bird-closes-on" className="mb-2 block font-medium">
                        Early Bird closes on
                    </label>
                    <p className="mb-3 text-sm text-teal-dark/70">
                        For information only - it doesn&apos;t switch the tier by itself. Leave it empty if there&apos;s no set
                        date.
                    </p>
                    <input
                        id="early-bird-closes-on"
                        type="date"
                        value={earlyBirdClosesOn}
                        onChange={(event) => edit(setEarlyBirdClosesOn)(event.target.value)}
                        className={cn(INPUT_CLASS, "w-48 text-left")}
                    />
                </div>
            </div>

            <p className="text-sm text-teal-dark/70">
                <span className="font-medium text-teal-dark">
                    {placesLeft} of {workshopCapacity}
                </span>{" "}
                Conference + Workshop places are left. The cap is fixed and can&apos;t be changed here.
            </p>

            <div className="flex flex-wrap items-center gap-4">
                <button type="submit" disabled={!canSave} className="btn-pill btn-dark disabled:pointer-events-none disabled:opacity-50">
                    {isPending ? "Saving…" : "Save prices"}
                </button>
                <SaveMessage status={status} isDirty={isDirty} />
            </div>

            <PricingHistory history={history} />
        </form>
    );
};

const SaveMessage = ({ status, isDirty }: { status: SaveStatus; isDirty: boolean }) => {
    if (status.kind === "error") {
        return (
            <div role="alert" className="text-sm text-red-700">
                <p className="font-medium">{status.error.message}</p>
                {status.error.hint && <p>{status.error.hint}</p>}
            </div>
        );
    }
    if (status.kind === "saved") {
        return (
            <p role="status" className="text-sm text-teal-dark">
                {status.changes === 0 ? "Nothing had changed." : "Saved - the public site now shows these prices."}
            </p>
        );
    }
    return isDirty ? <p className="text-sm text-teal-dark/70">You have unsaved changes.</p> : null;
};

const PricingHistory = ({ history }: { history: PricingChange[] }) => (
    <div>
        <h3 className="eyebrow mb-3 text-teal-dark/60">Recent price changes</h3>
        {history.length === 0 ? (
            <p className="text-sm text-teal-dark/70">No changes yet.</p>
        ) : (
            <ul className="space-y-2">
                {history.map((change) => (
                    <li key={change.id} className="rounded-2xl bg-white px-5 py-3 text-sm">
                        <span className="font-medium">{change.summary}</span>
                        <span className="block text-teal-dark/60">
                            {change.by}, {change.at}
                        </span>
                    </li>
                ))}
            </ul>
        )}
    </div>
);