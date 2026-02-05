# WDS Data Structure Analysis

## Source Data Location
`/Users/emdzej/WDS`

## Overview Statistics
- **Vehicle Models**: 18 (E38, E39, E46, E52, E53, E60/E61, E63/E64, E65/E66, E70, E71, E83, E85, E87, E89, E90, F01)
- **SVGZ Diagrams**: 23,926 files
- **HTML Info Pages**: 20,296 files  
- **Shared Images**: 13,123 PNG files (605MB in `/release/zi_images/`)
- **Languages**: US (English) confirmed, DE (German) likely in other folders

## Directory Structure

```
WDS/
├── release/
│   ├── zi_images/          # Shared diagram images (13,123 PNG files, 605MB)
│   ├── us/                 # US English language data
│   │   ├── svg/sp/         # SVGZ wiring diagrams (23,926 files)
│   │   ├── zinfo/          # HTML description pages (20,296 files)
│   │   ├── e60e61/tree/    # E60/E61 model tree structure
│   │   │   └── e60_wds_us_files.xml  (1.6MB)
│   │   ├── e46/tree/       # E46 model tree
│   │   ├── [e38new, e39new, e52, e53...]/tree/  # Other models
│   │   └── f01/tree/       # F01 model tree
│   └── version.js
```

## XML Tree Structure

Each vehicle model has a single XML file in `{model}/tree/*.xml`

### Root Element
```xml
<tree>
  <imageList>
    <image name="11" file="images/icon_schem.gif"/>
    <image name="13" file="images/icon_comploc.gif"/>
    <!-- Icon definitions -->
  </imageList>
  
  <root name="E60" hidden="yes" id="root">
    <!-- Model name in root element -->
    <folder name="Complete vehicle">
      <folder name="Drive">
        <folder name="Motor Electronics...">
          <leaf name="..." image="11" link="../svg/sp/wrapper.htm?file=SP0000019341.htm"/>
          <leaf name="..." image="25" link="../zinfo/HEMFB1214_MS45LS.htm"/>
        </folder>
      </folder>
    </folder>
  </root>
</tree>
```

### Key Elements

#### `<imageList>`
Maps icon IDs to image files:
- `name`: Icon ID (e.g., "11", "13", "15")
- `file`: Path to icon image

#### `<root>`
- `name`: **Vehicle model name** (e.g., "E60")
- `hidden`: "yes" (UI hint)
- `id`: "root"

#### `<folder>`
- `name`: Category/section name
- Nested hierarchy of electrical systems and components

#### `<leaf>` (Terminal nodes)
- `name`: Item description
- `image`: Icon ID reference (from imageList)
- `link`: Relative path to diagram or info page

### Link Formats

**SVG Diagram Link:**
```xml
link="../svg/sp/wrapper.htm?file=SP0000019341.htm"
```
→ Extract diagram ID: `SP0000019341`

**HTML Info Link:**
```xml
link="../zinfo/HEMFB1214_MS45LS.htm"
```
→ Extract info ID: `HEMFB1214_MS45LS`

## SVGZ Files (Diagrams)

- **Format**: gzip-compressed SVG
- **Decompression**: `gunzip -c file.svgz`
- **Content**: Standard SVG with BMW-specific styling
- **Interactive Elements**: JavaScript links in `xlink:href`

### SVG Transformation Required

**From:**
```xml
<a xlink:href="javascript:locateTree('X531');">X531</a>
```

**To:**
```xml
<a xlink:href="javascript:search('X531');">X531</a>
```

Change `locateTree()` → `search()` for modern web compatibility.

## HTML Files (Info Pages)

- **Format**: XHTML 1.0 Transitional
- **Structure**: Well-formed with `<head>` and `<body>`
- **Content Sections**:
  - `<h1>`: Title
  - `<h2 class="chapter">`: Function, Diagnosis, Design, etc.
  - `<p>`: Descriptive text
- **Dependencies**: External CSS (`../styles/fb_screen.css`) and JS (`../scripts/tree.js`)

### Sample Structure
```html
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Oxygen Sensors and Catalytic Converter</title>
  <link rel="stylesheet" type="text/css" href="../styles/fb_screen.css"/>
  <script type="text/javascript" src="../scripts/tree.js"></script>
</head>
<body>
  <h1>Oxygen Sensors and Catalytic Converter</h1>
  <h2 class="chapter">Function</h2>
  <p>Content...</p>
</body>
</html>
```

### HTML Transformation Plan
1. Extract `<body>` content
2. Clean up BMW-specific scripts/styles
3. Convert to Markdown (optional)
4. Preserve semantic structure (headings, paragraphs)

## Shared Images (`zi_images/`)

- **Count**: 13,123 PNG files
- **Size**: 605MB total
- **Naming**: Various conventions (e.g., `GREO_E60_61_0034.png`, `B030001.png`)
- **Usage**: Referenced from HTML info pages and SVG diagrams

## Data Quality Observations

1. **Consistent XML structure** across all models
2. **Well-formed HTML** with proper DOCTYPE and namespaces
3. **Standardized link patterns** make parsing predictable
4. **Large file count** requires efficient processing pipeline
5. **Binary SVG** requires decompression step

## Processing Challenges

1. **Scale**: 44k+ files to process
2. **SVGZ decompression**: Must handle gzip format
3. **Link resolution**: Relative paths need normalization
4. **Image deduplication**: Shared images referenced across models
5. **UTF-8 encoding**: Ensure proper handling of special characters

## Next Steps

See [import-plan.md](./import-plan.md) for detailed transformation strategy.
