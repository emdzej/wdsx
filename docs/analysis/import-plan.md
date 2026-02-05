# WDS Import Tool - Implementation Plan

## Overview

TypeScript-based tool to transform legacy WDS data into modern JSON structure.

## Architecture

```
tools/importer/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── config.ts             # Configuration
│   ├── parsers/
│   │   ├── xml-parser.ts     # Parse tree XML files
│   │   ├── svg-parser.ts     # Process SVGZ files
│   │   └── html-parser.ts    # Parse and convert HTML
│   ├── transformers/
│   │   ├── model-transformer.ts     # Build model tree JSON
│   │   ├── diagram-transformer.ts   # Transform SVG links
│   │   └── info-transformer.ts      # HTML → Markdown
│   ├── writers/
│   │   ├── json-writer.ts    # Write JSON with validation
│   │   └── file-writer.ts    # Copy/write files
│   ├── validators/
│   │   └── schema-validator.ts  # Validate output
│   └── types/
│       ├── source.ts         # Source data types
│       └── target.ts         # Target schema types
├── package.json
└── tsconfig.json
```

## Implementation Phases

### Phase 1: Core Infrastructure ✓
**Goal**: Set up project and basic utilities

**Tasks**:
- [x] Initialize TypeScript project
- [ ] Configure dependencies (xml2js, jsdom, turndown, zlib)
- [ ] Define TypeScript types for source and target schemas
- [ ] Create configuration system
- [ ] Set up logging utility

**Dependencies**:
```json
{
  "dependencies": {
    "xml2js": "^0.6.2",
    "jsdom": "^24.0.0",
    "turndown": "^7.1.3",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.11.0",
    "@types/xml2js": "^0.4.14",
    "tsx": "^4.7.0"
  }
}
```

### Phase 2: XML Parser
**Goal**: Parse model tree XML files

**Tasks**:
- [ ] Implement XML file reader
- [ ] Parse `<imageList>` into icon definitions
- [ ] Parse `<root>` tree structure recursively
- [ ] Extract model name from root element
- [ ] Parse link attributes and extract IDs
- [ ] Generate unique node IDs
- [ ] Write unit tests

**Key Functions**:
```typescript
// src/parsers/xml-parser.ts
export async function parseModelTree(xmlPath: string): Promise<SourceTree>;
export function extractDiagramId(link: string): string | null;
export function extractInfoId(link: string): string | null;
```

### Phase 3: SVG Processor
**Goal**: Decompress and transform SVGZ diagrams

**Tasks**:
- [ ] Implement SVGZ decompression (gunzip)
- [ ] Parse SVG to find `<title>` and `viewBox`
- [ ] Transform `locateTree()` → `search()` in xlink:href
- [ ] Validate SVG structure
- [ ] Write transformed SVG
- [ ] Handle errors gracefully

**Key Functions**:
```typescript
// src/parsers/svg-parser.ts
export async function decompressSvgz(svgzPath: string): Promise<string>;
export function transformSvgLinks(svg: string): string;
export function extractSvgMetadata(svg: string): SvgMetadata;
```

### Phase 4: HTML Processor
**Goal**: Clean HTML and convert to Markdown

**Tasks**:
- [ ] Parse HTML with jsdom
- [ ] Extract `<title>` and `<h1>`
- [ ] Extract all `<h2 class="chapter">` sections
- [ ] Remove BMW-specific scripts/styles
- [ ] Convert to Markdown using turndown
- [ ] Write both cleaned HTML and Markdown
- [ ] Preserve semantic structure

**Key Functions**:
```typescript
// src/parsers/html-parser.ts
export async function parseInfoPage(htmlPath: string): Promise<InfoPage>;
export function cleanHtml(html: string): string;
export function convertToMarkdown(html: string): string;
export function extractSections(html: string): string[];
```

### Phase 5: Model Transformer
**Goal**: Build complete model JSON structures

**Tasks**:
- [ ] Combine XML parse results with metadata
- [ ] Build recursive tree structure
- [ ] Track all diagram/info references
- [ ] Generate model index entry
- [ ] Validate against schema
- [ ] Write model JSON file

**Key Functions**:
```typescript
// src/transformers/model-transformer.ts
export async function transformModel(modelId: string): Promise<ModelTree>;
export function buildNodeTree(xmlNode: XmlNode, idPrefix: string): TreeNode;
export function collectReferences(tree: TreeNode): References;
```

