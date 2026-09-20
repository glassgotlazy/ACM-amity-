# ACM BuildHub

The technical community platform for **ACM @ Amity University**.

> Real problems. Real projects. Real technical experience.

BuildHub is not a club page. It connects four things —
**problems → projects → people → contributions** — so that a student can find a
campus problem worth solving, turn it into a project, join a team around it, and
leave with a record of what they actually built.

---

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build
npm start          # serve the production build
npm run typecheck  # tsc --noEmit
```

Node 20+ is required. The site runs with no configuration at all; see
**Collecting submissions** below for the one optional variable.

### Collecting submissions

The four forms — Join ACM, project applications, problem submissions and
project proposals — all post to `/api/submit`, which forwards to whatever is in
`FORM_ENDPOINT`.

```bash
cp .env.example .env
# FORM_ENDPOINT=https://formspree.io/f/xxxxxxxx
```

On Vercel, add `FORM_ENDPOINT` under **Settings → Environment Variables** and
redeploy. Any endpoint accepting a JSON `POST` works — Formspree, Tally, a
Zapier or Make catch-hook, or your own service.

It is a **server-only** variable, so a destination URL containing a key never
reaches the browser. Do not add a `NEXT_PUBLIC_` prefix.

Each submission arrives as JSON with a `_subject` line, the `kind`, an ISO
`receivedAt`, and the form's fields:

```json
{
  "_subject": "ACM BuildHub — Project role application",
  "kind": "project-application",
  "receivedAt": "2026-01-14T09:22:10.113Z",
  "name": "…", "email": "…", "course": "…", "role": "Backend",
  "project": "AI Admissions Assistant"
}
```

**Leaving `FORM_ENDPOINT` unset is a supported state, not a broken one.** The
forms still validate, animate and confirm, but nothing is transmitted and every
confirmation screen says so. The notice is driven by what actually happened, so
the site cannot tell a student their application was received when it was not —
and a delivery that fails shows an error and keeps their answers, rather than a
confirmation for something that never arrived.

Submissions are filtered by a honeypot field that is off-screen and skipped in
the tab order; a request that fills it gets a normal-looking success and is
discarded. Payloads are size-capped per field and in total before forwarding.

An anonymous problem submission has its identity fields cleared **before** the
request leaves the browser, so "anonymous" means nothing identifying is sent —
not merely that it is hidden in the interface.

> Rate limiting is deliberately not implemented here. A per-instance counter is
> close to meaningless on serverless, where requests spread across instances.
> If submissions are abused, add rate limiting at the edge (Vercel WAF, or
> Upstash-backed middleware) rather than in the route.

---

## Routes

| Route | What it is |
| --- | --- |
| `/` | Homepage — hero, featured projects, Problem Lab, problem of the week, difficulty system, project ideas, contribution model |
| `/projects` · `/projects/[slug]` | Project index and detail, with an application flow per role |
| `/problems` · `/problems/[slug]` | The Problem Lab, and a full statement page per problem |
| `/problems/submit` | Student problem submission |
| `/ideas` | Unclaimed starting points, filtered by level and domain |
| `/research` · `/research/[slug]` | Research hub and the record for each research project |
| `/teams` | The six teams, as editorial spreads rather than identical cards |
| `/activity` | Community activity log |
| `/profile` | A contribution record (demo) |
| `/discover` | Two questions, then a ranked shortlist |
| `/join` | Seven-step membership application |
| `/admin` | Back-office view over every managed entity |
| `/api/submit` | Server route that receives every form and forwards it |

---

## Architecture

```
src/
  app/          routes; pages compose components and hold no layout logic of their own
  components/
    ui/         primitives — Button, Section, Reveal, MaskedHeadline, Modal, FilterBar, Badges
    site/       chrome — Navbar, Footer, Cursor, ScrollProgress, PageTransition
    forms/      Field primitives, ApplyForm, ProblemForm, JoinFlow
    home/ problems/ projects/ research/ activity/ profile/ discover/ ideas/ admin/
  data/         all content, typed — the single source of truth
                (chapter.ts holds the real, confirmed details: office
                bearers and the registration link)
  lib/          motion vocabulary and small helpers
