import type { ReactNode } from "react";
import { isCmsEditor } from "@/lib/cms/editor";
import { getFiles } from "@/lib/content/getFiles";
import { CmsEditorProvider } from "@/components/cms/CmsEditorProvider";
import { AdminBar } from "@/components/cms/AdminBar";

/**
 * Wraps a CMS-driven page: admins get the inline editor, visitors never receive its
 * provider, toolbar or file list.
 */
export const CmsPage = async ({ children }: { children: ReactNode }) => {
    if (!(await isCmsEditor())) return <>{children}</>;

    const files = await getFiles();

    return (
        <CmsEditorProvider files={files}>
            {children}
            <AdminBar />
        </CmsEditorProvider>
    );
};