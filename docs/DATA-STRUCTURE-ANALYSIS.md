# WDS Data Structure Analysis

**Date**: 2026-02-05  
**Analyst**: AI Assistant  
**Source**: `/Users/emdzej/WDS/release`

## Overview

The WDS data consists of a hierarchical structure of wiring diagrams and documentation for various BMW vehicle models (E-series and F-series).

### Data Volume

- **XML tree files**: 14 files
- **SVGZ diagrams**: ~23,926 files
- **HTML info pages**: ~20,296 files
- **Total size** (US language): 265 MB
- **Shared images**: PNG files in `zi_images/`

### Directory Structure

```
release/
├── zi_images/          # Shared PNG diagrams referenced from HTML
│   └── *.png          # Component location diagrams
├── xhtml/             # DTD and schema files
└── us/                # US English language pack
    ├── svg/sp/        # SVGZ wiring diagrams (gzip compressed SVG)
    ├── zinfo/         # HTML documentation pages
    ├── images/        # UI icons and graphics
    ├── scripts/       # JavaScript files (tree.js, etc.)
    ├── styles/        # CSS stylesheets
    └── e*/            # Vehicle model folders (e60e61, e90, etc.)
        └── tree/      # XML tree structure files
            └── *.xml
```

### Vehicle Models Covered

- E38 (old & new)
- E39 (old & new)
- E46
- E52
- E53
- E60/E61
- E63/E64
- E65/E66
- E70
- E71
- E83
- E85
- E87
- E89
- E90
- F01

## XML Tree Structure

### File Format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<tree>
  <imageList>
    <image name="11" file="images/icon_schem.gif"/>
    <image name="13" file="images/icon_comploc.gif"/>
    <!-- ... more icon definitions ... -->
  </imageList>
  
  <root name="E60" hidden="yes" id="root">
    <folder name="Complete vehicle">
      <folder name="Drive">
        <folder name="Motor Electronics (DME Digital engine electronics MS45)">
          <leaf name="Oxygen sensors before catalytic converter" 
                image="11" 
                link="../svg/sp/wrapper.htm?file=SP0000019341.htm"/>
          <leaf name="Oxygen Sensors and Catalytic Converter" 
                image="25" 
                link="../zinfo/HEMFB1214_MS45LS.htm"/>
        </folder>
      </folder>
    </folder>
  </root>
</tree>
```

### Element Types

#### `<imageList>`
Maps icon IDs to image files for use in the tree UI.

**Structure**:
- `<image name="ID" file="path/to/icon.gif"/>`

#### `<root>`
Root container for entire tree.

**Attributes**:
- `name` - Vehicle model identifier (e.g., "E60")
- `hidden` - UI visibility flag
- `id` - Unique identifier

#### `<folder>`
Hierarchical category in the navigation tree.

**Attributes**:
- `name` - Display name (e.g., "Motor Electronics")

**Children**: Can contain more `<folder>` or `<leaf>` elements.

#### `<leaf>`
Terminal node that links to actual content.

**Attributes**:
- `name` - Display text
- `image` - Icon ID (references `<imageList>`)
- `link` - Relative path to content (SVG or HTML)

### Link Types

#### SVG Diagram Links
```xml
link="../svg/sp/wrapper.htm?file=SP0000019341.htm"
```

**Pattern**: `../svg/sp/wrapper.htm?file=SPXXXXXXXXXX.htm`

**Target Conversion**:
```json
{
  "diagram": "SP0000019341"
}
```

**Actual File**: `release/us/svg/sp/SP0000019341.svgz`

#### HTML Info Links
```xml
link="../zinfo/HEMFB1214_MS45LS.htm"
```

**Pattern**: `../zinfo/FILENAME.htm`

**Target Conversion**:
```json
{
  "info": "HEMFB1214_MS45LS"
}
```

**Actual File**: `release/us/zinfo/HEMFB1214_MS45LS.htm`

## SVG Diagram Format (SVGZ)

### File Properties

- **Compression**: GZIP compressed SVG
- **Extension**: `.svgz`
- **Namespace**: SVG 1.1 with XLink
- **Encoding**: UTF-8

### Structure

```xml
<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet href="../../styles/svg.css" type="text/css"?>
<svg id="svgid" 
     xmlns="http://www.w3.org/2000/svg" 
     xml:space="preserve" 
     viewBox="37 607 1958 2359" 
     preserveAspectRatio="xMinYMin meet" 
     width="100%" 
     height="100%" 
     xmlns:xlink="http://www.w3.org/1999/xlink">
  <title>Schaltplan Viewer - Copyright BMW AG 2004</title>
  
  <style type="text/css">
    /* Embedded styles for paths, text, etc. */
  </style>
  
  <g id="gid">
    <!-- Drawing elements: paths, text, links -->
    <text class="t2">
      <tspan x="1360" y="1662">
        <a xlink:href="javascript:locateTree('X531');">X531</a>
      </tspan>
    </text>
  </g>
