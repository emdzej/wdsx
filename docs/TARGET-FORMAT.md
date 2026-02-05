# Target Data Format

## Design Goals

1. **Simple & Flat**: Easy to query, no deep nesting
2. **Type-Safe**: Strong TypeScript types
3. **Fast Lookup**: Indexed by ID for O(1) access
4. **Portable**: Standard JSON, works everywhere
5. **Version Control Friendly**: Text-based, diffable

## Directory Structure

```
data/
├── index.json              # Master index of all models
├── models/                 # Per-model data
│   ├── e60.json           # Model metadata & tree structure
│   ├── e90.json
│   └── ...
├── diagrams/              # SVG wiring diagrams
│   ├── SP0000019341.svg
│   ├── SP0000019342.svg
│   └── ...
├── info/                  # Documentation pages (Markdown)
│   ├── HEMFB1214_MS45LS.md
│   ├── E46_EX60211A.md
│   └── ...
└── images/                # Shared images
    ├── G_183097.png
    ├── B020001.png
    └── ...
```

## TypeScript Schemas

### Master Index

**File**: `data/index.json`

```typescript
interface WDSIndex {
  version: string;           // Data format version
  generated: string;         // ISO timestamp
  models: ModelReference[];  // All available models
}

interface ModelReference {
  id: string;               // e.g., "e60"
  name: string;             // e.g., "E60/E61 5-Series"
  series: string;           // e.g., "E60"
  years?: string;           // e.g., "2003-2010"
  file: string;             // e.g., "models/e60.json"
  stats: {
    diagrams: number;
    infoPages: number;
    categories: number;
  };
}
```

**Example**:
```json
{
  "version": "1.0.0",
  "generated": "2026-02-05T21:00:00Z",
  "models": [
    {
      "id": "e60",
      "name": "E60/E61 5-Series",
      "series": "E60",
      "years": "2003-2010",
      "file": "models/e60.json",
      "stats": {
        "diagrams": 2456,
        "infoPages": 1823,
        "categories": 342
      }
    }
  ]
}
```

### Model Tree

**File**: `data/models/{model}.json`

```typescript
interface ModelData {
  model: string;            // "E60"
  name: string;             // "E60/E61 5-Series"
  language: string;         // "en-US"
  sourceFile: string;       // Original XML filename
  generated: string;        // ISO timestamp
  icons: IconMap;           // UI icon mappings
  tree: CategoryNode;       // Hierarchical navigation tree
}

interface IconMap {
  [key: string]: string;    // icon ID -> path
}
// Example: { "11": "images/icon_schem.gif" }

interface CategoryNode {
  id: string;               // Unique ID: "e60-drive-dme"
  name: string;             // Display name
  path: string[];           // Breadcrumb: ["Complete vehicle", "Drive", "DME"]
  children?: CategoryNode[]; // Subcategories
  items?: ContentItem[];    // Content in this category
}

interface ContentItem {
  id: string;               // Unique ID: "e60-dme-oxygen-sensor"
  name: string;             // Display name
  type: 'diagram' | 'info'; // Content type
  icon?: string;            // Icon ID from IconMap
  
  // For diagrams
  diagram?: string;         // Diagram ID: "SP0000019341"
  
  // For info pages
  info?: string;            // Info page ID: "HEMFB1214_MS45LS"
}
```

**Example**:
```json
{
  "model": "E60",
  "name": "E60/E61 5-Series",
  "language": "en-US",
  "sourceFile": "e60_wds_us_files.xml",
  "generated": "2026-02-05T21:00:00Z",
  "icons": {
    "11": "images/icon_schem.gif",
    "13": "images/icon_comploc.gif",
    "25": "images/icon_document.gif"
  },
  "tree": {
    "id": "e60-root",
    "name": "Complete vehicle",
    "path": [],
    "children": [
      {
        "id": "e60-drive",
        "name": "Drive",
        "path": ["Complete vehicle"],
        "children": [
          {
            "id": "e60-drive-dme",
            "name": "Motor Electronics (DME)",
            "path": ["Complete vehicle", "Drive"],
            "items": [
              {
                "id": "e60-dme-oxygen-sensor-diagram",
                "name": "Oxygen sensors before catalytic converter",
                "type": "diagram",
                "icon": "11",
                "diagram": "SP0000019341"
              },
              {
                "id": "e60-dme-oxygen-sensor-info",
                "name": "Oxygen Sensors and Catalytic Converter",
                "type": "info",
                "icon": "25",
                "info": "HEMFB1214_MS45LS"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### Diagram Metadata

**File**: `data/diagrams/{id}.json` (optional, alongside SVG)

```typescript
interface DiagramMeta {
  id: string;               // "SP0000019341"
  title?: string;           // Extracted from SVG <title>
  viewBox: string;          // SVG viewBox attribute
  components: string[];     // Component IDs found in diagram
  models: string[];         // Models using this diagram
  file: string;             // "diagrams/SP0000019341.svg"
}
```

**Example**:
```json
{
  "id": "SP0000019341",
  "title": "Oxygen sensors before catalytic converter",
  "viewBox": "37 607 1958 2359",
  "components": ["X531", "X10016", "X13020"],
  "models": ["e60", "e61"],
  "file": "diagrams/SP0000019341.svg"
}
```

### Info Page Metadata

**File**: `data/info/{id}.json` (optional, alongside Markdown)

```typescript
interface InfoMeta {
  id: string;               // "HEMFB1214_MS45LS"
  title: string;            // Extracted from HTML <title>
  type?: string;            // DiagnosisDocument meta tag value
  components?: string[];    // Component IDs mentioned
  images?: string[];        // Referenced images
  models: string[];         // Models using this page
  file: string;             // "info/HEMFB1214_MS45LS.md"
}
```

**Example**:
```json
{
  "id": "HEMFB1214_MS45LS",
  "title": "Oxygen Sensors and Catalytic Converter",
  "type": "InstallationLocation",
  "components": ["X60211", "X60212"],
  "images": ["images/G_183097.png"],
  "models": ["e60"],
  "file": "info/HEMFB1214_MS45LS.md"
}
```

## File Formats

### SVG Diagrams

**Location**: `data/diagrams/{id}.svg`

**Transformations**:
1. Decompress SVGZ → SVG
2. Replace `javascript:locateTree('X')` → `javascript:search('X')`
3. Remove external stylesheet references
4. Inline or remove legacy scripts
5. Preserve all drawing elements

**Example**:
```xml
<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="37 607 1958 2359">
  <title>Oxygen sensors before catalytic converter</title>
  <style>/* Embedded CSS */</style>
  <g>
    <!-- Drawing elements -->
    <text>
      <tspan>
        <a xlink:href="javascript:search('X531');">X531</a>
      </tspan>
    </text>
  </g>
