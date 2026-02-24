# WDS Viewer

Modern web viewer for BMW WDS (Wiring Diagram System) data. Replaces the legacy Java applet-based system with a fast, responsive SvelteKit application.

## Features

- 📁 **Tree Navigation** — hierarchical browsing of diagrams and info pages
- 🔍 **Search** — find diagrams and info pages by name
- 🖼️ **SVG Diagrams** — pan, zoom, and interact with wiring diagrams
- 📝 **Info Pages** — rendered markdown with images
- 🔗 **Diagram Links** — click links in diagrams to navigate or search
- 🌙 **Dark Mode** — system-aware theme switching
- 📱 **Resizable Panels** — adjustable tree/viewer split
- 💾 **PWA Ready** — installable, works offline (with cached data)

## Project Structure

```
wdsx/
├── packages/
│   ├── core/          # Shared TypeScript types
│   ├── importer/      # Data import tool (WDS → JSON/SVG/MD)
│   └── viewer/        # SvelteKit web application
└── docs/              # Documentation
```

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 9+

### Install

```bash
pnpm install
```

### Import WDS Data

First, import your WDS source data:

```bash
pnpm --filter @emdzej/wds-importer import --source /path/to/wds --output packages/viewer/static/data
```

This creates:
- `models.json` — vehicle model metadata
- `diagrams/` — SVG/SVGZ files + index.json
- `info/` — Markdown files + index.json  
- `trees/` — navigation tree per model
- `zi_images/` — info page images

### Development

```bash
pnpm dev
```

Opens viewer at http://localhost:5173

### Build

```bash
pnpm build
```

Static output: `packages/viewer/build/`

## Data Directory

The viewer expects data in `static/data/`. Structure:

```
static/data/
├── models.json
├── diagrams/
│   ├── index.json
│   └── *.svgz
├── info/
│   ├── index.json
│   └── *.md
├── trees/
│   └── <model-id>.json
└── zi_images/
    └── *.png
```

**Note:** WDS data is not included. You must provide your own BMW WDS source files.

## Tech Stack

- **Framework:** SvelteKit 2 + Svelte 5
- **Styling:** Tailwind CSS
- **Build:** Vite + Turborepo
- **SVG Interaction:** panzoom
- **Markdown:** marked

## License

MIT. Original BMW WDS data is property of BMW AG.
