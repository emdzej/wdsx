import { describe, expect, it } from "vitest";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { gzipSync } from "node:zlib";

import { transformModel } from "../transformers/model-transformer.js";
import { buildModelsIndex, buildDiagramsIndex, buildInfoIndex } from "./index-builder.js";

const sampleSvg = `<?xml version="1.0"?>
<svg xmlns:xlink="http://www.w3.org/1999/xlink">
  <a xlink:href="javascript:locateTree('X13020');">Click</a>
</svg>`;

const sampleHtml = `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Info Title</title>
</head>
<body>
  <h1>Info Title</h1>
  <h2 class="chapter">Function</h2>
  <h2 class="chapter">Diagnosis</h2>
</body>
</html>`;

function buildXml(modelName: string, diagramIds: string[], infoIds: string[]): string {
  const diagramLeaves = diagramIds
    .map(
      (id) =>
        `      <leaf name="Diagram ${id}" image="11" link="../svg/sp/wrapper.htm?file=${id}.htm" />`,
    )
    .join("\n");
  const infoLeaves = infoIds
    .map((id) => `      <leaf name="Info ${id}" image="11" link="../zinfo/S${id}.htm" />`)
    .join("\n");

  return `<?xml version="1.0"?>
<tree>
  <imageList>
    <image name="11" file="images/icon_schem.gif" />
  </imageList>
  <root name="${modelName}" hidden="yes" id="root">
    <folder name="System">
${diagramLeaves}
${infoLeaves}
    </folder>
  </root>
</tree>`;
}

describe("index-builder", () => {
  it("builds model, diagram, and info indexes with cross-references", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "wds-index-"));
    const sourcePath = join(tempDir, "release");
    const outputPath = join(tempDir, "data");

    const svgDir = join(sourcePath, "us", "svg", "sp");
    const infoDir = join(sourcePath, "us", "zinfo");
    await mkdir(svgDir, { recursive: true });
    await mkdir(infoDir, { recursive: true });

    const modelA = join(sourcePath, "us", "m1", "tree");
    const modelB = join(sourcePath, "us", "m2", "tree");
    await mkdir(modelA, { recursive: true });
    await mkdir(modelB, { recursive: true });

    await writeFile(join(modelA, "tree.xml"), buildXml("Model One", ["SP0001"], ["INFO1"]), "utf-8");
    await writeFile(
      join(modelB, "tree.xml"),
      buildXml("Model Two", ["SP0001", "SP0001", "SP0002"], ["INFO1"]),
      "utf-8",
    );

    await writeFile(join(svgDir, "SP0001.svgz"), gzipSync(sampleSvg));
    await writeFile(join(svgDir, "SP0002.svgz"), gzipSync(sampleSvg));
    await writeFile(join(infoDir, "SINFO1.htm"), sampleHtml, "utf-8");

    const resultA = await transformModel({
      modelId: "m1",
      sourcePath,
      outputPath,
      language: "us",
    });
    const resultB = await transformModel({
      modelId: "m2",
      sourcePath,
      outputPath,
      language: "us",
    });

    const modelsIndex = buildModelsIndex([resultA, resultB]);
    const diagramsIndex = buildDiagramsIndex([resultA.model, resultB.model]);
    const infoIndex = buildInfoIndex([resultA.model, resultB.model]);

    expect(modelsIndex.models).toHaveLength(2);
    expect(modelsIndex.models[0].id).toBe("m1");

    const sp0001 = diagramsIndex.diagrams.find((diagram) => diagram.id === "SP0001");
    expect(sp0001).toBeTruthy();
    expect(sp0001?.referencedBy).toEqual([
      { model: "m1", occurrences: 1 },
      { model: "m2", occurrences: 2 },
    ]);

    const info1 = infoIndex.pages.find((page) => page.id === "INFO1");
    expect(info1?.referencedBy).toEqual([
      { model: "m1", occurrences: 1 },
      { model: "m2", occurrences: 1 },
    ]);
  });
});
