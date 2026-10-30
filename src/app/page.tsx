import Link from "next/link";
import { Hero } from "@/components/hero/Hero";
import { Nav } from "@/components/ui/Nav";
import { DEMO_PEOPLE } from "@/lib/demo";

const STEPS = [
  {
    num: "01",
    tag: "Intake",
    accent: "text-amber",
    border: "border-amber/40",
    badge: "bg-amber/10 text-amber border-amber/30",
    title: "Share a few memories",
    body: (
      <>
        A name, a birth year, a hometown and a handful of things they loved.{" "}
        <span className="font-editorial-italic text-paper font-medium">Type it or say it out loud.</span>
      </>
    ),
  },
  {
    num: "02",
    tag: "Curator Agent",
    accent: "text-tv",
    border: "border-tv/40",
    badge: "bg-tv/10 text-tv border-tv/30",
    title: "Agents rebuild their world",
    body: (
      <>
        A Curator agent follows their taste through Qloo&apos;s graph of{" "}
        <span className="text-paper font-medium">250 million cultural entities</span> — across music, film, television, faces,
        books, brands and places, filtered to their formative youth.
      </>
    ),
  },
  {
    num: "03",
    tag: "Care Session",
    accent: "text-film",
    border: "border-film/40",
    badge: "bg-film/10 text-film border-film/30",
    title: "Sit together for a session",
    body: (
      <>
        Twenty calm minutes: a welcoming song, an adored film star, a personal milestone, a familiar taste or scent.{" "}
        <span className="font-editorial-italic text-amber-glow font-medium text-[1.05rem]">The prompts invite. They never quiz.</span>
      </>
    ),
  },
  {
    num: "04",
    tag: "Reflector Agent",
    accent: "text-brands",
    border: "border-brands/40",
    badge: "bg-brands/10 text-brands border-brands/30",
    title: "It learns from every reaction",
    body: (
      <>
        <span className="font-editorial-italic text-paper font-medium">Tap how they responded.</span> A Reflector agent
        explores around what made them light up, rests what fell flat, and never brings back what upset them.
      </>
    ),
  },
];

const DEMO_STYLES: Record<
  string,
  {
    genre: string;
    border: string;
    badge: string;
    glow: string;
    accent: string;
    bgTint: string;
  }
