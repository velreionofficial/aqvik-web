# AQVIK — Website

Marketing and legal site for **AQVIK Personal OS**. Next.js 15 (App Router), TypeScript,
Tailwind CSS, shadcn-style primitives, Framer Motion. Dark theme only.

## Run

```bash
pnpm install      # or npm install
pnpm dev          # http://localhost:3000
pnpm build && pnpm start
pnpm lint
pnpm typecheck
```

Set `NEXT_PUBLIC_SITE_URL` (see `.env.example`) before deploying — canonical URLs,
`sitemap.xml`, `robots.txt` and OpenGraph tags are all derived from it.

## Structure

```
public/
  brand/          official AQVIK app icon (192 / 512) used by the manifest and OG card
  screens/        real app screenshots shown in the product section
src/
  app/            routes, metadata, robots.ts, sitemap.ts, manifest.ts, OG image, icon.png, apple-icon.png
  components/
    brand/        logo mark and wordmark
    layout/       container, rail Section shell, header, footer, legal renderer
    motion/       the single Reveal primitive
    sections/     homepage bands
    shared/       ProductScreenshot (real app captures)
    ui/           button, badge, accordion
  content/        all copy — site config, homepage, legal documents
  lib/            cn(), date formatting, metadata builder
```

**Copy lives in `src/content`, never in components.** Editing the roadmap, FAQ or a legal
clause is a data change, not a JSX change.

Legal pages (`/privacy`, `/terms`, `/delete-account`) are all rendered by one component from
a `LegalDocument`. Blocks available: `paragraph`, `note`, `list`, `steps`, `callout`, `link`,
`table`. Inline `**bold**` is supported in block text. Retention periods quoted in more than
one document come from `siteConfig.retention` so the documents cannot contradict each other.

## Branding

One component renders the logo everywhere: `components/brand/logo.tsx`. It uses the official
AQVIK app icon (`public/brand/aqvik-logo.png`), the same artwork as the Play Store listing.
Favicon, Apple touch icon, manifest icons and the OpenGraph card all derive from that asset.
The only contact address is `support@aqvik.com`, held in `content/site.ts`.

## Design system

One structural idea carries the site: a **ledger rail** — a continuous hairline running down
the left gutter of every band, with section labels docked to it. It is produced by the
`lg:border-r` on each `Section` gutter, so it stays unbroken without absolute positioning.

Tokens live in `tailwind.config.ts`. Blue (`#4F7CFF`) is reserved for interactive
affordances, the rail node and one hero accent — never for decoration.

## Product screenshots

Real captures from the AQVIK Personal OS build live in `public/screens/` and are listed in
`content/home.ts` as `productScreens`. `ProductScreenshot` renders them through `next/image`
inside the site's device treatment.

All six assets share one aspect ratio (800 × 1346), so each fills its frame exactly — nothing
is stretched, letterboxed or side-cropped. To add or replace one: export the screen, crop to
the app UI only (no device bezel, no marketing text), resize to 800 × 1346, save as WebP at
quality 88, and add an entry to `productScreens`. The first entry is eager-loaded; the rest
lazy-load.

## Beta access

The Android build is in Google Play **closed testing**. Distribution config — package id,
Play Store URL, WhatsApp number — lives in `siteConfig.android` and `siteConfig.whatsapp`.

`BetaTesterDialog` collects tester details and opens a `wa.me` deep link with the message
pre-filled. **Nothing is posted to a server**: the visitor's own WhatsApp client sends it, and
they see the message first. A true server-side send would need the WhatsApp Business Platform
(Meta-approved sender plus a pre-approved template) — see the note in the deploy checklist.

`WhatsAppFloat` renders once in the root layout, so it appears on every route.

## Content rules

No invented testimonials, user counts, ratings, download numbers, investors, awards or
company history. Anything not yet true is stated as not yet true.
