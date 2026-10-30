import Link from "next/link";
import { Hero } from "@/components/hero/Hero";
import { Nav } from "@/components/ui/Nav";
import { ShellMark } from "@/components/ui/Wordmark";
import { DEMO_PEOPLE } from "@/lib/demo";

const STEPS = [
  {
    title: "Share a few memories",
    body: "A name, a birth year, a hometown and a handful of things they loved. Type it or say it out loud.",
  },
  {
    title: "Agents rebuild their world",
    body: "A Curator agent follows their taste through Qloo's graph of 250 million cultural entities, across music, film, television, faces, books, brands and places, filtered to the years between ten and thirty.",
  },
  {
    title: "Sit together for a session",
    body: "Twenty calm minutes: a song to welcome them, a film star they adored, a moment from their own story, a taste or a scent, and a gentle song to close. The prompts invite. They never quiz.",
  },
  {
    title: "It learns from every reaction",
    body: "Tap how they responded. A Reflector agent explores around what made them light up, rests what fell flat, and never brings back what upset them.",
  },
];

export default function Home() {
  return (
    <>
      <div className="absolute inset-x-0 top-0 z-40">
        <Nav />
      </div>
      <main>
        <Hero />

        <section id="how" className="mx-auto w-full max-w-[1240px] scroll-mt-10 px-5 py-24 sm:px-8 sm:py-32">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 className="display text-[clamp(2.2rem,5vw,3.75rem)]">From a few names to a whole world.</h2>
              <p className="mt-6 max-w-[40ch] text-lg leading-relaxed text-paper-dim">
                Named for Proust&apos;s madeleine: the taste of a little cake that brought his whole childhood rushing back.
                Every family remembers a handful of favourites. Madeleine finds the hundred things around them.
              </p>
            </div>
            <ol className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative border-t border-umber-700 pt-6">
                  <span className="display absolute -top-5 left-0 bg-umber-900 pr-3 text-3xl text-amber">{i + 1}</span>
                  <h3 className="display-soft text-[1.45rem] text-paper">{s.title}</h3>
                  <p className="mt-3 leading-relaxed text-paper-dim">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="relative overflow-hidden border-y border-umber-800 bg-umber-950/60">
          <div className="mx-auto grid w-full max-w-[1240px] gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2">
            <div>
              <h2 className="display text-[clamp(2rem,4.5vw,3.4rem)]">Why a taste graph, and not just a chatbot?</h2>
              <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-paper-dim">
                Ask a language model about someone born in 1942 and it hands everyone the same list: Elvis, Casablanca, I Love
                Lucy. That&apos;s a decade, not a person. Qloo knows which records, films and faces actually travel together in
                people&apos;s taste, so a Doris Day fan and a Charlie Parker fan from the same street get two different
                worlds.
              </p>
              <p className="mt-5 max-w-[46ch] leading-relaxed text-paper-dim">
                Every item Madeleine shows is a real entity from Qloo&apos;s graph. The language model chooses and writes, but
                it cannot invent. Each profile includes a live side-by-side test against the same model without Qloo.
              </p>
            </div>
            <figure className="self-center rounded-2xl border border-umber-700 bg-umber-900/70 p-7">
              <blockquote className="display-soft text-[1.6rem] leading-snug text-paper">
                Musical memories are often among the last to fade. The brain regions that hold long-known music are relatively
                spared in Alzheimer&apos;s disease.
              </blockquote>
              <figcaption className="mt-5 text-sm leading-relaxed text-smoke">
                Jacobsen et al., <cite>Why musical memory can be preserved in advanced Alzheimer&apos;s disease</cite>, Brain, 2015.
                The &ldquo;reminiscence bump&rdquo; explains the years Madeleine targets: we remember most vividly what happened
                between about ten and thirty.
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1240px] px-5 py-24 sm:px-8">
          <h2 className="display text-[clamp(2rem,4.5vw,3.4rem)]">Try it with someone we made up.</h2>
          <p className="mt-4 max-w-[52ch] text-lg text-paper-dim">
            Four fictional people from four cities. Watch the agents work live, then open a session.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DEMO_PEOPLE.map((d) => (
              <Link
                key={d.key}
                href={`/new?demo=${d.key}&go=1`}
                className="group relative overflow-hidden rounded-2xl border border-umber-700 bg-umber-850 p-6 transition-colors hover:border-amber/70"
              >
                <p className="display text-[2.4rem] text-paper">{d.intake.name}</p>
                <p className="mt-1 text-smoke">
                  Born {d.intake.birthYear}, {d.intake.hometown.split(",")[0]}
                </p>
                <p className="mt-4 leading-snug text-paper-dim">{d.teaser}</p>
                <p className="mt-6 font-semibold text-amber transition-colors group-hover:text-amber-glow">Build their world</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1240px] px-5 pb-28 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl bg-umber-850 p-7">
              <h3 className="display-soft text-2xl">For families</h3>
              <p className="mt-3 leading-relaxed text-paper-dim">
                Something to do together on a visit that isn&apos;t small talk. Play the songs, look at the faces, share a taste
                of an egg cream.
              </p>
            </div>
            <div className="rounded-2xl bg-umber-850 p-7">
              <h3 className="display-soft text-2xl">For care homes</h3>
              <p className="mt-3 leading-relaxed text-paper-dim">
                Person-centred activities for every resident in minutes, a printable card of their cultural world for staff,
                and a record of what works.
              </p>
            </div>
            <div className="rounded-2xl bg-umber-850 p-7">
              <h3 className="display-soft text-2xl">Private by design</h3>
              <p className="mt-3 leading-relaxed text-paper-dim">
                Profiles are saved in your browser, not on our servers. No accounts, no tracking. Delete a profile and it is
                gone.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-umber-800">
        <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-10 text-sm text-smoke sm:px-8">
          <p className="flex items-center gap-2">
            <ShellMark className="size-5 text-amber" />
            Built for the Qloo Agentic Hackathon with Qloo&apos;s Taste AI and Groq.
          </p>
          <p>Not medical advice. Madeleine supports carers; it does not treat dementia.</p>
        </div>
      </footer>
    </>
  );
}
