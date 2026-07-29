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
src/
  app/            routes, metadata, robots.ts, sitemap.ts, manifest.ts, OG image, icon.png, apple-icon.png
  components/
    brand/        logo mark and wordmark
    layout/       container, rail Section shell, header, footer, legal renderer
    motion/       the single Reveal primitive
    sections/     homepage bands
    shared/       ScreenshotFrame (reserved product image slots)
    ui/           button, badge, accordion
  content/        all copy — site config, homepage, legal documents
  lib/            cn(), date formatting, metadata builder
```

**Copy lives in `src/content`, never in components.** Editing the roadmap, FAQ or a legal
clause is a data change, not a JSX change.

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

`ScreenshotFrame` renders a labelled, correctly proportioned slot and no invented UI. When
real captures exist, pass them as children:

```tsx
<ScreenshotFrame label="Dashboard" caption="Dashboard" ratio="phone">
  <Image src="/screens/dashboard.png" alt="AQVIK dashboard" fill sizes="(max-width: 640px) 100vw, 33vw" />
</ScreenshotFrame>
```

The layout does not change.

## Content rules

No invented testimonials, user counts, ratings, download numbers, investors, awards or
company history. Anything not yet true is stated as not yet true.
