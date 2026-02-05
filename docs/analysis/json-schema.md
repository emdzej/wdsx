# WDS Target Data Structure - JSON Schema

## Overview

Transform legacy WDS data into a modern, normalized JSON structure optimized for:
- Fast querying and navigation
- Client-side rendering
- API-friendly format
- Version control compatibility (readable diffs)

## File Organization

```
data/
├── models/
│   ├── index.json              # All models metadata
│   ├── e60.json               # E60/E61 model tree
│   ├── e46.json               # E46 model tree
│   └── ...                    # One file per model
├── diagrams/
│   ├── index.json             # All diagrams metadata
│   ├── SP0000019341.svg       # Decompressed SVG (transformed)
│   └── ...                    # One SVG per diagram
├── info/
│   ├── index.json             # All info pages metadata
│   ├── HEMFB1214_MS45LS.md   # Converted to Markdown
│   ├── HEMFB1214_MS45LS.html # Original HTML (cleaned)
│   └── ...                    # One file per info page
└── images/
    ├── index.json             # Image catalog
    └── [original PNG files]   # Copied as-is
```

## JSON Schemas

### 1. Models Index (`models/index.json`)

```typescript
interface ModelsIndex {
  version: string;              // Schema version
  generated: string;            // ISO 8601 timestamp
  sourceLanguage: string;       // "us", "de", etc.
  models: ModelMeta[];
}

interface ModelMeta {
  id: string;                   // "e60", "e46", etc.
  name: string;                 // "E60" (from XML root)
  file: string;                 // "e60.json"
  treeSize: number;             // Total nodes count
  diagramCount: number;         // Referenced diagrams
  infoCount: number;            // Referenced info pages
}
```

**Example:**
```json
{
  "version": "1.0.0",
  "generated": "2026-02-05T21:00:00Z",
  "sourceLanguage": "us",
  "models": [
    {
      "id": "e60",
      "name": "E60",
      "file": "e60.json",
      "treeSize": 1543,
      "diagramCount": 234,
      "infoCount": 189
    }
  ]
}
```

### 2. Model Tree (`models/{id}.json`)

```typescript
interface ModelTree {
  model: string;                // "E60"
  modelId: string;              // "e60"
  language: string;             // "us"
  generated: string;
  icons: IconDefinition[];
  tree: TreeNode;
}

interface IconDefinition {
  id: string;                   // "11", "13", etc.
  file: string;                 // Normalized path
  description?: string;         // Icon purpose
}

interface TreeNode {
  type: "folder" | "leaf";
  name: string;
  id: string;                   // Generated unique ID
  
  // Folder-specific
  children?: TreeNode[];
  
  // Leaf-specific
  icon?: string;                // Icon ID reference
  diagram?: string;             // Diagram ID (e.g., "SP0000019341")
  info?: string;                // Info page ID (e.g., "HEMFB1214_MS45LS")
}
```

**Example:**
```json
{
  "model": "E60",
  "modelId": "e60",
  "language": "us",
  "generated": "2026-02-05T21:00:00Z",
  "icons": [
    {
      "id": "11",
      "file": "images/icon_schem.gif",
      "description": "Schematic diagram"
    }
  ],
  "tree": {
    "type": "folder",
    "name": "Complete vehicle",
    "id": "root-0",
    "children": [
      {
        "type": "folder",
        "name": "Drive",
        "id": "root-0-0",
        "children": [
          {
            "type": "leaf",
            "name": "Oxygen sensors before catalytic converter",
            "id": "root-0-0-0",
            "icon": "11",
            "diagram": "SP0000019341"
          },
          {
            "type": "leaf",
            "name": "Oxygen Sensors and Catalytic Converter",
            "id": "root-0-0-1",
            "icon": "25",
            "info": "HEMFB1214_MS45LS"
          }
        ]
      }
    ]
  }
}
```

### 3. Diagrams Index (`diagrams/index.json`)

```typescript
interface DiagramsIndex {
  version: string;
  generated: string;
  diagrams: DiagramMeta[];
}

interface DiagramMeta {
  id: string;                   // "SP0000019341"
  file: string;                 // "SP0000019341.svg"
  title?: string;               // Extracted from SVG <title>
  viewBox?: string;             // SVG viewBox attribute
  referencedBy: ModelReference[]; // Which models use this
}

interface ModelReference {
  model: string;                // "e60"
  occurrences: number;          // How many times referenced
}
```