### Phase 6: Index Builders
**Goal**: Generate index files for quick lookups

**Tasks**:
- [ ] Build models index from all processed models
- [ ] Build diagrams index with cross-references
- [ ] Build info pages index with cross-references
- [ ] Build images index
- [ ] Calculate statistics (sizes, counts)
- [ ] Validate indexes

**Key Functions**:
```typescript
// src/transformers/index-builder.ts
export async function buildModelsIndex(models: ModelTree[]): Promise<ModelsIndex>;
export async function buildDiagramsIndex(diagrams: DiagramMeta[]): Promise<DiagramsIndex>;
export async function buildInfoIndex(pages: InfoPageMeta[]): Promise<InfoIndex>;
export async function buildImagesIndex(imagePath: string): Promise<ImagesIndex>;
```

### Phase 7: CLI & Orchestration
**Goal**: Tie everything together with a usable CLI

**Tasks**:
- [ ] Implement command-line interface
- [ ] Add progress reporting
- [ ] Parallel processing for models
- [ ] Error handling and logging
- [ ] Dry-run mode
- [ ] Resume capability (skip already processed)

**CLI Commands**:
```bash
# Full import (all models)
npm run import

# Import specific models
npm run import -- --models e60,e46

# Dry run (validate without writing)
npm run import -- --dry-run

# Clean output directory
npm run clean

# Validate output
npm run validate
```

**Key Functions**:
```typescript
// src/index.ts
export async function importAll(config: Config): Promise<void>;
export async function importModel(modelId: string, config: Config): Promise<void>;
export async function validateOutput(outputPath: string): Promise<ValidationResult>;
```

## Configuration

**config.ts**:
```typescript
export interface Config {
  sourcePath: string;           // /Users/emdzej/WDS/release
  outputPath: string;           // ./data
  language: string;             // "us"
  models: string[] | "all";     // Which models to process
  parallel: number;             // Concurrency level
  dryRun: boolean;
  verbose: boolean;
}

export const defaultConfig: Config = {
  sourcePath: "/Users/emdzej/WDS/release",
  outputPath: "./data",
  language: "us",
  models: "all",
  parallel: 4,
  dryRun: false,
  verbose: false
};
```

## Error Handling Strategy

1. **Validation errors**: Log and continue (collect all errors)
2. **File not found**: Warn and skip
3. **Parse errors**: Log details, mark as failed
4. **Critical errors**: Stop entire process
5. **Summary report**: Show success/failure counts at end

## Testing Strategy

1. **Unit tests**: Test individual parsers/transformers
2. **Integration tests**: Test full pipeline on sample model
3. **Validation tests**: Ensure output matches schema
4. **Regression tests**: Compare output with known-good results

## Performance Considerations

- **Parallel processing**: Process models concurrently
- **Streaming**: Use streams for large files where possible
- **Caching**: Cache parsed results to avoid re-parsing
- **Progress tracking**: Report progress every N files
- **Memory management**: Process in batches if memory is an issue

## Expected Timeline

| Phase | Estimate | Dependencies |
|-------|----------|--------------|
| 1. Infrastructure | 2 hours | None |
| 2. XML Parser | 4 hours | Phase 1 |
| 3. SVG Processor | 3 hours | Phase 1 |
| 4. HTML Processor | 4 hours | Phase 1 |
| 5. Model Transformer | 3 hours | Phases 2-4 |
| 6. Index Builders | 2 hours | Phase 5 |
| 7. CLI & Orchestration | 3 hours | All phases |
| **Testing & Polish** | 4 hours | All phases |
| **TOTAL** | **~25 hours** | |

## Validation Checklist

Before considering import complete:

- [ ] All 18 models processed successfully
- [ ] All SVGZ files decompressed and transformed
- [ ] All HTML files cleaned and converted
- [ ] All indexes generated correctly
- [ ] JSON validates against schemas
- [ ] Cross-references are accurate
- [ ] File sizes match expectations (~2GB total)
- [ ] No broken links or missing references
- [ ] Sample spot-checks pass manual review

## Next Steps

1. Complete Phase 1 (dependencies and types)
2. Implement and test XML parser (Phase 2)
3. Test on single model (e60) before scaling to all
4. Add progress reporting early for visibility
5. Document any data quality issues discovered

## Notes

- Start with smallest model for initial testing
- Keep original files untouched (read-only access)
- Generate detailed logs for debugging
- Consider incremental output (write as we go)
- Plan for potential re-runs if issues found
