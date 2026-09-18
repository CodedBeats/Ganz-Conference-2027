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
        answer: "At Griffith University's Gold Coast campus, Parklands Drive, Southport, on the lands of the Yugambeh people, 25-27 June 2027.",
    },
    {
        id: "open-to-trainees",
        question: "Is the conference open to trainees?",
        answer: "Yes. Trainees and students are warmly welcome, and a limited number of supported scholarship places will be offered.",
    },
    {
        id: "experiential-sessions",
        question: "Will there be experiential and somatic sessions?",
        answer: "Yes - alongside keynotes and clinical conversations, the program includes experiential workshops and somatic offerings that invite movement, rest and play.",
    },
    {
        id: "present-workshop",
        question: "Can I present or run a workshop?",
        answer: "A call for papers and workshop proposals will be released ahead of the conference. Details to be confirmed.",
    },
];
