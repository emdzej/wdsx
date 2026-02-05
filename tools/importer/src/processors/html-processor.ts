import { readFile, writeFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import TurndownService from "turndown";

export interface HtmlMetadata {
  title?: string;
  heading?: string;
  sections: string[];
  images: string[];
  meta: Record<string, string>;
}

function normalizeText(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length ? trimmed : undefined;
}

export function extractSections(document: Document): string[] {
  return Array.from(document.querySelectorAll("h2.chapter"))
    .map((node) => normalizeText(node.textContent))
    .filter((section): section is string => Boolean(section));
}

function normalizeImageSrc(value: string): string {
  const normalized = value.replace(/\\/g, "/");
  const match = normalized.match(/(?:^|\/)zi_images\/(.+)$/i);
  if (match) {
    return `/zi_images/${match[1]}`;
  }
  return normalized;
}

export function rewriteImageSources(document: Document): string[] {
  const images: string[] = [];
  const nodes = Array.from(document.querySelectorAll("img"));
  for (const node of nodes) {
    const src = node.getAttribute("src");
    if (!src) continue;
    const rewritten = normalizeImageSrc(src);
    if (rewritten !== src) {
      node.setAttribute("src", rewritten);
    }
    images.push(rewritten);
  }
  return images;
}

export function extractMetadata(document: Document): HtmlMetadata {
  const meta: Record<string, string> = {};
  for (const tag of Array.from(document.querySelectorAll("meta"))) {
    const key = tag.getAttribute("name") ?? tag.getAttribute("http-equiv");
    const value = tag.getAttribute("content");
    if (key && value) {
      meta[key] = value;
    }
  }

  return {
    title: normalizeText(document.querySelector("title")?.textContent),
    heading: normalizeText(document.querySelector("h1")?.textContent),
    sections: extractSections(document),
    images: rewriteImageSources(document),
    meta,
  };
}

function cleanDocument(document: Document): string {
  const body = document.body;
  if (!body) return "";

  body.querySelectorAll("script, style, link, meta, noscript").forEach((node) => node.remove());

  return body.innerHTML.trim();
}

export function cleanHtml(html: string): string {
  const dom = new JSDOM(html);
  const { document } = dom.window;
  return cleanDocument(document);
}

export function convertHtmlToMarkdown(html: string): string {
  const turndownService = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
  });

  turndownService.addRule("lineBreak", {
    filter: "br",
    replacement: () => "\n",
  });

  const markdown = turndownService.turndown(html);
  return markdown.replace(/\n{3,}/g, "\n\n").trim();
}

export function parseHtml(html: string): { metadata: HtmlMetadata; bodyHtml: string; markdown: string } {
  const dom = new JSDOM(html);
  const { document } = dom.window;

  const metadata = extractMetadata(document);
  const bodyHtml = cleanDocument(document);
  const markdown = convertHtmlToMarkdown(bodyHtml);

  return { metadata, bodyHtml, markdown };
}

export async function processHtmlFile(inputPath: string, outputPath: string): Promise<HtmlMetadata> {
  const html = await readFile(inputPath, "utf-8");
  const { markdown, metadata } = parseHtml(html);
  await writeFile(outputPath, markdown, "utf-8");
  return metadata;
}
