# WDS Import Tool - Implementation Plan

## Overview

The import tool transforms legacy WDS data into a modern, web-friendly format. Built with TypeScript for type safety and maintainability.

## Architecture

```
tools/importer/
├── src/
│   ├── index.ts              # Main CLI entry point
│   ├── config.ts             # Configuration management
│   ├── types/                # TypeScript type definitions
│   │   ├── source.ts         # Legacy data types
│   │   ├── target.ts         # Target format types
│   │   └── index.ts
│   ├── parsers/              # Source data parsers
│   │   ├── XmlParser.ts      # XML tree parser
│   │   ├── SvgzProcessor.ts  # SVGZ decompressor & transformer
│   │   ├── HtmlParser.ts     # HTML to Markdown converter
│   │   └── index.ts
│   ├── transformers/         # Data transformers
│   │   ├── TreeTransformer.ts    # XML → JSON tree
│   │   ├── DiagramTransformer.ts # SVGZ → SVG
│   │   ├── InfoTransformer.ts    # HTML → Markdown
│   │   └── index.ts
│   ├── generators/           # Output generators
│   │   ├── IndexGenerator.ts     # Master index
│   │   ├── ModelGenerator.ts     # Model JSON files
│   │   ├── SearchGenerator.ts    # Search index (optional)
│   │   └── index.ts
│   ├── utils/                # Utilities
│   │   ├── logger.ts         # Logging
│   │   ├── fileSystem.ts     # File operations
│   │   ├── idGenerator.ts    # ID generation
│   │   └── validator.ts      # Data validation
│   └── pipeline/             # Processing pipeline
│       ├── Pipeline.ts       # Main orchestrator
│       ├── steps/            # Pipeline steps
│       │   ├── DiscoveryStep.ts
│       │   ├── ValidationStep.ts
│       │   ├── TransformStep.ts
│       │   └── OutputStep.ts
│       └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal**: Set up project structure and basic parsing

**Tasks**:
1. Initialize TypeScript project
   - `package.json` with dependencies
   - `tsconfig.json` with strict mode
   - ESLint & Prettier config
   
2. Define type system
   - Source data types (XML, HTML, SVG)
   - Target format types (JSON schema)
   - Utility types
   
3. Implement XML parser
   - Read XML tree files
   - Parse into typed objects
   - Extract metadata
   
4. Basic file system utils
   - Directory traversal
   - File reading/writing
   - Path resolution

**Deliverables**:
- ✅ TypeScript project initialized
- ✅ Can parse XML tree files
- ✅ Type-safe data structures
- ✅ Basic logging

### Phase 2: XML Transformation (Week 2)

**Goal**: Convert XML trees to JSON format

**Tasks**:
1. Tree transformer
   - Flatten nested folders
   - Generate unique IDs
   - Extract links and categorize
   - Build breadcrumb paths
   
2. Link resolver
   - Parse SVG links (`wrapper.htm?file=...`)
   - Parse HTML links (`zinfo/...`)
   - Extract clean IDs
   - Validate link targets exist
   
3. Icon mapper
   - Extract image list
   - Resolve icon paths
   - Build icon map
   
4. Model metadata extractor
   - Detect model ID from filename
   - Extract model name
   - Count statistics

**Deliverables**:
- ✅ XML → JSON tree conversion working
- ✅ All links resolved correctly
- ✅ Generated model JSON files
- ✅ Validation of tree structure

### Phase 3: SVG Processing (Week 3)

**Goal**: Transform SVGZ diagrams to clean SVG

**Tasks**:
1. SVGZ decompressor
   - Read `.svgz` files
   - GZIP decompression
   - Output clean SVG
   
2. SVG transformer
   - Replace `locateTree()` → `search()`
   - Extract component references
   - Remove external stylesheet refs
   - Clean up metadata
   
3. Diagram metadata extractor
   - Parse `<title>` element
   - Extract `viewBox` attribute
   - Find all `<a xlink:href>` links
   - List component IDs
   
4. Batch processor
   - Process all SVGZs efficiently
   - Progress tracking
   - Error handling
   - Resume capability

**Deliverables**:
- ✅ SVGZ → SVG conversion working
- ✅ Interactive links transformed
- ✅ Diagram metadata extracted
- ✅ 23k+ diagrams processed

### Phase 4: HTML to Markdown (Week 4)

**Goal**: Convert HTML info pages to Markdown

**Tasks**:
1. HTML parser
   - Read HTML files
   - Parse DOM structure
   - Extract `<body>` content
   - Handle XHTML quirks
   
2. Markdown converter
   - Convert headings, paragraphs
   - Convert tables to markdown tables
   - Convert lists
   - Handle images
   
3. Image path resolver
   - Rewrite `../../zi_images/` → `../images/`
   - Validate image references
   - Copy images to output
   
4. Metadata extractor
   - Extract `<title>`
   - Parse meta tags
   - Find component references
   - Detect document type

**Deliverables**:
- ✅ HTML → Markdown conversion working
- ✅ Tables preserved correctly
- ✅ Image links resolved
- ✅ 20k+ pages converted

### Phase 5: Index Generation (Week 5)

**Goal**: Create master index and search capabilities

**Tasks**:
1. Master index generator
   - Collect all models
   - Calculate statistics
   - Generate `index.json`
   
2. Cross-references builder
   - Map diagrams to models
   - Map info pages to models
   - Build component index
   
3. Search index builder (optional)
   - Extract keywords from content
   - Build inverted index
   - Generate `search-index.json`
   
4. Validation suite
   - Check all links resolve
   - Verify file references
   - Detect duplicates
   - Report orphaned files

**Deliverables**:
- ✅ Master index generated
- ✅ All cross-references valid
- ✅ Search index created
- ✅ Full validation passing

### Phase 6: Optimization & Testing (Week 6)

**Goal**: Optimize output and ensure quality

**Tasks**:
1. SVG optimization
   - Remove unused elements
   - Minify paths (optional)
   - Compress viewBox values
   
2. Image optimization
   - PNG compression
   - WebP conversion (optional)
   - Remove metadata
   
3. Data deduplication
   - Find duplicate diagrams
   - Merge common info pages
   - Share common resources
   
4. Comprehensive testing
   - Unit tests for parsers
   - Integration tests
   - Validation tests
   - Performance benchmarks

**Deliverables**:
- ✅ Optimized output
- ✅ Test suite passing
- ✅ Documentation complete
- ✅ Ready for production use

## Technical Specifications

### Dependencies

```json
{
  "dependencies": {
    "fast-xml-parser": "^4.3.0",      // XML parsing
    "zlib": "^1.0.5",                  // GZIP decompression (Node builtin)
    "turndown": "^7.1.0",              // HTML to Markdown
    "chalk": "^5.3.0",                 // Terminal colors
    "commander": "^11.0.0",            // CLI framework
    "p-queue": "^8.0.0",               // Async queue for batch processing
    "globby": "^14.0.0"                // File globbing
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "tsx": "^4.0.0",                   // TypeScript execution
    "vitest": "^1.0.0",                // Testing
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "prettier": "^3.0.0"
  }
}
```

### CLI Interface

```bash
# Full pipeline (all models)
pnpm run import --source /path/to/WDS/release --output ./data

