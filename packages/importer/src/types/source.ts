/**
 * Source data types (legacy WDS format)
 */

// ============================================================================
// XML Tree Structure
// ============================================================================

export interface SourceTree {
  imageList: SourceImageList;
  root: SourceRoot;
}

export interface SourceImageList {
  image: SourceImage[];
}

export interface SourceImage {
  $: {
    name: string;
    file: string;
  };
}

export interface SourceRoot {
  $: {
    name: string;
    hidden?: string;
    id?: string;
  };
  folder?: SourceFolder[];
  leaf?: SourceLeaf[];
}

export interface SourceFolder {
  $: {
    name: string;
  };
  folder?: SourceFolder[];
  leaf?: SourceLeaf[];
}

export interface SourceLeaf {
  $: {
    name: string;
    image?: string;
    link?: string;
  };
}

// ============================================================================
// Link Parsing
// ============================================================================

export interface ParsedLink {
  type: "diagram" | "info" | "unknown";
  id: string;
  originalLink: string;
}

// ============================================================================
// File Metadata
// ============================================================================

export interface SourceFile {
  path: string;
  size: number;
  exists: boolean;
}

export interface ModelFiles {
  modelId: string;
  xmlFile: SourceFile;
  diagramFiles: SourceFile[];
  infoFiles: SourceFile[];
}
