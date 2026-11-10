import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { RegistrationFieldPath } from "@/lib/registration/schema";

/** The DOM id of a field (or of a group's fieldset), e.g. `register-membership-email`. */
export const fieldId = (path: RegistrationFieldPath) => `register-${path.replace(".", "-")}`;

/** The id of a field's error message, for `aria-describedby`. */
export const errorId = (path: RegistrationFieldPath) => `${fieldId(path)}-error`;

export const INPUT_CLASS =
    "w-full rounded-2xl border border-teal-dark/15 bg-white px-5 py-3.5 text-base text-teal-dark outline-none transition-colors placeholder:text-teal-dark/40 focus:border-teal focus:ring-2 focus:ring-teal/30 aria-[invalid=true]:border-red-600 aria-[invalid=true]:focus:ring-red-600/30";

export const LABEL_CLASS = "mb-2 block font-medium text-teal-dark";
export const HINT_CLASS = "mb-3 text-sm leading-relaxed text-teal-dark/65";

/** A radio or checkbox shown as a card, highlighted while it's chosen. */
export const CHOICE_CLASS =
    "flex cursor-pointer items-start gap-3 rounded-2xl border border-teal-dark/15 bg-white px-5 py-4 transition-colors has-[:checked]:border-teal has-[:checked]:bg-teal-pale has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60";

export const CHOICE_INPUT_CLASS = "mt-1 size-4 shrink-0 accent-teal";

/** The ARIA props for a field, given its errors. */
export const errorProps = (path: RegistrationFieldPath, errors: string[] | undefined) =>
    errors?.length ? { "aria-invalid": true, "aria-describedby": errorId(path) } : { "aria-invalid": false };

/**
 * The ARIA props for a group of choices (a fieldset). `aria-invalid` isn't valid on a group, so the
 * error is only linked through `aria-describedby`; the legend still names the question.
 */
export const groupErrorProps = (path: RegistrationFieldPath, errors: string[] | undefined) =>
    errors?.length ? { "aria-describedby": errorId(path) } : {};

export const FieldError = ({ path, errors }: { path: RegistrationFieldPath; errors: string[] | undefined }) => {
    if (!errors?.length) return null;
    return (
        <p id={errorId(path)} className="mt-2 text-sm font-medium text-red-700">
            {errors[0]}
        </p>
    );
};

interface FieldShellProps {
    path: RegistrationFieldPath;
    label: string;
    isOptional?: boolean;
    hint?: ReactNode;
    errors: string[] | undefined;
    children: ReactNode;
    className?: string;
}

/** A label, optional hint, the input itself and its error. */
export const FieldShell = ({ path, label, isOptional, hint, errors, children, className }: FieldShellProps) => (
    <div className={className}>
        <label htmlFor={fieldId(path)} className={LABEL_CLASS}>
            {label}
            {isOptional && <span className="ml-2 text-sm font-normal text-teal-dark/55">(optional)</span>}
        </label>
        {hint && <p className={HINT_CLASS}>{hint}</p>}
        {children}
        <FieldError path={path} errors={errors} />
    </div>
);

interface FormSectionProps {
    number: number;
    title: string;
    description?: ReactNode;
    children: ReactNode;
}

/** One numbered section of the form (a card). */
export const FormSection = ({ number, title, description, children }: FormSectionProps) => (
    <section aria-labelledby={`register-section-${number}`} className="card bg-white">
        <span className="eyebrow mb-2 text-teal">Section {number}</span>
        <h2 id={`register-section-${number}`} className="mb-2 text-2xl leading-tight font-heading sm:text-3xl">
            {title}
        </h2>
        {description && <div className="mb-6 text-base leading-relaxed text-teal-dark/70">{description}</div>}
        <div className={cn("space-y-6", !description && "mt-6")}>{children}</div>
    </section>
);
