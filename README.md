# wharf-site

The public documentation site for [Wharf](https://github.com/forgelab-me/wharf-server), built with [VitePress](https://vitepress.dev) and deployed to GitHub Pages on every push to `main`.

## Working on it locally

No local Node install needed — everything runs through Docker:

```bash
docker run --rm -it -v "$(pwd):/site" -w /site -p 5173:5173 node:24.21.0-alpine3.24 sh -c "npm install && npm run dev -- --host"
```

Then open `http://localhost:5173`.

If you do have Node 24+ installed locally, the usual commands work directly:

```bash
npm install
npm run dev       # local dev server with hot reload
npm run build     # static build to docs/.vitepress/dist
npm run preview   # serve the production build locally
```

## Structure

```
docs/
├── .vitepress/
│   └── config.mts   nav, sidebar, search, site metadata
├── public/            static assets (favicon, images) served as-is
├── index.md           home page (hero + feature grid)
└── guide/             one page per topic, listed in the sidebar
```

Pages marked `<!-- TODO: screenshot -->` are waiting on real screenshots from a running instance — add them under `docs/public/` and reference with `![alt](/screenshot.png)`.

## Deployment

`.github/workflows/deploy.yml` builds and publishes automatically on push to `main`. First-time setup: in the repository's Settings → Pages, set the source to **GitHub Actions**.