</svg>
```

### Info Pages (Markdown)

**Location**: `data/info/{id}.md`

**Transformations**:
1. Extract `<body>` content
2. Convert HTML → Markdown
3. Preserve tables, lists, headings
4. Convert image paths: `../../zi_images/G_183097.png` → `../images/G_183097.png`
5. Add frontmatter metadata

**Example**:
```markdown
---
id: HEMFB1214_MS45LS
title: "Oxygen Sensors and Catalytic Converter"
type: InstallationLocation
components: [X60211, X60212]
---

# X60211, X60212

![Component Location](../images/G_183097.png)

_in water box right (battery removed)_

| Connector | Description |
|-----------|-------------|
| X60211 | Component connector (23-pin, black), Variable valve timing gear control module |
| X60212 | Component connector (10-pin, black), Variable valve timing gear control module |
```

### Images

**Location**: `data/images/{filename}`

**Processing**:
1. Copy from `zi_images/` as-is
2. Optional: optimize PNG compression
3. Optional: convert to WebP for web viewer

## Search Index (Optional)

**File**: `data/search-index.json`

For fast full-text search without loading all data.

```typescript
interface SearchIndex {
  components: ComponentIndex[];
  diagrams: DiagramIndex[];
  info: InfoIndex[];
}

interface ComponentIndex {
  id: string;               // "X531"
  type: string;             // "connector", "sensor", etc.
  diagrams: string[];       // Diagram IDs containing this component
  models: string[];         // Models having this component
}

interface DiagramIndex {
  id: string;
  title: string;
  models: string[];
  keywords: string[];       // Extracted terms for search
}

interface InfoIndex {
  id: string;
  title: string;
  models: string[];
  excerpt: string;          // First 200 chars
  keywords: string[];
}
```

## Benefits of This Format

### 1. **Simple Queries**

```typescript
// Load model tree
const model = await fetch('data/models/e60.json').then(r => r.json());

// Load specific diagram
const diagram = await fetch('data/diagrams/SP0000019341.svg').then(r => r.text());

// Load info page
const info = await fetch('data/info/HEMFB1214_MS45LS.md').then(r => r.text());
```

### 2. **Type Safety**

```typescript
import type { ModelData, CategoryNode, ContentItem } from './types';

function renderTree(node: CategoryNode) {
  // Full TypeScript autocomplete
}
```

### 3. **Flat File Structure**

- No deep nesting = faster file operations
- Easy to add/remove/update individual files
- Git-friendly: small diffs

### 4. **Scalable**

- Load only what you need
- Index file is tiny (~50 KB)
- Model trees are moderate (~500 KB each)
- Diagrams/info loaded on demand

### 5. **Future-Proof**

- Standard JSON/SVG/Markdown
- No proprietary formats
- Easy to migrate or extend

## Migration Path

1. **Phase 1**: Parse XML, generate model JSONs
2. **Phase 2**: Process SVGZs, generate SVGs
3. **Phase 3**: Convert HTML to Markdown
4. **Phase 4**: Build search index
5. **Phase 5**: Optimize (compress, dedup, etc.)

## Storage Estimates

Based on US data (265 MB source):

- **Model JSONs**: ~5 MB total (14 models × ~350 KB)
- **SVG diagrams**: ~150 MB (decompressed, no optimization)
- **Info Markdown**: ~15 MB
- **Images**: ~60 MB (PNG as-is)
- **Index**: ~50 KB

**Total**: ~230 MB (similar to source, but more accessible)

## Compatibility

- ✅ Web browsers (static file serving)
- ✅ Node.js (file system access)
- ✅ Static site generators (Jekyll, Hugo, etc.)
- ✅ Electron apps
- ✅ Mobile apps (React Native, etc.)

## Version Control

- Each model is a separate file → independent changes
- Diagrams are binary but stable (rarely change)
- Markdown is text → good diffs
- Index is generated → can be .gitignored
