/**
 * Target JSON schema types for WDS data
 */

// ============================================================================
// Models
// ============================================================================

export type ModelsIndex = {
  version: string;
  generated: string;
  sourceLanguage: string;
  models: ModelMeta[];
};

export type ModelMeta = {
  id: string;
  name: string;
  file: string;
  treeSize: number;
  diagramCount: number;
  infoCount: number;
};

export type ModelTree = {
  model: string;
  modelId: string;
  language: string;
  generated: string;
  icons: IconDefinition[];
  tree: TreeNode;
};

export type IconDefinition = {
  id: string;
  file: string;
  description?: string;
};

export type TreeNode = {
  type: "folder" | "leaf";
  name: string;
  id: string;
  children?: TreeNode[];
  icon?: string;
  diagram?: string;
  info?: string;
};

// ============================================================================
// Diagrams
// ============================================================================

export type DiagramsIndex = {
  version: string;
  generated: string;
  diagrams: DiagramMeta[];
};

export type DiagramMeta = {
  id: string;
  file: string;
  title?: string;
  viewBox?: string;
  referencedBy: ModelReference[];
};

export type SvgMetadata = {
  title?: string;
  viewBox?: string;
};

// ============================================================================
// Info Pages
// ============================================================================

export type InfoIndex = {
  version: string;
  generated: string;
  pages: InfoPageMeta[];
};

export type InfoPageMeta = {
  id: string;
  title: string;
  htmlFile: string;
  mdFile?: string;
  sections: string[];
  referencedBy: ModelReference[];
};

// ============================================================================
// Images
// ============================================================================

export type ImagesIndex = {
  version: string;
  generated: string;
  totalSize: number;
  images: ImageMeta[];
};

export type ImageMeta = {
  id: string;
  file: string;
  size: number;
  dimensions?: {
    width: number;
    height: number;
  };
  referencedBy: string[];
};

// ============================================================================
// Common
// ============================================================================

export type ModelReference = {
  model: string;
  occurrences: number;
};


// ============================================================================
// Components
// ============================================================================

export type ComponentsIndex = {
  version: string;
  generated: string;
  components: ComponentMeta[];
};

export type ComponentMeta = {
  id: string;
  title?: string;
  description?: string;
  diagrams?: string[];
  occurrences?: ComponentOccurrence[];
};

export type ComponentOccurrence = {
  diagramId?: string;
  diagram?: string;
  model?: string;
  occurrences?: number;
};

// ============================================================================
// Processing State
// ============================================================================

export type ProcessingState = {
  totalModels: number;
  processedModels: number;
  totalDiagrams: number;
  processedDiagrams: number;
  totalInfoPages: number;
  processedInfoPages: number;
  errors: ProcessingError[];
};

export type ProcessingError = {
  type: "xml" | "svg" | "html" | "validation" | "io";
  file: string;
  message: string;
  timestamp: string;
};
