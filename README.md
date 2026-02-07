# WDS - BMW Wiring Diagram System

Modern web application port of the legacy BMW WDS (Wiring Diagram System) Java applet.

## About

WDS is BMW's classic wiring diagram system that originally ran as Java applets in old browsers. This project aims to create a modern, web-based version that preserves all the functionality while providing a better user experience.

## Project Status

🚧 **In Planning Phase** - Data analysis and architecture design in progress.

## Source Data

- **Format**: Legacy Java applet data structure
- **Content**:
  - ~24,000 SVGZ wiring diagrams
  - ~20,000 HTML information pages
  - 14 XML tree structure files
  - Vehicle models: E38, E39, E46, E52, E53, E60, E61, E63, E64, E65, E66, E70, E71, E83, E85, E87, E89, E90, F01
  - Languages: US (English), DE (German), and others

## Tech Stack

- **Language**: TypeScript
- **Monorepo**: pnpm + Turborepo
- **Importer**: Node.js-based data transformation pipeline
- **Viewer**: SvelteKit (planned)
- **Target Format**: JSON + optimized SVG + Markdown

## Repository Structure

```
wds/
├── apps/
│   └── viewer/           # SvelteKit viewer application
├── packages/
│   ├── core/             # Shared types and utilities
│   └── importer/         # Data import tool (TypeScript)
├── tools/                # Scripts and utilities
├── data/                 # Processed data (gitignored, generated)
└── docs/                 # Documentation and analysis
```

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm typecheck
```

### Importer Commands

```bash
pnpm import
pnpm import:dry
pnpm validate
pnpm stats
```

## Viewer (SvelteKit)

The viewer is a static app shell. **BMW WDS data is not included** and must be provided at runtime.

### Run locally

```bash
pnpm --filter viewer dev
```

Data is loaded from `/data` by default. To test locally, either:

- Serve your generated data at `/data`, or
- Copy/symlink it into `packages/viewer/static/data`.

You can also override the data base path:

```bash
VITE_WDS_DATA_BASE="/my-data" pnpm --filter viewer dev
```

### Build (static)

```bash
pnpm --filter viewer build
```

Static output: `packages/viewer/build`.

### GitHub Pages

The workflow publishes the viewer to GitHub Pages with `BASE_PATH=/wds`.
Make sure your data is available at `${BASE_PATH}/data` when deploying.

## License

This is a personal project for educational and archival purposes. Original BMW data remains property of BMW AG.
