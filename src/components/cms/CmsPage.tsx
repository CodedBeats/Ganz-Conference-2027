import type { ReactNode } from "react";
import { isCmsEditor } from "@/lib/cms/editor";
import { getFiles } from "@/lib/content/getFiles";
import { getCmsEditSession } from "@/lib/cms/history";
import { CmsEditorProvider } from "@/components/cms/CmsEditorProvider";
import { AdminTools } from "@/components/cms/AdminTools";

/**
 * Wraps a CMS-driven page: admins get the inline editor, visitors never receive its
 * provider, admin tools, file list or edit history.
 */
export const CmsPage = async ({ children }: { children: ReactNode }) => {
    if (!(await isCmsEditor())) return <>{children}</>;

    const [files, editSession] = await Promise.all([getFiles(), getCmsEditSession()]);

    return (
        <CmsEditorProvider files={files} editSession={editSession}>
            {children}
            <AdminTools />
        </CmsEditorProvider>
    );
};