> = {
  rose: {
    genre: "Broadway & Cinema",
    border: "border-amber/30 hover:border-amber",
    badge: "bg-amber/15 text-amber border-amber/30",
    glow: "group-hover:shadow-[0_0_35px_rgba(242,165,59,0.22)]",
    accent: "text-amber group-hover:text-amber-glow",
    bgTint: "from-amber/10 via-amber/5 to-transparent",
  },
  raj: {
    genre: "Golden Cinema & Radio",
    border: "border-film/30 hover:border-film",
    badge: "bg-film/15 text-film border-film/30",
    glow: "group-hover:shadow-[0_0_35px_rgba(216,85,58,0.22)]",
    accent: "text-film group-hover:text-stars",
    bgTint: "from-film/10 via-film/5 to-transparent",
  },
  margaret: {
    genre: "Merseybeat & Mod",
    border: "border-tv/30 hover:border-tv",
    badge: "bg-tv/15 text-tv border-tv/30",
    glow: "group-hover:shadow-[0_0_35px_rgba(79,163,156,0.22)]",
    accent: "text-tv group-hover:text-amber-glow",
    bgTint: "from-tv/10 via-tv/5 to-transparent",
  },
  carmen: {
    genre: "Boleros & Choirs",
    border: "border-books/30 hover:border-books",
    badge: "bg-books/15 text-books border-books/30",
    glow: "group-hover:shadow-[0_0_35px_rgba(169,139,201,0.22)]",
    accent: "text-books group-hover:text-stars",
    bgTint: "from-books/10 via-books/5 to-transparent",
  },
};

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
              <span className="inline-block rounded-full border border-amber/30 bg-amber/10 px-3.5 py-1 text-xs font-semibold tracking-wider uppercase text-amber">
                The Reminiscence Method
              </span>
              <h2 className="display mt-4 text-[clamp(2.2rem,5vw,3.75rem)]">
                From a few names to a{" "}
                <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-amber-glow via-stars to-music">
                  whole world.
                </span>
              </h2>
              <p className="mt-6 max-w-[40ch] text-lg leading-relaxed text-paper-dim">
                Named for Proust&apos;s <em className="font-editorial-italic text-amber-glow font-medium text-[1.2rem]">madeleine</em>:
                the taste of a little cake that brought his whole childhood rushing back.
                Every family remembers a handful of favourites. Madeleine finds the hundred things around them.
              </p>
            </div>
            <ol className="grid gap-x-10 gap-y-12 sm:grid-cols-2">
              {STEPS.map((s) => (
                <li key={s.title} className={`relative border-t ${s.border} pt-6 transition-all hover:-translate-y-0.5`}>
                  <div className="flex items-center justify-between">
                    <span className={`display text-3xl font-bold ${s.accent}`}>{s.num}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase ${s.badge}`}>
                      {s.tag}
                    </span>
                  </div>
                  <h3 className="display-soft mt-3 text-[1.45rem] text-paper">{s.title}</h3>
                  <p className="mt-3 leading-relaxed text-paper-dim">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="relative overflow-hidden border-y border-umber-800 bg-umber-950/70">
          <div className="mx-auto grid w-full max-w-[1240px] gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2">
            <div>
              <span className="inline-block rounded-full border border-tv/30 bg-tv/10 px-3.5 py-1 text-xs font-semibold tracking-wider uppercase text-tv">
                Powered by Qloo
              </span>
              <h2 className="display mt-4 text-[clamp(2rem,4.5vw,3.4rem)]">
                Why a{" "}
                <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-amber to-amber-glow">
                  taste graph
                </span>
                , and not just a chatbot?
              </h2>
              <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-paper-dim">
                Ask a generic language model about someone born in 1942 and it hands everyone the same list:{" "}
                <span className="font-editorial-italic text-smoke">&ldquo;Elvis, Casablanca, I Love Lucy&rdquo;</span>. That&apos;s a{" "}
                <em className="font-editorial-italic text-paper">decade</em>, not a <em className="font-editorial-italic text-amber-glow text-[1.15rem]">person</em>.
                Qloo knows which records, films and faces actually travel together in people&apos;s taste, so a{" "}
                <span className="text-music font-medium">Doris Day</span> fan and a{" "}
                <span className="text-stars font-medium">Charlie Parker</span> fan from the same street get{" "}
                <em className="font-editorial-italic text-transparent bg-clip-text bg-gradient-to-r from-amber via-rose-300 to-amber-glow text-[1.15rem] font-semibold">
                  two completely different worlds.
                </em>
              </p>
              <p className="mt-5 max-w-[46ch] leading-relaxed text-paper-dim">
                Every item Madeleine shows is a real entity from Qloo&apos;s graph. The language model chooses and writes, but
                it cannot invent. Each profile includes a live side-by-side test against the same model without Qloo.
              </p>
            </div>
            <figure className="relative self-center rounded-2xl border border-amber/30 bg-gradient-to-br from-umber-850 via-umber-900 to-umber-950 p-8 shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
              <div className="mb-4 inline-block rounded-full border border-amber/40 bg-amber/15 px-3 py-0.5 text-xs font-semibold tracking-wider uppercase text-amber">
                Clinical Neuroscience
              </div>
              <blockquote className="display-soft text-[1.65rem] leading-snug text-paper">
                &ldquo;Musical memories are often among the last to fade. The brain regions that hold long-known music are{" "}
                <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-amber via-amber-glow to-music">
                  relatively spared
                </span>{" "}
                in Alzheimer&apos;s disease.&rdquo;
              </blockquote>
              <figcaption className="mt-6 border-t border-umber-800 pt-4 text-sm leading-relaxed text-smoke">
                Jacobsen et al.,{" "}
                <cite className="font-editorial-italic text-paper-dim">
                  Why musical memory can be preserved in advanced Alzheimer&apos;s disease
                </cite>
                , <strong className="text-paper">Brain</strong>, 2015. The{" "}
                <span className="font-editorial-italic text-amber">&ldquo;reminiscence bump&rdquo;</span> explains the years Madeleine targets: we
                remember most vividly what happened between about ten and thirty.
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1240px] px-5 py-24 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-block rounded-full border border-stars/30 bg-stars/10 px-3.5 py-1 text-xs font-semibold tracking-wider uppercase text-stars">
                Interactive Showcase
              </span>
              <h2 className="display mt-3 text-[clamp(2rem,4.5vw,3.4rem)]">
                Try it with{" "}
                <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-amber via-stars to-amber-glow">
                  someone we made up.
                </span>
              </h2>
              <p className="mt-3 max-w-[52ch] text-lg text-paper-dim">
                Four fictional people from four cities. Watch the agents work live, then step inside their personalized session.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {DEMO_PEOPLE.map((d) => {
              const style = DEMO_STYLES[d.key] ?? DEMO_STYLES.rose;
              return (
                <Link
                  key={d.key}
                  href={`/new?demo=${d.key}&go=1`}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border ${style.border} bg-umber-850 p-6 transition-all duration-300 hover:-translate-y-1 ${style.glow}`}
                >
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${style.bgTint}`} />
                  <div className="relative">
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-wider uppercase ${style.badge}`}>
                      {style.genre}
                    </span>
                    <p className="display mt-3 text-[2.4rem] text-paper group-hover:text-amber-glow transition-colors">
                      {d.intake.name}
                    </p>
                    <p className="mt-1 text-sm text-smoke">
                      Born {d.intake.birthYear} · {d.intake.hometown.split(",")[0]}
                    </p>
                    <p className="font-editorial-italic mt-4 text-[0.98rem] leading-snug text-paper-dim">
                      &ldquo;{d.teaser}&rdquo;
                    </p>
                  </div>
                  <div className="relative mt-6 pt-4 border-t border-umber-800 flex items-center justify-between">
                    <span className={`text-sm font-semibold transition-colors ${style.accent}`}>
                      Build their world
                    </span>
                    <span className="text-sm transition-transform duration-300 group-hover:translate-x-1 text-smoke group-hover:text-paper">
                      →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1240px] px-5 pb-28 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl border-t-2 border-amber/70 bg-umber-850 p-7 shadow-lg">
              <span className="text-xs font-semibold tracking-wider uppercase text-amber">Purpose-built</span>
              <h3 className="display-soft mt-2 text-2xl text-paper">For families</h3>
              <p className="mt-3 leading-relaxed text-paper-dim">
                Something to do together on a visit that{" "}
                <span className="font-editorial-italic text-paper font-medium">isn&apos;t small talk</span>. Play the songs,
                look at the faces, share a taste of an egg cream.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border-t-2 border-tv/70 bg-umber-850 p-7 shadow-lg">
              <span className="text-xs font-semibold tracking-wider uppercase text-tv">Care Facilities</span>
              <h3 className="display-soft mt-2 text-2xl text-paper">For care homes</h3>
              <p className="mt-3 leading-relaxed text-paper-dim">
                <span className="font-editorial-italic text-paper font-medium">Person-centred activities</span> for every
                resident in minutes, a printable card of their cultural world for staff, and a record of what works.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border-t-2 border-destinations/70 bg-umber-850 p-7 shadow-lg">
              <span className="text-xs font-semibold tracking-wider uppercase text-destinations">Zero Surveillance</span>
              <h3 className="display-soft mt-2 text-2xl text-paper">Private by design</h3>
              <p className="mt-3 leading-relaxed text-paper-dim">
                Profiles are saved in your browser, not on our servers.{" "}
                <span className="font-editorial-italic text-paper font-medium">No accounts, no tracking.</span> Delete a
                profile and it is gone.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-umber-800">
        <div className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-center gap-4 px-5 py-10 text-center text-sm text-smoke sm:px-8">
          <p>Not medical advice. Madeleine supports carers; it does not treat dementia.</p>
        </div>
      </footer>
    </>
  );
}
