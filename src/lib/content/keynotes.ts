import type { Keynote } from "@/types/content";

/** Keynote presenters in display order. Unannounced slots stay as TBA cards. */
export const KEYNOTES: Keynote[] = [
    {
        id: "michael-clemmens",
        isAnnounced: true,
        name: "Michael Clemmens",
        subtitle: "Pittsburgh, USA",
        bio: "Psychologist, Gestalt trainer and author whose work centres the body as the ground of contact. He teaches internationally on embodiment, addiction and the somatic field of the therapeutic relationship.",
        imageSrc: "/design/imgs/Michael Clemons.jpg",
        website: "https://michaelclemmens.com",
    },
    {
        id: "keynote-two",
        isAnnounced: false,
        name: "To be announced",
        subtitle: "Keynote Two",
        bio: "Our second keynote presenter will be announced soon.",
    },
    {
        id: "keynote-three",
        isAnnounced: false,
        name: "To be announced",
        subtitle: "Keynote Three",
        bio: "Our third keynote presenter will be announced soon.",
    },
];
