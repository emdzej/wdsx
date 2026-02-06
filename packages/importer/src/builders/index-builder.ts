import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ModelTransformResult } from "../transformers/model-transformer.js";
import type {
  ModelsIndex,
  ModelMeta,
  DiagramsIndex,
  DiagramMeta,
  InfoIndex,
  InfoPageMeta,
  ModelReference,
  ModelTree,
  TreeNode,
} from "@emdzej/wds-core";

const DEFAULT_VERSION = "1.0.0";

export interface IndexBuildOptions {
  version?: string;
  generated?: string;
  sourceLanguage?: string;
}

export interface IndexWriteOptions extends IndexBuildOptions {
  outputPath: string;
  dryRun?: boolean;
}

function resolveGenerated(options?: IndexBuildOptions): string {
  return options?.generated ?? new Date().toISOString();
}

function resolveVersion(options?: IndexBuildOptions): string {
  return options?.version ?? DEFAULT_VERSION;
}

function traverseTree(node: TreeNode, visitor: (node: TreeNode) => void): void {
  visitor(node);
  if (node.type === "folder" && node.children) {
    node.children.forEach((child) => traverseTree(child, visitor));
  }
}

function collectReferences(models: ModelTree[], key: "diagram" | "info"): Map<string, Map<string, number>> {
  const map = new Map<string, Map<string, number>>();

  for (const model of models) {
    traverseTree(model.tree, (node) => {
      if (node.type !== "leaf") return;
      const id = key === "diagram" ? node.diagram : node.info;
      if (!id) return;
      const perModel = map.get(id) ?? new Map<string, number>();
      const current = perModel.get(model.modelId) ?? 0;
      perModel.set(model.modelId, current + 1);
      map.set(id, perModel);
    });
  }

  return map;
}

function toModelReferences(map: Map<string, number>): ModelReference[] {
  return Array.from(map.entries())
    .map(([model, occurrences]) => ({ model, occurrences }))
    .sort((a, b) => a.model.localeCompare(b.model));
}

export function buildModelsIndex(
  results: ModelTransformResult[],
  options?: IndexBuildOptions,
): ModelsIndex {
  const models: ModelMeta[] = results
    .map((result) => ({
      id: result.model.modelId,
      name: result.model.model,
      file: `${result.model.modelId}.json`,
      treeSize: result.treeSize,
      diagramCount: result.diagramCount,
      infoCount: result.infoCount,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const sourceLanguage =
    options?.sourceLanguage ?? results[0]?.model.language ?? "unknown";

  return {
    version: resolveVersion(options),
    generated: resolveGenerated(options),
    sourceLanguage,
    models,
  };
}

export function buildDiagramsIndex(models: ModelTree[], options?: IndexBuildOptions): DiagramsIndex {
  const references = collectReferences(models, "diagram");

  const diagrams: DiagramMeta[] = Array.from(references.entries())
    .map(([id, perModel]) => ({
      id,
      file: `${id}.svg`,
      referencedBy: toModelReferences(perModel),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    version: resolveVersion(options),
    generated: resolveGenerated(options),
    diagrams,
  };
}

export function buildInfoIndex(models: ModelTree[], options?: IndexBuildOptions): InfoIndex {
  const references = collectReferences(models, "info");

  const pages: InfoPageMeta[] = Array.from(references.entries())
    .map(([id, perModel]) => ({
      id,
      title: id,
      htmlFile: `${id}.html`,
      mdFile: `${id}.md`,
      sections: [],
      referencedBy: toModelReferences(perModel),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    version: resolveVersion(options),
    generated: resolveGenerated(options),
    pages,
  };
}

async function ensureDir(path: string, dryRun?: boolean): Promise<void> {
  if (dryRun) return;
  await mkdir(path, { recursive: true });
}

async function writeIndex(path: string, data: unknown, dryRun?: boolean): Promise<void> {
  if (dryRun) return;
  await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
}

export async function writeIndexes(
  results: ModelTransformResult[],
  options: IndexWriteOptions,
): Promise<{ models: ModelsIndex; diagrams: DiagramsIndex; info: InfoIndex }> {
  const modelsIndex = buildModelsIndex(results, options);
  const modelTrees = results.map((result) => result.model);
  const diagramsIndex = buildDiagramsIndex(modelTrees, options);
  const infoIndex = buildInfoIndex(modelTrees, options);

  const modelsDir = join(options.outputPath, "models");
  const diagramsDir = join(options.outputPath, "diagrams");
  const infoDir = join(options.outputPath, "info");

  await ensureDir(modelsDir, options.dryRun);
  await ensureDir(diagramsDir, options.dryRun);
  await ensureDir(infoDir, options.dryRun);

  await writeIndex(join(modelsDir, "index.json"), modelsIndex, options.dryRun);
  await writeIndex(join(diagramsDir, "index.json"), diagramsIndex, options.dryRun);
  await writeIndex(join(infoDir, "index.json"), infoIndex, options.dryRun);

  return { models: modelsIndex, diagrams: diagramsIndex, info: infoIndex };
}