</svg>
```

### Interactive Elements

**Current (Legacy)**:
```xml
<a xlink:href="javascript:locateTree('X13020');">X13020</a>
```

**Required Transformation**:
```xml
<a xlink:href="javascript:search('X13020');">X13020</a>
```

**Function**:
- `locateTree()` - Legacy function to find component in tree
- `search()` - New function for modern viewer

### Content Types

1. **Paths**: Wire routing, component outlines
2. **Text**: Component labels, wire identifiers
3. **Links**: Interactive component references
4. **Styles**: Colors, line widths, fonts

## HTML Information Pages

### File Properties

- **Format**: XHTML 1.0 Transitional
- **Encoding**: UTF-8
- **Namespace**: W3C XHTML

### Structure

```html
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" 
          "../../xhtml/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>X60211, X60212</title>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <meta name="Author" content="BMW AG"/>
  <meta name="DiagnosisDocument" content="InstallationLocation"/>
  <link rel="stylesheet" type="text/css" href="../styles/eo_screen.css"/>
  <script type="text/javascript" language="JavaScript" src="../scripts/tree.js"></script>
</head>
<body onload="hideButton()">
  <h1>X60211, X60212</h1>
  
  <div class="graphic">
    <img src="../../zi_images/G_183097.png" border="1" alt="G_183097" />
  </div>
  <p class="graphicsubheading">in water box right (battery removed)</p>
  
  <table class="legendtable" border="1" cellpadding="5" cellspacing="0">
    <tr>
      <td class="legendname">X60211</td>
      <td class="legendexplanation">Component connector (23-pin, black), ...</td>
    </tr>
  </table>
</body>
</html>
```

### Content Types

1. **Component Locations**: Diagrams showing physical locations
2. **Pin Tables**: Connector pinouts and wire colors
3. **Test Procedures**: Diagnostic steps
4. **Technical Specifications**: Values, part numbers

### External References

- **Images**: `../../zi_images/*.png` - Shared diagram images
- **Styles**: `../styles/eo_screen.css` - Layout and formatting
- **Scripts**: `../scripts/tree.js` - Navigation functions

## Shared Resources

### `zi_images/` Directory

Contains PNG images referenced by multiple HTML pages.

**Examples**:
- `G_183097.png` - Component location diagram
- `B020001.png` - Schematic symbols
- `69060429.png` - Photos

**References**: From HTML `<img>` tags using relative paths.

### Icon Files

Located in `images/` within each language folder.

**Types**:
- `icon_schem.gif` - Schematic diagram icon
- `icon_comploc.gif` - Component location icon
- `icon_connector.gif` - Connector icon
- `icon_pin.gif` - Pin assignment icon
- `icon_document.gif` - Documentation icon

## Data Relationships

```
XML Tree File
    ├─> Folders (categories)
    │   └─> Leaves (content items)
    │       ├─> SVG Diagram (.svgz)
    │       │   └─> Interactive links to components
    │       └─> HTML Info Page (.htm)
    │           └─> Images from zi_images/
    └─> Image List (icons)
```

## Transformation Requirements

### 1. XML Tree → JSON

**Input**: `e60_wds_us_files.xml`  
**Output**: Structured JSON tree

```json
{
  "model": "E60",
  "images": {
    "11": "images/icon_schem.gif",
    "13": "images/icon_comploc.gif"
  },
  "tree": {
    "name": "Complete vehicle",
    "children": [
      {
        "name": "Drive",
        "children": [...]
      }
    ],
    "leaves": [
      {
        "name": "Oxygen sensors before catalytic converter",
        "icon": "11",
        "diagram": "SP0000019341"
      },
      {
        "name": "Oxygen Sensors and Catalytic Converter",
        "icon": "25",
        "info": "HEMFB1214_MS45LS"
      }
    ]
  }
}
```

### 2. SVGZ → SVG

- Decompress GZIP
- Transform `locateTree()` → `search()`
- Optionally optimize/clean SVG
- Store as `.svg` or re-compress

### 3. HTML → Markdown

- Extract `<body>` content
- Convert tables to markdown
- Extract image references
- Preserve semantic structure
- Store metadata (title, type, etc.)

### 4. Link Resolution

All relative paths need resolution:
- `../svg/sp/wrapper.htm?file=SP0000019341.htm` → `diagrams/SP0000019341.svg`
- `../zinfo/HEMFB1214_MS45LS.htm` → `info/HEMFB1214_MS45LS.md`
- `../../zi_images/G_183097.png` → `images/G_183097.png`

## Challenges & Considerations

### 1. File Naming

- Some files have inconsistent naming patterns
- Need to preserve unique identifiers
- Case sensitivity matters on some systems

### 2. Encoding

- UTF-8 encoding throughout
- Some special characters (German umlauts, etc.)
- HTML entities need proper handling

### 3. Legacy JavaScript

- `wrapper.htm` file required by original system
- `locateTree()` function hardcoded in SVGs
- Need modern equivalents

### 4. Data Volume

- 44,000+ files to process
- 265 MB per language
- Need efficient batch processing
- Consider incremental processing

### 5. Metadata

XML files don't contain:
- Creation dates
- Version info
- Model years
- Part numbers

This info might be embedded in HTML content.

## Recommendations

1. **Preserve Original IDs**: Keep SP/HEMFB/etc. identifiers
2. **Flat Storage**: Store processed files in categorized folders
3. **Index First**: Build complete index before transformation
4. **Validate**: Check all links resolve before committing
5. **Metadata Extraction**: Parse HTML for additional metadata
6. **Incremental**: Process one model at a time for testing

## Next Steps

1. Design target JSON schema
2. Create TypeScript data models
3. Build XML parser
4. Implement SVGZ processor
5. Create HTML to Markdown converter
6. Build link resolver
7. Test on single model (E60)
8. Scale to all models
