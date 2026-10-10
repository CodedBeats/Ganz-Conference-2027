import { isCmsEditor } from "@/lib/cms/editor";
import { CmsTextClient, type CmsTextClientProps } from "@/components/cms/CmsTextClient";

/**
 * An editable text field inside a {@link CmsBox}. Visitors just get `children`.
 *
 * @remarks
 * `children` is the normal view and should handle its own empty state (render nothing when
 * the value is empty) - the field still appears with a placeholder while editing, so empty
 * values can be filled in.
 */
export const CmsText = async ({ children, ...props }: CmsTextClientProps) => {
    if (!(await isCmsEditor())) return <>{children}</>;

    return <CmsTextClient {...props}>{children}</CmsTextClient>;
};