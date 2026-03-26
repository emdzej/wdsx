# WDS Viewer

Modern web viewer for BMW WDS (Wiring Diagram System) data. Replaces the legacy Java applet-based system with a fast, responsive SvelteKit application.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-22%2B-green.svg)
![Svelte](https://img.shields.io/badge/svelte-5-orange.svg)

## Features

### Navigation & Search
- 📁 **Tree Navigation** — hierarchical browsing with collapsible folders
- 🔍 **Global Search** — find diagrams and info pages by name instantly
- 📜 **History** — quick access to recently viewed items
- ⭐ **Favorites** — bookmark frequently used diagrams/info pages
- 📂 **Collections** — organize items into named collections

### Diagram Viewer
- 🖼️ **SVG Diagrams** — interactive wiring diagrams with pan & zoom
- 🔗 **Clickable Links** — navigate between diagrams or trigger searches
- 🏷️ **Label Scaling** — adjust text size independently of zoom
- 🖨️ **Print Support** — optimized print layout for diagrams

### Info Pages
- 📝 **Markdown Rendering** — technical documentation with images
- 🔍 **Image Magnifier** — Alt+hover to zoom into image details (5x, 300px lens)
- 📑 **Section Navigation** — jump to headings via sidebar
- 🔗 **Related Diagrams** — quick links to referenced schematics

### Interface
- 🌙 **Dark Mode** — system-aware theme with manual toggle
- 📱 **Resizable Panels** — drag to adjust tree/content split
- ⌨️ **Keyboard Shortcuts** — efficient navigation
- 💾 **PWA Ready** — installable, works offline with cached data

## Project Structure

```
wdsx/
├── packages/
│   ├── core/          # Shared TypeScript types
│   ├── importer/      # CLI: WDS → JSON/SVG/MD converter
│   └── viewer/        # SvelteKit web application
├── Dockerfile         # Production container (nginx)
└── docs/              # Additional documentation
```

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 9+
- BMW WDS source data (not included)

### Install

```bash
git clone https://github.com/emdzej/wdsx.git
cd wdsx
pnpm install
```

---

## Importer User Guide

The importer converts legacy BMW WDS data into a modern web-friendly format.

### Commands

#### `list-models` — Discover Available Models

```bash
pnpm --filter @emdzej/wds-importer exec wds-importer list-models \
  --source /path/to/wds/release \
  --language us
```

Shows all vehicle models available in your WDS source.

#### `import` — Convert WDS Data

```bash
pnpm --filter @emdzej/wds-importer exec wds-importer import \
  --source /path/to/wds/release \
  --output packages/viewer/static/data \
  --language us
```

**Options:**

| Option | Default | Description |
|--------|---------|-------------|
| `--source <path>` | `~/WDS/release` | Path to WDS `release` folder |
| `--output <path>` | `./data` | Output directory for converted files |
| `--language <code>` | `us` | Source language folder (us, de, etc.) |
| `--models <list>` | all | Comma-separated model IDs (e.g., `e46,e60,e90`) |
| `--parallel <n>` | `4` | Number of parallel workers |
| `--tree-only` | `false` | Import only tree data, skip shared files |
| `--dry-run` | `false` | Validate without writing files |
| `--verbose, -v` | `false` | Enable detailed logging |

**Examples:**

```bash
# Import all models
wds-importer import --source /mnt/wds/release --output ./data

# Import specific models only
wds-importer import --models e46,e90 --source /mnt/wds/release

# Add a new model to existing data (tree-only mode)
wds-importer import --models e60 --tree-only --output ./data

# Validate before actual import
wds-importer import --dry-run --verbose --source /mnt/wds/release
```

#### `validate` — Check Source Data

```bash
wds-importer validate --source /path/to/wds/release --verbose
```

Validates source data integrity without writing files.

#### `stats` — Show Import Statistics

```bash
wds-importer stats --output ./data
```

Displays summary of imported data (diagram count, info pages, etc.).

### Output Structure

After import, the output directory contains:

```
data/
├── models.json           # Vehicle model list with metadata
├── diagrams/
│   ├── index.json        # Diagram metadata index
│   └── *.svgz            # Compressed SVG diagrams
├── info/
│   ├── index.json        # Info page metadata index
│   └── *.md              # Markdown documentation
├── trees/
│   └── <model-id>.json   # Navigation tree per model
└── zi_images/
    └── *.png             # Info page images
```

---

## Running the Viewer

### Local Development

```bash
# Ensure data is imported first
pnpm --filter @emdzej/wds-importer exec wds-importer import \
  --source /path/to/wds/release \
  --output packages/viewer/static/data

# Start dev server
pnpm dev
```

Opens at http://localhost:5173

### Production Build (Static)

```bash
pnpm build
```

Output: `packages/viewer/build/` — serve with any static file server.

### Docker

#### Build Image

```bash
docker build -t wdsx:latest .
```

#### Run Container

```bash
docker run -d \
  --name wdsx \
  -p 8080:80 \
  -v /path/to/data:/data:ro \
  wdsx:latest
```

Access at http://localhost:8080

**Volume Mount:**
- `/data` — Mount your imported WDS data directory here

#### Docker Compose

```yaml
version: '3.8'
services:
  wdsx:
    image: ghcr.io/emdzej/wdsx:latest
    ports:
      - "8080:80"
    volumes:
      - ./data:/data:ro
    restart: unless-stopped
```

#### Environment

The container uses nginx and expects:
- Static app files at `/usr/share/nginx/html` (built-in)
- Data files mounted at `/data`

Health check endpoint: `GET /health`

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` or `Ctrl+K` | Focus search |
| `Escape` | Close search / clear selection |
| `Alt + hover` | Activate image magnifier (info pages) |

---

## Tech Stack

- **Framework:** SvelteKit 2 + Svelte 5 (runes)
- **Styling:** Tailwind CSS
- **Build:** Vite + Turborepo
- **SVG Interaction:** Custom pan/zoom implementation
- **Markdown:** marked
- **Container:** nginx (Alpine)

---

**Note:** Original BMW WDS data is property of BMW AG and is not included in this repository. You must provide your own legally obtained WDS source files.

## Right to Repair

The [Right to Repair](https://repair.eu) movement advocates for consumers' ability to fix the products they own — from electronics to vehicles — without being locked out by manufacturers through proprietary tools, paywalled documentation, or artificial restrictions.

**I build these tools because I believe repair is a fundamental right, not a privilege.**

Too often, service manuals, diagnostic software, and technical documentation are kept behind closed doors — unavailable to individuals even when they're willing to pay. This wasn't always the case. Products once shipped with schematics and repair guides as standard. The increasing complexity of modern technology doesn't change the fact that capable people exist who can — and should be allowed to — use that information.

These projects exist to preserve access to technical knowledge and ensure that owners aren't left at the mercy of vendors who may discontinue support, charge prohibitive fees, or simply refuse service.

## License

Licensed under [PolyForm Noncommercial 1.0.0](LICENSE) — free for personal and educational use, no commercial use permitted.
