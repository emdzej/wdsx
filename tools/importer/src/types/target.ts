/**
 * Target JSON schema types for WDS data
 */

// ============================================================================
// Models
// ============================================================================

export interface ModelsIndex {
  version: string;
  generated: string;
  sourceLanguage: string;
  models: ModelMeta[];
}

export interface ModelMeta {
  id: string;
  name: string;
  file: string;
  treeSize: number;
  diagramCount: number;
  infoCount: number;
}

export interface ModelTree {
  model: string;
  modelId: string;
  language: string;
  generated: string;
  icons: IconDefinition[];
  tree: TreeNode;
}

export interface IconDefinition {
  id: string;
  file: string;
  description?: string;
}

export interface TreeNode {
  type: "folder" | "leaf";
  name: string;
  id: string;
  
  // Folder-specific
  children?: TreeNode[];
  
  // Leaf-specific
  icon?: string;
  diagram?: string;
  info?: string;
}

// ============================================================================
// Diagrams
// ============================================================================

export interface DiagramsIndex {
  version: string;
  generated: string;
  diagrams: DiagramMeta[];
}

export interface DiagramMeta {
  id: string;
  file: string;
  title?: string;
  viewBox?: string;
  referencedBy: ModelReference[];
}

export interface SvgMetadata {
  title?: string;
  viewBox?: string;
}

// ============================================================================
// Info Pages
// ============================================================================

export interface InfoIndex {
  version: string;
  generated: string;
  pages: InfoPageMeta[];
}

export interface InfoPageMeta {
  id: string;
  title: string;
  htmlFile: string;
  mdFile?: string;
  sections: string[];
  referencedBy: ModelReference[];
}

// ============================================================================
// Images
// ============================================================================

export interface ImagesIndex {
  version: string;
  generated: string;
  totalSize: number;
  images: ImageMeta[];
}

export interface ImageMeta {
  id: string;
  file: string;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
  referencedBy: string[];
}

// ============================================================================
// Common
// ============================================================================

export interface ModelReference {
  model: string;
  occurrences: number;
}

// ============================================================================
// Processing State
// ============================================================================

export interface ProcessingState {
  totalModels: number;
  processedModels: number;
  totalDiagrams: number;
  processedDiagrams: number;
  totalInfoPages: number;
  processedInfoPages: number;
  errors: ProcessingError[];
}

export interface ProcessingError {
  type: "xml" | "svg" | "html" | "validation" | "io";
  file: string;
  message: string;
  timestamp: string;
}
