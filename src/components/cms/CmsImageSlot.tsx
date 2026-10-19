import { isCmsEditor } from "@/lib/cms/editor";
import { CmsImageSlotClient, type CmsImageSlotClientProps } from "@/components/cms/CmsImageSlotClient";

/**
 * Wraps an image that admins can swap from the file library. Visitors get a plain `div`.
 *
 * @remarks
 * With `accept="pdf"` it holds a PDF instead - the children render whatever links to it.
 *
 * Put the image's layout classes on the slot itself (`className`) - it's the image's direct
 * wrapper, so `fill` images and aspect ratios size against it. Visitors never see
 * `placeholder`; with `isHiddenWhenEmpty` they get nothing at all for an empty slot.
 *
 * @example
 * ```tsx
 * <CmsImageSlot table="people" rowId={person.id} field="image" fileId={person.image?.id ?? null}
 *     folder="keynotes" label={`Keynote: ${person.name}`}>
 *     <ContentImage image={person.image} alt={person.name} width={750} height={500} />
 * </CmsImageSlot>
 * ```
 */
export const CmsImageSlot = async ({ className, children, ...props }: CmsImageSlotClientProps) => {
    if (!(await isCmsEditor())) {
        if (props.isHiddenWhenEmpty && props.fileId === null) return null;
        return <div className={className}>{children}</div>;
    }

    return (
        <CmsImageSlotClient className={className} {...props}>
            {children}
        </CmsImageSlotClient>
    );
};