import type { ReactNode } from "react";
import Image, { type ImageProps } from "next/image";
import type { CmsImage } from "@/types/content";

type ContentImageProps = Omit<ImageProps, "src" | "alt"> & {
    image: CmsImage | null;
    /** Pass `""` for purely decorative photos. */
    alt: string;
    /** Rendered instead when the CMS has no image yet (nothing by default). */
    fallback?: ReactNode;
};

// next/image for a CMS image row, with a fallback for slots still waiting on an asset.
export const ContentImage = ({ image, alt, fallback = null, ...imageProps }: ContentImageProps) => {
    if (!image) return fallback;

    return <Image src={image.file_ref} alt={alt} {...imageProps} />;
};