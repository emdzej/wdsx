# WDS Importer

TypeScript-based import tool for transforming legacy WDS data into modern web format.

## Setup

```bash
pnpm install
```

## Usage

```bash
# Import all models
pnpm run import --source /path/to/WDS/release --output ../../data

# Import single model
pnpm run import --source /path/to/WDS/release --output ../../data --model e60

# Validate output
pnpm run validate --data ../../data

# Show statistics
pnpm run stats --data ../../data
```

## Development

```bash
# Run in dev mode
pnpm run dev

# Build
pnpm run build

# Test
pnpm run test

# Lint
pnpm run lint

# Format
pnpm run format
```

## Configuration

See `config.json` for options.

## Documentation

See `/docs/IMPORT-TOOL-PLAN.md` for detailed implementation plan.
