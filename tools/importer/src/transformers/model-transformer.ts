import { mkdir, readdir, access, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { parseModelTree, parseLink } from "../parsers/xml-parser.js";
import { processSvgzFile } from "../processors/svg-processor.js";
import { processHtmlFile } from "../processors/html-processor.js";
import type { SourceFolder, SourceLeaf, SourceRoot } from "../types/source.js";
import type { ModelTree, TreeNode, IconDefinition } from "../types/target.js";

export interface ModelTransformOptions {
  modelId: string;
  sourcePath: string;
  outputPath: string;
  language: string;
  dryRun?: boolean;
}

export interface ModelTransformResult {
  model: ModelTree;
  treeSize: number;
  diagramCount: number;
  infoCount: number;
}

interface TransformContext {
  sourcePath: string;
  outputPath: string;
  language: string;
  dryRun: boolean;
  diagramIds: Set<string>;
  infoIds: Set<string>;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function resolveModelXmlPath(modelPath: string): Promise<string> {
  const treeDir = join(modelPath, "tree");
  const entries = await readdir(treeDir, { withFileTypes: true });
  const xml = entries.find((entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".xml");
  if (!xml) {
    throw new Error(`Missing tree XML in ${treeDir}`);
  }
  return join(treeDir, xml.name);
}

async function resolveInfoPath(context: TransformContext, infoId: string): Promise<string | null> {
  const base = join(context.sourcePath, context.language, "zinfo");
  const direct = join(base, `${infoId}.htm`);
  if (await fileExists(direct)) return direct;
  const withPrefix = join(base, `S${infoId}.htm`);
  if (await fileExists(withPrefix)) return withPrefix;
  return null;
}

async function ensureDir(path: string, dryRun: boolean): Promise<void> {
  if (dryRun) return;
  await mkdir(path, { recursive: true });
}

async function processDiagram(context: TransformContext, diagramId: string): Promise<void> {
  const inputPath = join(context.sourcePath, context.language, "svg", "sp", `${diagramId}.svgz`);
  const outputDir = join(context.outputPath, "diagrams");
  const outputPath = join(outputDir, `${diagramId}.svg`);

  if (!(await fileExists(inputPath))) return;
  await ensureDir(outputDir, context.dryRun);
  if (context.dryRun) return;
  await processSvgzFile(inputPath, outputPath);
}

async function processInfo(context: TransformContext, infoId: string): Promise<void> {
  const inputPath = await resolveInfoPath(context, infoId);
  if (!inputPath) return;
  const outputDir = join(context.outputPath, "info");
  const outputPath = join(outputDir, `${infoId}.md`);

  await ensureDir(outputDir, context.dryRun);
  if (context.dryRun) return;
  await processHtmlFile(inputPath, outputPath);
}

async function buildLeafNode(leaf: SourceLeaf, id: string, context: TransformContext): Promise<TreeNode> {
  const node: TreeNode = {
    type: "leaf",
    name: leaf.$.name,
    id,
    icon: leaf.$.image,
  };

  const link = parseLink(leaf.$.link);
  if (link.type === "diagram") {
    node.diagram = link.id;
    context.diagramIds.add(link.id);
    await processDiagram(context, link.id);
  } else if (link.type === "info") {
    node.info = link.id;
    context.infoIds.add(link.id);
    await processInfo(context, link.id);
  }

  return node;
}

async function buildFolderNode(folder: SourceFolder, id: string, context: TransformContext): Promise<TreeNode> {
  const children: TreeNode[] = [];
  const subFolders = folder.folder ?? [];
  const leaves = folder.leaf ?? [];

  for (let i = 0; i < subFolders.length; i++) {
    children.push(await buildFolderNode(subFolders[i], `${id}-${i}`, context));
  }

  for (let i = 0; i < leaves.length; i++) {
    const leafId = `${id}-${subFolders.length + i}`;
    children.push(await buildLeafNode(leaves[i], leafId, context));
  }

  return {
    type: "folder",
    name: folder.$.name,
    id,
    children,
  };
}

async function buildRootNode(root: SourceRoot, context: TransformContext): Promise<TreeNode> {
  const folders = root.folder ?? [];
  const leaves = root.leaf ?? [];

  const children: TreeNode[] = [];
  for (let i = 0; i < folders.length; i++) {
    children.push(await buildFolderNode(folders[i], `root-${i}`, context));
  }
  for (let i = 0; i < leaves.length; i++) {
    children.push(await buildLeafNode(leaves[i], `root-${folders.length + i}`, context));
  }

  return {
    type: "folder",
    name: root.$.name,
    id: "root",
    children,
  };
}

function countNodes(node: TreeNode): number {
  if (node.type === "leaf") return 1;
  return 1 + (node.children?.reduce((sum, child) => sum + countNodes(child), 0) ?? 0);
}

function mapIcons(imageList: { image: { $: { name: string; file: string } }[] }): IconDefinition[] {
  return imageList.image.map((image) => ({
    id: image.$.name,
    file: image.$.file,
  }));
}

export async function transformModel(options: ModelTransformOptions): Promise<ModelTransformResult> {
  const dryRun = options.dryRun ?? false;
  const modelPath = join(options.sourcePath, options.language, options.modelId);
  const xmlPath = await resolveModelXmlPath(modelPath);

  const tree = await parseModelTree(xmlPath);
  const context: TransformContext = {
    sourcePath: options.sourcePath,
    outputPath: options.outputPath,
    language: options.language,
    dryRun,
    diagramIds: new Set<string>(),
    infoIds: new Set<string>(),
  };

  const rootNode = await buildRootNode(tree.root, context);

  const modelTree: ModelTree = {
    model: tree.root.$.name,
    modelId: options.modelId,
    language: options.language,
    generated: new Date().toISOString(),
    icons: mapIcons(tree.imageList),
    tree: rootNode,
  };

  const outputDir = join(options.outputPath, "models");
  const outputPath = join(outputDir, `${options.modelId}.json`);

  await ensureDir(outputDir, dryRun);
  if (!dryRun) {
    await writeFile(outputPath, JSON.stringify(modelTree, null, 2), "utf-8");
  }

  return {
    model: modelTree,
    treeSize: countNodes(rootNode),
    diagramCount: context.diagramIds.size,
    infoCount: context.infoIds.size,
  };
}
