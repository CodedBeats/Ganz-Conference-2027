import { Share2 } from "lucide-react";
import type { CmsSection, CmsStatItem } from "@/types/content";
import { FOOTER_LINKS } from "@/lib/content/site";
import { RichText } from "@/components/shared/RichText";
import { ContentImage } from "@/components/shared/ContentImage";
import { PlaceholderBox } from "@/components/shared/PlaceholderBox";
import { CmsBox } from "@/components/cms/CmsBox";
import { CmsImageSlot } from "@/components/cms/CmsImageSlot";
import { CmsText } from "@/components/cms/CmsText";
import { ShareDialog } from "@/components/shared/ShareDialog";

// footer splits the nav into two columns; ABOUT holds the last four links
const ABOUT_IDS = new Set(["sponsors", "committee", "faqs", "contact"]);
const CONFERENCE_LINKS = FOOTER_LINKS.filter((link) => !ABOUT_IDS.has(link.id));
const ABOUT_LINKS = FOOTER_LINKS.filter((link) => ABOUT_IDS.has(link.id));

const DESCRIPTION_CLASS = "max-w-xs text-base leading-relaxed text-teal-dark/70";
const ACKNOWLEDGEMENT_CLASS = "text-sm leading-relaxed text-teal-dark/70";
const COPYRIGHT_CLASS = "text-sm text-teal-dark/60";

const FooterLinks = ({ heading, links }: { heading: string; links: typeof FOOTER_LINKS }) => (
    <div>
        <span className="eyebrow mb-5 text-teal-dark/50">{heading}</span>
        <ul className="space-y-2.5">
            {links.map((link) => (
                <li key={link.id}>
                    <a href={`#${link.id}`} className="text-base text-teal-dark transition-colors hover:text-teal">
                        {link.id === "keynotes" ? "Keynote Presenters" : link.label}
                    </a>
                </li>
            ))}
        </ul>
    </div>
);

// a detail is a stat: label = what it is (shown only in the editor), value = the text.
// the email detail renders as a mailto link.
const FooterDetail = ({ detail }: { detail: CmsStatItem }) => {
    const value = detail.value.trim();
    const isEmail = detail.label.toLowerCase() === "email";

    return (
        <CmsBox
            as="li"
            table="stat_items"
            rowId={detail.id}
            label={`Footer detail: ${detail.label}`}
            values={{ label: detail.label, value: detail.value }}
        >
            <CmsText field="label" label="Label" editClassName="eyebrow text-teal-dark/50" />
            <CmsText field="value" label="Value" multiline editClassName="text-base text-teal-dark">
                {isEmail ? (
                    <a href={`mailto:${value}`} className="transition-colors hover:text-teal">
                        {value}
                    </a>
                ) : (
                    <RichText text={detail.value} />
                )}
            </CmsText>
        </CmsBox>
    );
};

// a flag is a stat: label = alt text, image = the flag
const FooterFlag = ({ flag }: { flag: CmsStatItem }) => (
    <CmsBox as="li" table="stat_items" rowId={flag.id} label={`Flag: ${flag.label}`} values={{ label: flag.label }}>
        <CmsImageSlot
            table="stat_items"
            rowId={flag.id}
            field="image"
            fileId={flag.image?.id ?? null}
            folder="misc"
            label={`Flag: ${flag.label}`}
            isHiddenWhenEmpty
            placeholder={<PlaceholderBox label="Flag" className="h-6 w-10 rounded-sm" />}
        >
            <ContentImage image={flag.image} alt={flag.label} width={48} height={28} className="h-6 w-auto rounded-sm" />
        </CmsImageSlot>
        {/* not shown as text - it's the flag's alt text */}
        <CmsText field="label" label="Flag name (alt text)" editClassName="text-sm" />
    </CmsBox>
);

/**
 * The page footer, driven by the `footer` section.
 *
 * @remarks
 * The section's stat items are two unrendered group rows - "Details" and "Flags" -
 * whose children are the editable rows. Grouping by row rather than by "has an image"
 * means a flag whose image was cleared in the CMS doesn't turn into a detail line.
 *
 * Field mapping: `image` = logo, `body` = description under the logo, `excerpt` =
 * acknowledgement of country, `subheading` = copyright line.
 */
export const Footer = ({ section }: { section?: CmsSection }) => {
    if (!section) return null;

    const details = section.stats.find((stat) => stat.label === "Details")?.children ?? [];
    const flags = section.stats.find((stat) => stat.label === "Flags")?.children ?? [];

    return (
        <footer className="container-site border-t border-teal-dark/10 pt-16 pb-10">
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
                <div>
                    <CmsImageSlot
                        table="sections"
                        rowId={section.id}
                        field="image_id"
                        fileId={section.image?.id ?? null}
                        folder="general"
                        label="Footer logo"
                        className="mb-6"
                        isHiddenWhenEmpty
                        placeholder={<PlaceholderBox label="Logo" className="h-24 w-28 rounded-xl" />}
                    >
                        <ContentImage
                            image={section.image}
                            alt="GANZ - Gestalt Australia & New Zealand"
                            width={120}
                            height={104}
                            className="h-24 w-auto"
                        />
                    </CmsImageSlot>
                    <CmsBox table="sections" rowId={section.id} label="Footer description" values={{ body: section.body }}>
                        <CmsText field="body" label="Description" multiline hint="highlight" editClassName={DESCRIPTION_CLASS}>
                            <p className={DESCRIPTION_CLASS}>
                                <RichText text={section.body} />
                            </p>
                        </CmsText>
                    </CmsBox>
                    <ShareDialog className="btn-pill btn-dark mt-6 hover:bg-teal">
                        <Share2 className="size-4" />
                        Share the conference
                    </ShareDialog>
                </div>

                <FooterLinks heading="Conference" links={CONFERENCE_LINKS} />
                <FooterLinks heading="About" links={ABOUT_LINKS} />

                <div>
                    <span className="eyebrow mb-5 text-teal-dark/50">Details</span>
                    <ul className="space-y-3 text-base text-teal-dark">
                        {details.map((detail) => (
                            <FooterDetail key={detail.id} detail={detail} />
                        ))}
                    </ul>
                </div>
            </div>

            {/* acknowledgement of country */}
            <div className="mt-14 flex flex-col gap-6 border-t border-teal-dark/10 pt-8 md:flex-row md:items-start md:gap-10">
                <ul className="flex shrink-0 items-center gap-3">
                    {flags.map((flag) => (
                        <FooterFlag key={flag.id} flag={flag} />
                    ))}
                </ul>
                <CmsBox table="sections" rowId={section.id} label="Acknowledgement of Country" values={{ excerpt: section.excerpt }}>
                    <CmsText field="excerpt" label="Acknowledgement" multiline hint="highlight" editClassName={ACKNOWLEDGEMENT_CLASS}>
                        <p className={ACKNOWLEDGEMENT_CLASS}>
                            <RichText text={section.excerpt} />
                        </p>
                    </CmsText>
                </CmsBox>
            </div>

            <CmsBox
                className="mt-8 border-t border-teal-dark/10 pt-6"
                table="sections"
                rowId={section.id}
                label="Copyright line"
                values={{ subheading: section.subheading }}
            >
                <CmsText field="subheading" label="Copyright line" editClassName={COPYRIGHT_CLASS}>
                    <p className={COPYRIGHT_CLASS}>{section.subheading}</p>
                </CmsText>
            </CmsBox>
        </footer>
    );
};