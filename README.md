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

### Storing submissions (the admin queue)

With `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set, every submission is
also **stored**, and `/admin` shows a live queue per kind — membership
applications, project applications, problem submissions, project proposals —
with state (new → reviewing → accepted / declined / published) and a note.

```bash
# 1. Create a Supabase project. Settings → API: copy Project URL and the
#    service_role key (NOT the anon key).
# 2. SQL editor: run supabase/schema.sql once.
# 3. Vercel → Environment Variables (Production): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
# 4. Set ADMIN_PASSWORD too, or /admin stays locked. Redeploy.
```

Storage is spoken to over PostgREST with plain `fetch` — no SDK, no new
dependency. The table has RLS enabled and **no policies**: the site uses the
service-role key, which bypasses RLS; the public anon key can read nothing.
Both variables are server-only.

`FORM_ENDPOINT` and storage are independent sinks. A submission counts as
delivered if at least one configured sink accepted it, so a stored
application is safe even if the inbox copy bounced. Keep both, or drop
`FORM_ENDPOINT` once the queue is in use.

`/api/admin/*` routes check the same signed cookie as the `/admin` pages;
middleware alone would leave the queue readable by URL.

### Editing the website (CMS)

The admin console (`/admin`) edits the site itself: Site Settings (name, logo,
favicon, contact, registration link and QR, footer), Navigation (one list feeds
the header, mobile menu and footer columns, plus social links), Homepage
(show, hide, reorder and edit every section), Team and Roles, Events,
Projects, Announcements and a Media library. Saving revalidates the affected
pages, so a change is live on the next request — no redeploy.

```bash
# One-time setup, after the submissions queue above works:
# 1. Supabase SQL editor: run supabase/cms.sql once (additive; never touches submissions).
# 2. /admin → Dashboard → "Load current website content".
# 3. Supabase SQL editor: run supabase/admin.sql once (audit log, edit tracking,
#    and tables for problems, ideas, research, working teams, activity).
# 4. /admin → Dashboard → "Load remaining content".
```

After step 4 every piece of public content is edited in the admin: site
settings, navigation, homepage sections, every page header (Pages), team and
roles, working teams, projects, problem statements, project ideas, research,
events, announcements, the activity log and media. Only the shared
vocabulary in `src/data/taxonomy.ts` (domains, difficulty levels, statuses,
skill roles) and the demo contribution profile stay in code.

Until step 2 the public site renders its built-in defaults
(`src/lib/cms/defaults/`), so deploying this code changes nothing for
visitors. Step 2 copies those defaults into the tables once; from then on the
database is the only source and an empty table means "show nothing", never
"fall back".

- **Structured tables**, one per entity (`site_settings`, `nav_items`,
  `social_links`, `page_sections`, `roles`, `team_members`, `events`,
  `projects`, `project_members`, `announcements`). The only JSON columns are
  small fixed-shape lists (project timeline and open roles, a section's hero
  focus areas), validated by the server.
- **Roles are rows.** Renaming one renames it everywhere. A role that members
  still hold cannot be deleted until they are moved to another role
  (`ON DELETE RESTRICT`, and the admin asks for the replacement).
- **Links are validated.** Internal links must resolve to an existing page
  (`src/lib/cms/routes.ts`); anything else must be a full `https://` address.
- **Images** go to the public `cms-media` Storage bucket through
  `/api/admin/media`, which checks the real file type, size and pixel
  dimensions from the bytes. SVG uploads are not accepted.
- **Reads are server-side and cached** (`src/lib/cms/read.ts`, tagged
  `unstable_cache`), so pages stay static and visitors never wait on the
  database. An hourly revalidate is only a backstop for edits made directly
  in Supabase.
- **Submissions stay separate.** A project proposal in the queue does not
  become a project; publishing one means creating it under Projects.

Each long-form collection switches over on its own: until "Load remaining
content" has copied it into its table, the site keeps serving the built-in
copy, so running `admin.sql` never empties a page.

### The submissions queue

`/admin/submissions` reads the existing `submissions` table directly —
there is no second store. Search (name, email, project), filters (type,
status, category, date range), sorting and paging all run in Postgres, 25
rows at a time. Opening a row fetches it fresh and shows every stored field,
grouped; anything the grouping does not know about appears under "Other
details". Status changes and notes are saved through the admin API and the
table only updates once the database confirms. CSV export respects the
current filters (formula-like cells are neutralised for Excel/Sheets), and a
project proposal can be turned into an unpublished draft project.

**Concurrent edits.** Every edit carries the version (`updated_at`) the
admin loaded. If someone else saved in between, the write is refused with
the current record and the admin chooses: load their version, or overwrite
deliberately. This covers submissions, projects and every other CMS item,
site settings, homepage sections and page headers.

### Admin security

- **Authentication.** One shared password (`ADMIN_PASSWORD`). Sign-in issues
  an HttpOnly, SameSite=Lax cookie holding `expiry.actor.signature`
  (HMAC-SHA256, 12 hours). The typed name only labels the audit log. Changing
  the password signs everyone out.
- **Authorisation on the server, per route.** Middleware guards `/admin`
  pages; every `/api/admin/*` route independently verifies the signed
  session and the permission it needs (`src/lib/admin-guard.ts`,
  `src/lib/admin-permissions.ts`). Nothing sent by the browser — hidden
  buttons, local storage, URL parameters — is trusted. There is one role
  today; adding editor-style roles means adding them to the permission map,
  not changing routes.
- **Cross-site requests.** Writes whose `Origin`/`Sec-Fetch-Site` is another
  site are refused, on top of the SameSite cookie.
- **Sign-in rate limit.** Eight failed attempts from one address in 15
  minutes pause sign-in from that address (counted in the audit log, so it
  works across serverless instances; IPs are stored only as salted hashes).
- **Audit log.** Sign-ins (and failures), sign-outs, status changes and every
  create/update/delete/upload/export are recorded with who, what and when —
  never passwords, tokens or form contents. See `/admin/audit`.
- **Database.** Every table has RLS enabled, no policies, and all grants
  revoked from `anon`/`authenticated`: the public Supabase key can read and
  write nothing. The site uses the service-role key on the server only; it is
  never in a `NEXT_PUBLIC_` variable, a bundle, a response or a log line.
  `admin.sql` ends with a query that lists every table's RLS state.
- **Storage.** The `cms-media` bucket is public-read (images on the site) with
  no write policies; uploads and deletes go only through the admin API,
  which checks the file's real type, size and pixel dimensions and names the
  file itself. SVG is not accepted.
- **Headers.** `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy` and `Permissions-Policy` on every response; admin pages
  and APIs are `no-store` and `noindex`.

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
| `/` | Homepage — sections, their order and their text come from the CMS |
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
| `/events` | Upcoming and past events (CMS) |
| `/admin` | Admin console: dashboard, submissions queue and every CMS section |
| `/api/submit` | Receives every form; stores to Supabase and/or forwards to `FORM_ENDPOINT` |
| `/api/admin/session` | Admin sign-in / sign-out (shared password, signed cookie) |
| `/api/admin/submissions` | Queue list and per-row state/note updates; cookie-checked |
| `/api/admin/cms/*` | CMS reads and writes, validated server-side; cookie-checked |
| `/api/admin/submissions/*` | Queue search, detail, status/note, delete, CSV export, proposal → draft project |
| `/api/admin/stats` · `/api/admin/audit` | Dashboard counts and the audit log |
| `/api/admin/media` | Media library upload, list and delete; cookie-checked |

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
  data/         the shared taxonomy and the demo contribution profile
  lib/cms/      CMS types, read layer, validation, writes, media, and the
                built-in defaults served until content is loaded
  lib/          motion vocabulary and small helpers
```

**Data is fully separated from presentation.** Pages read content through
`src/lib/cms/read.ts`. `src/data/taxonomy.ts` holds the shared vocabulary — domains,
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
- **Demo data says so.** Profile figures and contributor counts are placeholder
  content and are labelled as such on the page.
- **No invented specifics.** No member counts, awards, funding, partnerships,
  publication status, placement statistics or outcome guarantees.
- **Confirmed details are CMS content** — the office bearers and the
  registration link are edited under Team and Site Settings, and carry no
  placeholder labelling, because they are real. Everything demo stays
  labelled as demo.

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

All public content is in the CMS. Adding a new kind of content follows the
same pattern: a table (in a new additive `.sql` file), a cached getter in
`src/lib/cms/read.ts`, a validator in `src/lib/cms/validate.ts`, a resource
entry in `src/lib/cms/write.ts`, and a `Collection` screen in the admin. The
contribution profile needs authentication and repository activity first.
