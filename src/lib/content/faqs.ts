import type { FaqItem } from "@/types/content";

/**
 * FAQ entries in display order. Fill in `answer` as details are confirmed -
 * an empty answer still renders the question, just with no expandable body.
 */
export const FAQS: FaqItem[] = [
    {
        id: "registrations-open",
        question: "When do registrations open?",
        answer: "Registrations open in 2026. Rates, including early bird and scholarship places, are being finalised and will be published here.",
    },
    {
        id: "where-held",
        question: "Where is the conference held?",
        answer: "",
    },
    {
        id: "open-to-trainees",
        question: "Is the conference open to trainees?",
        answer: "",
    },
    {
        id: "experiential-sessions",
        question: "Will there be experiential and somatic sessions?",
        answer: "",
    },
    {
        id: "present-workshop",
        question: "Can I present or run a workshop?",
        answer: "",
    },
];