"use client";

import dynamic from "next/dynamic";
import { EVENT } from "@/lib/content/site";

// Leaflet needs `window`, so the map only ever renders in the browser
const Map = dynamic(() => import("@/components/ui/Map"), { ssr: false });

// Split out so Location itself can stay a server component (and host CMS edit boxes).
export const LocationMap = ({ venueName }: { venueName: string }) => {
    return <Map lat={EVENT.addressCords[0]} lng={EVENT.addressCords[1]} zoom={14} venueName={venueName} />;
};