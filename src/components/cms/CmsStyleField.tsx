import { isCmsEditor } from "@/lib/cms/editor";
import { CmsStyleFieldClient, type CmsStyleFieldClientProps } from "@/components/cms/CmsStyleFieldClient";

/** Card style picker inside a {@link CmsBox} - renders nothing for visitors. The box's `values` must include `style`. */
export const CmsStyleField = async (props: CmsStyleFieldClientProps) => {
    if (!(await isCmsEditor())) return null;

    return <CmsStyleFieldClient {...props} />;
};