# Devpost submission — Madeleine

## Tagline
When memories fade, the songs stay. An agent that rebuilds the cultural world of someone living with dementia, matched to their own taste with Qloo.

## Inspiration
57 million people live with dementia (WHO). One of the most humane things we can do on a visit is bring back the music, films and faces of their youth — musical memories are often among the last to fade. But reminiscence only works when it is *theirs*. Families remember a handful of favourites; care staff have even less. And a chatbot hands every person born in 1942 the same Elvis-and-Casablanca list. That's a decade, not a person.

## What it does
Madeleine turns a few lines from a family member ("Rose, born 1942, Brooklyn — loved Ella Fitzgerald, Roman Holiday, egg creams") into:
- **Their world** — music, films, TV, film stars, books, everyday brands, places they knew, and outings near them today, filtered to the years between ages 10 and 30 and to their own taste.
- **A 20-minute guided session** — a welcoming song with a real preview on a spinning record, a star's face, a moment from their life story, a taste or scent, a calm closing song. Prompts invite; they never quiz memory. Read aloud on request, in the person's language.
- **A learning loop** — the carer taps how they reacted. A Reflector agent turns what made them light up into new Qloo signals, rests what fell flat, excludes what upset them, and plans the next session.
- A printable care card for staff, a taste fingerprint, a life timeline, and a live **"Compare with plain AI"** test.

## How it's Qloo-powered
Qloo is the engine, not decoration. A Groq-hosted Curator agent drives Qloo through tools in a multi-step loop:
- `/search` to resolve the family's names to entities,
- `/v2/insights` with `filter.type=urn:tag` for a taste fingerprint,
- `/v2/insights` across 8 entity types with `signal.interests.entities`, `signal.demographics.age`, era filters (`filter.release_year`, `filter.publication_year`, `filter.date_of_birth`) and `filter.location.query` for outings,
- `filter.results.entities` to rank era names the LLM knows by this person's taste affinity ("LLM knows history, Qloo knows taste"),
- `filter.exclude.entities` + boosted seeds in the adaptation loop.

Every item shown is a real Qloo entity — the LLM can't invent one. The compare page gives the same model the same facts without Qloo, then scores both lists against the person's taste in one Qloo call per domain, on the same scale.

## How we built it
Next.js 16 + TypeScript, Vercel AI SDK tool loop on Groq (gpt-oss-120b, Kimi K2 fallback), streamed NDJSON "agent theater", React Three Fiber hero, motion, Tailwind v4. Designed for two tempos: a rich Studio for families and a slow, large-type Session mode for the person. Fonts: Fraunces for warmth, Atkinson Hyperlegible (designed for low-vision readers) for everything you need to read. Profiles stay in the browser.

## Challenges
Era correctness (artists have no release-year filter, so the agent combines Qloo affinity with historical names it ranks through Qloo), keeping the agent fast enough to watch live, and writing prompts that follow dementia-care communication practice.

## Accomplishments
A demo that makes people go quiet. Four people from four cultures (including a Spanish-language session) built live, end to end.

## What's next
Care-home pilots (US nursing homes must offer activities matched to each resident's interests), shared family profiles, photo uploads, and outcome tracking for activity coordinators.

## Built with
qloo, groq, vercel-ai-sdk, nextjs, typescript, react-three-fiber, three.js, tailwindcss, motion, vercel

---

# 2-minute demo video script

1. **0:00 – Hero.** "When memories fade, the songs stay." One sentence on the problem.
2. **0:15 – Plain AI problem.** "Ask a chatbot about someone born in 1942: everyone gets Elvis."
3. **0:25 – Build Rose live.** Click "Watch it build Rose's world". Narrate the agent theater: the Curator resolving Ella Fitzgerald, reading her taste fingerprint, discovering 8 domains in parallel, ranking era names by affinity. Point at the Qloo-call counter.
4. **0:55 – Studio.** Carousel, taste grooves, play a vinyl preview, polaroid stars, outings near Boca Raton, timeline.
5. **1:15 – Session.** Spinning record, a prompt read aloud, tap "Lit up" on Sinatra, "Upset" on one item, finish.
6. **1:35 – Learning loop.** "Plan session 2" — the Reflector boosts Sinatra, excludes the upsetting item; show "What Madeleine learned".
7. **1:50 – Compare.** Plain AI vs Madeleine taste-match scores. Close: "Every life has a soundtrack. Madeleine helps you play it back."

# Checklist
- [ ] Live URL works end to end (build a demo person)
- [ ] Public GitHub repo, MIT license shows in About
- [ ] Devpost: text above, demo URL, repo URL, video (optional but recommended)
- [ ] Save a Devpost draft early — edits lock at 11:45 PM EDT (9:15 AM IST)
