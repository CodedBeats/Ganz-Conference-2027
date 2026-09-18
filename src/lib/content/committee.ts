import type { CommitteeMember } from "@/types/content";

/** Conference organising committee in display order. */
export const COMMITTEE: CommitteeMember[] = [
    { id: "michelle-sier", name: "Michelle Sier", role: "GANZ President", bio: "Bio coming soon." },
    { id: "tegan-mumford", name: "Tegan Mumford", role: "Committee", bio: "Bio coming soon." },
    { id: "zoe-webber", name: "Zoe Webber", role: "Committee", bio: "Bio coming soon." },
    { id: "mia-obrian", name: "Mia O'Brian", role: "Committee", bio: "Bio coming soon." },
    { id: "gina-denholm", name: "Gina Denholm", role: "Committee", bio: "Bio coming soon." },
    { id: "michael-pitt", name: "Michael Pitt", role: "Committee", bio: "Bio coming soon." },
    {
        id: "more-to-come",
        name: "More to come",
        role: "Committee",
        bio: "Further members to be announced.",
        isPlaceholder: true,
    },
];