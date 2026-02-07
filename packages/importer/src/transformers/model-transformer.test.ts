import { describe, expect, it } from "vitest";
import { mkdtemp, writeFile, readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { gzipSync } from "node:zlib";

import { transformModel } from "./model-transformer.js";

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
  <p>Details</p>
</body>
</html>`;

const sampleXml = `<?xml version="1.0"?>
<tree>
  <imageList>
    <image name="11" file="images/icon_schem.gif" />
  </imageList>
  <root name="E60" hidden="yes" id="root">
    <folder name="Drive">
      <leaf name="Diagram Leaf" image="11" link="../svg/sp/wrapper.htm?file=SP0001.htm" />
      <leaf name="Info Leaf" image="11" link="../zinfo/SINFO123.htm" />
    </folder>
  </root>
</tree>`;

describe("model-transformer", () => {
  it("builds model tree and processes diagram/info files", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "wds-model-"));
    const sourcePath = join(tempDir, "release");
    const outputPath = join(tempDir, "data");

    const modelDir = join(sourcePath, "us", "testmodel", "tree");
    const modelImagesDir = join(sourcePath, "us", "testmodel", "images");
    const svgDir = join(sourcePath, "us", "svg", "sp");
    const infoDir = join(sourcePath, "us", "zinfo");

    await mkdir(modelDir, { recursive: true });
    await mkdir(modelImagesDir, { recursive: true });
    await mkdir(svgDir, { recursive: true });
    await mkdir(infoDir, { recursive: true });

    await writeFile(join(modelDir, "tree.xml"), sampleXml, "utf-8");
    await writeFile(join(modelImagesDir, "icon_schem.gif"), "icon", "utf-8");
    await writeFile(join(svgDir, "SP0001.svgz"), gzipSync(sampleSvg));
    await writeFile(join(infoDir, "SINFO123.htm"), sampleHtml, "utf-8");

    const result = await transformModel({
      modelId: "testmodel",
      sourcePath,
      outputPath,
      language: "us",
    });

    const modelJson = await readFile(
      join(outputPath, "models", "testmodel", "tree.json"),
      "utf-8",
    );
    const diagramSvg = await readFile(join(outputPath, "diagrams", "SP0001.svg"), "utf-8");
    const infoMd = await readFile(join(outputPath, "info", "INFO123.md"), "utf-8");
    const copiedIcon = await readFile(
      join(outputPath, "models", "testmodel", "images", "icon_schem.gif"),
      "utf-8",
    );

    const parsedModel = JSON.parse(modelJson) as { model: string; icons: { file: string }[] };
    expect(parsedModel.model).toBe("E60");
    expect(parsedModel.icons[0]?.file).toBe("/models/testmodel/images/icon_schem.gif");
    expect(diagramSvg).toContain("javascript:search('X13020');");
    expect(infoMd).toContain("# Info Title");
    expect(copiedIcon).toBe("icon");
    expect(result.diagramCount).toBe(1);
    expect(result.infoCount).toBe(1);
  });
});
