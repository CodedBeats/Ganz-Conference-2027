import { isCmsEditor } from "@/lib/cms/editor";
import { CmsBoxClient, type CmsBoxClientProps } from "@/components/cms/CmsBoxClient";

/**
 * Wraps one editable database row. Visitors get the plain element; admins get the editor box.
 *
 * @example
 * ```tsx
 * <CmsBox as="li" className="card" table="people" rowId={person.id} label={`Keynote: ${person.name}`}
 *     values={{ name: person.name, title: person.title }}>
 *     <CmsText field="name" label="Name"><h3>{person.name}</h3></CmsText>
 * </CmsBox>
 * ```
 */
export const CmsBox = async ({ as: Tag = "div", className, children, ...props }: CmsBoxClientProps) => {
    if (!(await isCmsEditor())) return <Tag className={className}>{children}</Tag>;

    return (
        <CmsBoxClient as={Tag} className={className} {...props}>
            {children}
        </CmsBoxClient>
    );
};