# Single model
pnpm run import --source /path/to/WDS/release --output ./data --model e60

# Specific phase
pnpm run import --source /path/to/WDS/release --output ./data --phase xml

# Validation only
pnpm run validate --data ./data

# Statistics
pnpm run stats --data ./data
```

### Configuration

**File**: `tools/importer/config.json`

```json
{
  "sourceDir": "/Users/emdzej/WDS/release",
  "outputDir": "./data",
  "language": "us",
  "phases": {
    "xml": true,
    "svg": true,
    "html": true,
    "index": true,
    "optimize": false
  },
  "svg": {
    "transformLinks": true,
    "removeExternalRefs": true,
    "preserveComments": false
  },
  "html": {
    "convertToMarkdown": true,
    "preserveTables": true,
    "extractMetadata": true
  },
  "optimization": {
    "compressPng": false,
    "generateWebp": false,
    "minifySvg": false
  },
  "logging": {
    "level": "info",
    "file": "import.log"
  }
}
```

### Error Handling

- **Fail-fast mode**: Stop on first error (default for development)
- **Continue mode**: Log errors but keep processing (production)
- **Resume mode**: Skip already processed files (for re-runs)

### Progress Tracking

```
Processing E60 model...
├─ Parsing XML tree... ✓ (0.2s)
├─ Processing diagrams... [████████░░] 80% (2345/2934)
├─ Converting HTML pages... [██████████] 100% (1823/1823) ✓
└─ Generating index... ✓ (0.1s)

Total: 3 models, 23,926 diagrams, 20,296 pages
Time: 12m 34s
Errors: 3 (see import.log)
```

## Testing Strategy

### Unit Tests

- XML parser: Parse valid/invalid XML
- Link resolver: Extract correct IDs
- SVG transformer: Replace links correctly
- HTML converter: Preserve structure

### Integration Tests

- Full pipeline on sample data
- Validate output against schema
- Check all cross-references
- Verify file existence

### Validation Tests

- JSON schema validation
- Link integrity checks
- File reference validation
- Duplicate detection

### Performance Tests

- Measure parsing speed
- Monitor memory usage
- Benchmark batch processing
- Identify bottlenecks

## Monitoring & Logging

### Log Levels

- `error`: Failures that stop processing
- `warn`: Issues that may need attention
- `info`: Progress and milestones
- `debug`: Detailed processing info
- `trace`: Verbose debugging

### Metrics

- Files processed per second
- Memory usage (current/peak)
- Error rate
- Duplicate count
- Missing reference count

## Risk Mitigation

### 1. Data Corruption

**Risk**: Invalid transformation breaks data  
**Mitigation**: 
- Validate output against schema
- Compare statistics (file counts)
- Spot-check random samples

### 2. Missing Files

**Risk**: Source files not found  
**Mitigation**:
- Verify source directory structure first
- List all files before processing
- Report missing references

### 3. Memory Exhaustion

**Risk**: Processing 44k files runs out of memory  
**Mitigation**:
- Stream processing where possible
- Batch in chunks
- Use queue with concurrency limit
- Monitor memory usage

### 4. Encoding Issues

**Risk**: Special characters garbled  
**Mitigation**:
- Force UTF-8 encoding
- Test with German (umlaut) data
- Validate character preservation

## Success Criteria

- ✅ All 14 models processed successfully
- ✅ 23,926 SVG diagrams transformed
- ✅ 20,296 HTML pages converted to Markdown
- ✅ All links resolve correctly
- ✅ Master index generated
- ✅ Zero data loss vs. source
- ✅ Output validates against schema
- ✅ Processing completes in < 30 minutes
- ✅ Memory usage < 4 GB
- ✅ < 0.1% error rate

## Future Enhancements

- Web UI for monitoring import progress
- Incremental import (only changed files)
- Multi-language support (German, etc.)
- Delta generation (changes between versions)
- Cloud storage integration (S3, etc.)
- CDN deployment automation
