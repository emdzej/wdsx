import { describe, expect, it } from "vitest";
import { gzipSync } from "node:zlib";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { processSvgzFile, processSvgzBuffer, transformXlinkHref } from "./svg-processor.js";

const sampleSvg = `<?xml version="1.0"?>
<svg xmlns:xlink="http://www.w3.org/1999/xlink">
  <a xlink:href="javascript:locateTree('X13020');">Click</a>
</svg>`;

describe("svg-processor", () => {
  it("transforms locateTree links to search links", () => {
    const transformed = transformXlinkHref(sampleSvg);
    expect(transformed).toContain("xlink:href=\"javascript:search('X13020');\"");
  });

  it("processes a gzipped buffer", async () => {
    const gzipped = gzipSync(sampleSvg);
    const output = await processSvgzBuffer(gzipped);
    expect(output).toContain("javascript:search('X13020');");
  });

  it("processes an svgz file to svg", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "wds-svg-"));
    const inputPath = join(tempDir, "input.svgz");
    const outputPath = join(tempDir, "output.svg");

    await writeFile(inputPath, gzipSync(sampleSvg));
    await processSvgzFile(inputPath, outputPath);

    const output = await readFile(outputPath, "utf-8");
    expect(output).toContain("javascript:search('X13020');");
  });
});
