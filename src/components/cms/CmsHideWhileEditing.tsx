import type { ReactNode } from "react";
import { isCmsEditor } from "@/lib/cms/editor";
import { CmsHideWhileEditingClient } from "@/components/cms/CmsHideWhileEditingClient";

/**
 * Hides `children` while the enclosing {@link CmsBox} is editing - for view-only markup that
 * a field's edit input already covers (e.g. the second half of the Welcome letter).
 */
export const CmsHideWhileEditing = async ({ children }: { children: ReactNode }) => {
    if (!(await isCmsEditor())) return <>{children}</>;

    return <CmsHideWhileEditingClient>{children}</CmsHideWhileEditingClient>;
};