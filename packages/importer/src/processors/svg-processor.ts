import { readFile, writeFile } from "node:fs/promises";
import { gunzip } from "node:zlib";
import { promisify } from "node:util";

const gunzipAsync = promisify(gunzip);

const LOCATE_TREE_REGEX = /xlink:href="javascript:locateTree\('([^']+)'\);"/g;

export function transformXlinkHref(svg: string): string {
  return svg.replace(LOCATE_TREE_REGEX, "xlink:href=\"javascript:search('$1');\"");
}

export async function processSvgzBuffer(buffer: Buffer): Promise<string> {
  const decompressed = await gunzipAsync(buffer);
  const svg = decompressed.toString("utf-8");
  return transformXlinkHref(svg);
}

export async function processSvgzFile(inputPath: string, outputPath: string): Promise<void> {
  const source = await readFile(inputPath);
  const svg = await processSvgzBuffer(source);
  await writeFile(outputPath, svg, "utf-8");
}
