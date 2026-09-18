import { SectionTag } from "@/components/shared/SectionTag";
import { PlaceholderBox } from "@/components/shared/PlaceholderBox";

export const Welcome = () => {
    return (
        <section id="welcome" className="section-block container-site scroll-mt-24">
            {/* items-start so the sticky image column has room to travel down the taller copy column */}
            <div className="grid items-start gap-12 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-20">
                <div className="space-y-7">
                    <SectionTag>Welcome</SectionTag>

                    <p className="lead-copy">
                        It is with great pleasure that we welcome you to the 13th Gestalt Australia & New Zealand
                        Conference, <span className="text-teal">In Our Bodies, Of The Field</span>, held on the
                        lands of the Yugambeh people of the Gold Coast, and marking 30 years of Gestalt Australia &
                        New Zealand.
                    </p>

                    <p className="body-copy">
                        On behalf of GANZ Council and the Conference Organising Group, it is a joy to invite you into
                        this gathering - a space to come together, to think, to feel, to question, to move, to connect
                        and to be changed by one another.
                    </p>

                    <p className="body-copy">
                        Our theme, In Our Bodies, Of The Field, invites us to turn our attention towards embodiment:
                        to the ways we experience ourselves through and with our bodies, and to the ways our bodies
                        are always situated within families, relationships, cultures, histories and wider social and
                        political fields.
                    </p>

                    <p className="body-copy">
                        We will explore what it means to practise Gestalt when we take seriously the diversity of
                        bodies and body experiences. Bodies shaped by race, gender, sexuality, disability,
                        neurodivergence, chronic illness, ageing and developmental change. Bodies arriving in the
                        world, growing, changing, becoming parents, becoming adolescents, experiencing pleasure and
                        pain, illness and health, loss and grief, ageing and death. Bodies that are welcomed, watched,
                        judged, celebrated, marginalised and politicised.
                    </p>

                    <blockquote className="card bg-gold px-10 py-9 text-lg leading-relaxed font-medium text-teal-dark sm:text-xl">
                        And we will ask what happens when we bring this awareness more fully into our therapeutic
                        relationships and into our understanding of field.
                    </blockquote>

                    <p className="body-copy">
                        This conference is also a celebration. Thirty years of GANZ is thirty years of people
                        gathering, learning, challenging, creating, supporting one another and carrying Gestalt
                        forward. We want to honour that history while also making room for what comes next.
                    </p>

                    <p className="body-copy">
                        We hope you will bring your whole self to this gathering - your clinical knowledge and your
                        questions, your experience and your uncertainty, your curiosity, your creativity, your body
                        and your way of being in relationship.
                    </p>

                    <p className="body-copy">
                        There will be opportunities to listen and to learn, to present and to participate, to move
                        and to rest, to think deeply and to simply be together. We hope the conversations that begin
                        here will continue well beyond the conference itself.
                    </p>

                    <p className="body-copy">
                        We look forward to welcoming you to the Gold Coast in June 2027, as we celebrate 30 years of
                        GANZ and gather together to imagine, question and create the next chapter of our community.
                    </p>
                </div>

                {/* stays pinned below the navbar while the welcome copy scrolls past */}
                <div className="lg:sticky lg:top-28">
                    <PlaceholderBox className="aspect-[4/5] w-full rounded-3xl shadow-lg shadow-teal-dark/10" />
                    <span className="caption-mono">
                        Image to come - Gold Coast, Griffith University campus or surrounding area
                    </span>
                </div>
            </div>
        </section>
    );
};