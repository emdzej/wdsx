# WDS Viewer

Modern SvelteKit-based web viewer for the BMW WDS (Wiring Diagram System) data. It provides searchable diagrams and info pages with a responsive, dark-mode friendly UI.

## Requirements

- Node.js 22+
- npm

## Setup

From the repository root:

```sh
cd apps/viewer
npm install
```

## Development

```sh
npm run dev
```

## Build

```sh
npm run build
```

The static output is generated in `apps/viewer/build`.

## Preview

```sh
npm run preview
```

## Deployment (GitHub Pages)

A GitHub Actions workflow is included at `.github/workflows/deploy.yml`. It builds the viewer and publishes the `apps/viewer/build` output to the `gh-pages` branch.

If you deploy under a repository subpath, set `BASE_PATH` (e.g. `/wds`) so SvelteKit generates correct asset paths.