```

**Data is fully separated from presentation.** Every page reads from `src/data/`,
so replacing demo content with a backend is a change to one directory rather
than a rewrite. `src/data/taxonomy.ts` holds the shared vocabulary — domains,
difficulty levels, statuses, roles, problem provenance — and every badge, filter
and label on the site derives from it, so the taxonomy cannot drift between
pages.

### Design system

Every colour resolves through CSS custom properties in `src/app/globals.css`,
stored as bare RGB channels so Tailwind's opacity modifiers still work
(`bg-surface/30` → `rgb(var(--surface) / 0.3)`). That is what lets one set of
utility classes serve both themes — no `dark:` variants anywhere.

- **Accent** a single ACM-inspired red, reserved for actions, active states and
  status. The site is designed to hold up when the accent is barely used.
- **Type** Inter for text, JetBrains Mono for the uppercase metadata labels that
  carry the editorial numbering (`01 / PROBLEM LAB`)
- **Structure** hairline rules and shared borders instead of card shadows;
  radii of 2–4px; no gradients

### Themes

Dark is the default and lives on `:root`, so the site renders correctly even if
the theme script never runs. Light is a designed counterpart, not an inversion:
the page sits on a warm off-white so panels can be pure white and still read as
raised, and the accent *deepens* rather than brightens, because on a light field
prominence comes from going darker.

A first visit follows the system preference; an explicit choice is stored under
`acm-theme` and wins from then on. To make the site always open dark regardless
of system setting, drop the `matchMedia` branch from `THEME_SCRIPT` in
`src/app/layout.tsx`.

The script is inline and synchronous in `<head>` — deferring it would paint the
wrong theme first. The toggle's glyph is chosen by CSS off `:root[data-theme]`
rather than by React state, so its markup is identical on server and client and
there is no hydration mismatch or icon flash.

Three tokens exist for reasons that are not obvious:

- **`--acm-solid`** backs filled buttons. The display red at 11px does not give
  white text 4.5:1, so buttons use a fractionally darker red. Button hover
  *darkens* (`--acm-deep`) rather than brightening, which stays visible in both
  themes and raises the label's contrast instead of lowering it.
- **`--scrim`** is the modal veil, so light mode gets a softer one.
- **`--grid-line`** drives the engineering grid, which is white-on-dark and
  black-on-light.

Both themes are verified at **zero WCAG AA failures** across all 15 routes by
`contrast.mjs`, which walks every text node, resolves its real background
through ancestors and checks the ratio against the AA threshold for its size.
The muted scale is tiered deliberately — roughly 4.6:1 / 5.6:1 / 7.1:1 for
`ink-ghost` / `ink-faint` / `ink-muted` — so metadata stays quiet while still
clearing the floor. If you restyle, re-run that check rather than trusting the
palette.

### Motion

`src/lib/motion.ts` holds one vocabulary — easing, distances, durations,
viewport thresholds — and every animation on the site draws from it. Scroll
reveals go through `Reveal`; headline wipes go through `MaskedHeadline`.

`prefers-reduced-motion` is honoured in three places: the CSS reset neutralises
transitions and animations, `useReducedMotion` gates every Framer Motion
component, and each such component has a static branch rather than a
zero-duration one. The site is fully legible with motion disabled.

> **A note on `MaskedHeadline`.** A headline line that starts at `y: 110%` is
> translated clear of its `overflow-hidden` parent, and IntersectionObserver
> clips against ancestor overflow — so an observer placed on the line itself
> measures zero visible area and never fires, leaving the text permanently
> invisible. The observer therefore sits on the wrapper and drives the lines as
> variant children. Any new masked reveal should use this component rather than
> reimplementing the pattern.

---

## Content accuracy

This is deliberate and enforced through the type system, not left to the author
of each page:

- **Problem statements are student-written explorations.** Every one carries a
  provenance label (`OriginId` in `src/data/taxonomy.ts`) and none is presented
  as an official, confirmed or university-endorsed brief, because none is.
- **Projects declare what does not exist.** `Project.currentState` has a
  required `notYet` array, so a project page cannot describe what it is building
  without also stating what is not built.
- **Research claims nothing.** No published paper, no submission under review,
  no result. Sections without content say `COMING SOON` rather than being
  hidden, and every research page carries an accuracy note.
- **Demo data says so.** Profile figures, activity entries, contributor counts
  and the entire admin console are placeholder content and are labelled as such
  on the page.
- **No invented specifics.** No member counts, awards, funding, partnerships,
  publication status, placement statistics or outcome guarantees.
- **Confirmed details live in `src/data/chapter.ts`** — the office bearers and
  the registration link — and carry no placeholder labelling, because they are
  real. Everything demo stays labelled as demo.

Forms report their real delivery state. With no `FORM_ENDPOINT` configured they
transmit nothing and say so; with one configured they confirm receipt; and if
delivery fails they show an error rather than implying an application was filed.
See **Collecting submissions**.

## Accessibility

Semantic landmarks and a continuous heading order on every route, a skip link as
the first tab stop, visible focus rings, labelled controls, `aria-pressed` on
filters, a focus-trapped dialog that restores focus on close, and full
reduced-motion support.

## Replacing the demo data

Each file in `src/data/` exports a typed array and its accessors. Point those
accessors at a real source and the pages follow unchanged. The natural order is
problems and projects first (the content surfaces), then the contribution
profile (which needs authentication and repository activity). Applications and
submissions are already wired — point `FORM_ENDPOINT` at a destination, or
replace the forwarding call in `src/app/api/submit/route.ts` with a database
write and let `/admin` read from the same store.
