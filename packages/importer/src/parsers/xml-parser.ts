import { readFile } from "node:fs/promises";
import { XMLParser } from "fast-xml-parser";
import type {
  ParsedLink,
  SourceFolder,
  SourceImage,
  SourceLeaf,
  SourceRoot,
  SourceTree,
} from "../types/source.js";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  allowBooleanAttributes: true,
  parseTagValue: false,
  trimValues: false,
});

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function getAttr<T extends Record<string, unknown>>(node: T | undefined, key: string): string | undefined {
  if (!node) return undefined;
  const direct = node[key as keyof T];
  if (typeof direct === "string") return direct;
  const prefixed = node[`@_${key}` as keyof T];
  if (typeof prefixed === "string") return prefixed;
  return undefined;
}

function mapImage(raw: Record<string, unknown>): SourceImage {
  const name = getAttr(raw, "name");
  const file = getAttr(raw, "file");
  if (!name || !file) {
    throw new Error(`Invalid <image> entry: ${JSON.stringify(raw)}`);
  }
  return {
    $: {
      name,
      file,
    },
  };
}

function mapLeaf(raw: Record<string, unknown>): SourceLeaf {
  const name = getAttr(raw, "name");
  if (!name) {
    throw new Error(`Invalid <leaf> entry: ${JSON.stringify(raw)}`);
  }
  return {
    $: {
      name,
      image: getAttr(raw, "image"),
      link: getAttr(raw, "link"),
    },
  };
}

function mapFolder(raw: Record<string, unknown>): SourceFolder {
  const name = getAttr(raw, "name");
  if (!name) {
    throw new Error(`Invalid <folder> entry: ${JSON.stringify(raw)}`);
  }
  const folder: SourceFolder = {
    $: {
      name,
    },
  };

  const rawFolders = toArray(raw.folder as Record<string, unknown> | Record<string, unknown>[] | undefined);
  const rawLeaves = toArray(raw.leaf as Record<string, unknown> | Record<string, unknown>[] | undefined);

  if (rawFolders.length) {
    folder.folder = rawFolders.map(mapFolder);
  }

  if (rawLeaves.length) {
    folder.leaf = rawLeaves.map(mapLeaf);
  }

  return folder;
}

function mapRoot(raw: Record<string, unknown>): SourceRoot {
  const name = getAttr(raw, "name");
  if (!name) {
    throw new Error(`Invalid <root> entry: ${JSON.stringify(raw)}`);
  }
  const root: SourceRoot = {
    $: {
      name,
      hidden: getAttr(raw, "hidden"),
      id: getAttr(raw, "id"),
    },
  };

  const rawFolders = toArray(raw.folder as Record<string, unknown> | Record<string, unknown>[] | undefined);
  const rawLeaves = toArray(raw.leaf as Record<string, unknown> | Record<string, unknown>[] | undefined);

  if (rawFolders.length) {
    root.folder = rawFolders.map(mapFolder);
  }

  if (rawLeaves.length) {
    root.leaf = rawLeaves.map(mapLeaf);
  }

  return root;
}

export function parseTreeXml(xml: string): SourceTree {
  const parsed = parser.parse(xml) as { tree?: Record<string, unknown> };

  if (!parsed?.tree) {
    throw new Error("Invalid XML: missing <tree> root element");
  }

  const tree = parsed.tree;
  const imageListNode = tree.imageList as Record<string, unknown> | undefined;
  const rootNode = tree.root as Record<string, unknown> | undefined;

  if (!imageListNode || !rootNode) {
    throw new Error("Invalid XML: missing <imageList> or <root> element");
  }

  const rawImages = toArray(imageListNode.image as Record<string, unknown> | Record<string, unknown>[] | undefined);

  return {
    imageList: {
      image: rawImages.map(mapImage),
    },
    root: mapRoot(rootNode),
  };
}

export async function parseModelTree(xmlPath: string): Promise<SourceTree> {
  const xml = await readFile(xmlPath, "utf-8");
  return parseTreeXml(xml);
}

export function extractDiagramId(link: string): string | null {
  if (!link) return null;
  const match = /file=([^&]+)\.htm/i.exec(link);
  if (!match) return null;
  return match[1] ?? null;
}

export function extractInfoId(link: string): string | null {
  if (!link) return null;
  const match = /zinfo\/([^/?#]+)\.htm/i.exec(link);
  if (!match) return null;
  const rawId = match[1];
  if (rawId.startsWith("S") && rawId.length > 1) {
    return rawId.slice(1);
  }
  return rawId;
}

export function parseLink(link?: string): ParsedLink {
  if (!link) {
    return { type: "unknown", id: "", originalLink: "" };
  }

  const diagram = extractDiagramId(link);
  if (diagram) {
    return { type: "diagram", id: diagram, originalLink: link };
  }

  const info = extractInfoId(link);
  if (info) {
    return { type: "info", id: info, originalLink: link };
  }

  return { type: "unknown", id: "", originalLink: link };
}
