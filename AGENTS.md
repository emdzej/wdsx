# AGENTS.md - WDS (Wiring Diagram System)

Guidelines for AI agents working on this codebase.

## Project Overview

BMW WDS (Wiring Diagram System) importer and viewer.
Converts BMW WDS XML/SVG/HTML data into a web-viewable format.

## Stack

- **Monorepo**: pnpm + Turborepo (migration planned: #28)
- **Importer**: TypeScript + Node.js
- **Viewer**: SvelteKit + Tailwind + panzoom
- **Testing**: Vitest
- **Build**: TypeScript (`tsc`) / Vite

---

## Tech Guidelines

When working with specific technologies, load the relevant guide:

| Technology | Guide                                                            | When to load                     |
| ---------- | ---------------------------------------------------------------- | -------------------------------- |
| TypeScript | [`docs/guidelines/typescript.md`](docs/guidelines/typescript.md) | Types, const objects, binary ops |

**Rule:** Load the relevant guide(s) before starting work in that area.

---

## Package Structure (target after #28)

```
packages/
├── importer/       # XML/SVG/HTML import pipeline
├── core/           # Shared types and utilities
└── ...
apps/
├── viewer/         # SvelteKit web viewer (#7)
└── ...
tools/              # Scripts and utilities
data/               # Generated output (not committed)
```

---

## Source Data

BMW WDS release files location: `/Users/emdzej/WDS/release/`

Structure per model (e.g., E60):
```
E60/
├── tree.xml        # Navigation tree
├── diagrams/       # SVG/SVGZ wiring diagrams
├── info/           # HTML info pages
└── icons/          # Model-specific icons
```

Shared images: `/Users/emdzej/WDS/release/zi_images/` (~13k PNGs)

**DO NOT commit source data** — BMW intellectual property.

---

## Commands

```bash
pnpm install          # Install deps
pnpm test             # Run all tests
pnpm lint             # Lint all packages
pnpm build            # Build all packages
pnpm typecheck        # Type check
```

---

## Core Rules

### Language

- **All code, comments, and commit messages in English**
- Documentation can be bilingual

### Git Workflow

**Branches:**
| Prefix | Usage | Example |
|--------|-------|---------|
| `feature/` | New features | `feature/svg-viewer` |
| `bugfix/` | Bug fixes | `bugfix/fix-svgz-decode` |
| `chore/` | Maintenance | `chore/update-dependencies` |

**Commits (Conventional):**

```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore
Scopes: importer, viewer, core, etc.
```

**Before every PR:**

```bash
pnpm lint && pnpm typecheck && pnpm test
```

**PR Body:** Use `--body-file /tmp/pr.md` (not inline `--body`) for proper formatting.

---

## Import Pipeline

1. **Tree Parser** - Parse tree.xml into navigation structure
2. **SVG Processor** - Decompress SVGZ, rewrite xlink:href paths
3. **HTML Processor** - Convert info HTML to Markdown
4. **Model Transformer** - Combine all data per model
5. **Index Builder** - Generate search indexes

Output goes to `data/` directory.

---

## Key Issues

- **#7** - Web Viewer Application (SvelteKit)
- **#8** - Multi-language support
- **#28** - Monorepo migration (pnpm + Turborepo)

---

## Reference

- Issues: https://github.com/emdzej/wds/issues
