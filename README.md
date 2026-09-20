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

Node 20+ is required. There are no environment variables and no services to
configure — every surface currently renders from local data.

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
  lib/          motion vocabulary and small helpers
```

**Data is fully separated from presentation.** Every page reads from `src/data/`,
so replacing demo content with a backend is a change to one directory rather
than a rewrite. `src/data/taxonomy.ts` holds the shared vocabulary — domains,
difficulty levels, statuses, roles, problem provenance — and every badge, filter
and label on the site derives from it, so the taxonomy cannot drift between
pages.

### Design system

Defined once in `tailwind.config.ts` and `src/app/globals.css`:

- **Surface** `#08090B` void, `#101216` / `#15171C` raised
- **Accent** a single ACM-inspired red, reserved for actions, active states and
  status. The site is designed to hold up when the accent is barely used.
- **Type** Inter for text, JetBrains Mono for the uppercase metadata labels that
  carry the editorial numbering (`01 / PROBLEM LAB`)
- **Structure** hairline rules and shared borders instead of card shadows;
  radii of 2–4px; no gradients

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
  publication status, placement statistics or outcome guarantees. Social and
  registration links are left as visible placeholders for a human to fill in.

Forms validate and confirm, but transmit nothing — there is no backend yet, and
each confirmation screen says so instead of implying an application was filed.

## Accessibility

Semantic landmarks and a continuous heading order on every route, a skip link as
the first tab stop, visible focus rings, labelled controls, `aria-pressed` on
filters, a focus-trapped dialog that restores focus on close, and full
reduced-motion support.

## Replacing the demo data

Each file in `src/data/` exports a typed array and its accessors. Point those
accessors at a real source and the pages follow unchanged. The natural order is
problems and projects first (the content surfaces), then applications and
submissions (which need an endpoint and a review queue), then the contribution
profile (which needs authentication and repository activity).