**Example:**
```json
{
  "version": "1.0.0",
  "generated": "2026-02-05T21:00:00Z",
  "diagrams": [
    {
      "id": "SP0000019341",
      "file": "SP0000019341.svg",
      "title": "Oxygen sensors before catalytic converter",
      "viewBox": "37 607 1958 2359",
      "referencedBy": [
        {
          "model": "e60",
          "occurrences": 4
        }
      ]
    }
  ]
}
```

### 4. Info Pages Index (`info/index.json`)

```typescript
interface InfoIndex {
  version: string;
  generated: string;
  pages: InfoPageMeta[];
}

interface InfoPageMeta {
  id: string;                   // "HEMFB1214_MS45LS"
  title: string;                // From HTML <title> or <h1>
  htmlFile: string;             // "HEMFB1214_MS45LS.html"
  mdFile?: string;              // "HEMFB1214_MS45LS.md" (if converted)
  sections: string[];           // ["Function", "Diagnosis", "Design"]
  referencedBy: ModelReference[];
}
```

**Example:**
```json
{
  "version": "1.0.0",
  "generated": "2026-02-05T21:00:00Z",
  "pages": [
    {
      "id": "HEMFB1214_MS45LS",
      "title": "Oxygen Sensors and Catalytic Converter",
      "htmlFile": "HEMFB1214_MS45LS.html",
      "mdFile": "HEMFB1214_MS45LS.md",
      "sections": ["Function", "Diagnosis", "Design", "Heating"],
      "referencedBy": [
        {
          "model": "e60",
          "occurrences": 6
        }
      ]
    }
  ]
}
```

### 5. Images Index (`images/index.json`)

```typescript
interface ImagesIndex {
  version: string;
  generated: string;
  totalSize: number;            // Total bytes
  images: ImageMeta[];
}

interface ImageMeta {
  id: string;                   // Filename without extension
  file: string;                 // "GREO_E60_61_0034.png"
  size: number;                 // Bytes
  dimensions?: {
    width: number;
    height: number;
  };
  referencedBy: string[];       // Info page IDs or diagram IDs
}
```

## Design Decisions

### ✅ Why JSON?
- Human-readable for git diffs
- Easy to parse in any language
- Well-supported tooling ecosystem
- Can be loaded incrementally (one model at a time)

### ✅ Why separate files per model?
- **Lazy loading**: Load only needed model data
- **Git-friendly**: Changes to one model don't dirty others
- **Parallel processing**: Can import models concurrently

### ✅ Why indexes?
- **Fast lookups**: Find diagrams/pages without parsing all models
- **Cross-references**: See which models share diagrams
- **Metadata**: Quick overview without loading full data

### ✅ Why both HTML and Markdown?
- **HTML**: Preserve original formatting, fallback
- **Markdown**: Better for text search, easier to render
- **Choice**: Clients can use whichever fits better

### ✅ Why transform SVG links?
- **Modern compatibility**: `search()` pattern for web app
- **Future-proof**: Easier to implement search functionality
- **Consistency**: Standard pattern across all diagrams

## Validation

Each JSON file should be validated against its schema using TypeScript types at build time.

## Size Estimates

| Type | Count | Avg Size | Total |
|------|-------|----------|-------|
| Model trees | 18 | ~200KB | ~3.6MB |
| Diagrams (SVG) | 23,926 | ~50KB | ~1.2GB |
| Info (HTML) | 20,296 | ~5KB | ~100MB |
| Info (MD) | 20,296 | ~3KB | ~60MB |
| Images | 13,123 | ~46KB | 605MB |
| Indexes | 4 | ~500KB | ~2MB |
| **TOTAL** | | | **~2GB** |

## Compression Strategy

For production:
- Serve JSON with gzip (expect 70-80% reduction)
- SVG files highly compressible (original were .svgz)
- Consider lazy-loading diagrams on-demand
- Cache indexes aggressively

## Next Steps

See [import-plan.md](./import-plan.md) for implementation details.
