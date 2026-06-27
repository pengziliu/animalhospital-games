# Survive Zombie Arena Wiki

Fan-made community wiki for Survive Zombie Arena.

## Tech Stack

- **Framework**: Next.js (static export) + next-intl (i18n)
- **Styling**: Tailwind CSS + shadcn/ui
- **Content**: MDX files in `content/<locale>/<category>/`
- **Deploy**: GitHub Actions → Cloudflare Pages

## Development

```bash
nvm use 22
npm install --legacy-peer-deps
npm run dev
```

## Build

```bash
npm run build  # prebuild → STATIC_EXPORT=1 next build → postbuild
```

## Deploy

Automatic via GitHub Actions on push to `main`.

- **Domain**: https://survivezombiearena.games
- **Cloudflare Pages**: survivezombiearena-games
- **Not affiliated with TBD**
