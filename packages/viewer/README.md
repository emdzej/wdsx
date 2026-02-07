# WDS Viewer

SvelteKit front-end for browsing BMW WDS data. The app shell is static — **you must provide the WDS data separately**.

## Requirements

- Node.js 22
- pnpm

## Development

From the repo root:

```bash
pnpm install
pnpm --filter viewer dev
```

The viewer expects JSON data under `/data`. You can:

- Mount/serve data at `http://localhost:5173/data/...` (proxy or static server), or
- Copy/symlink generated data into `packages/viewer/static/data` for local testing.

If your data lives elsewhere, set:

```bash
VITE_WDS_DATA_BASE="/path-or-url"
```

## Production build

```bash
pnpm --filter viewer build
```

Static output is emitted to `packages/viewer/build`.

## GitHub Pages

The workflow uses `BASE_PATH=/wds` and publishes the static build to GitHub Pages.
Make sure your data is served from `${BASE_PATH}/data` when deploying.
