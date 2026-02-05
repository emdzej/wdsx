import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { copySharedImages, copyZiImages, copyModelImages } from "./image-processor.js";

describe("image-processor", () => {
  it("copies shared images into output/images", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "wds-images-"));
    const sourceRoot = join(tempDir, "release", "us");
    const outputRoot = join(tempDir, "data");

    await mkdir(join(sourceRoot, "images"), { recursive: true });
    await writeFile(join(sourceRoot, "images", "shared.png"), "shared", "utf-8");

    await copySharedImages(sourceRoot, outputRoot);

    const copied = await readFile(join(outputRoot, "images", "shared.png"), "utf-8");
    expect(copied).toBe("shared");
  });

  it("copies zi_images into output/zi_images", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "wds-zi-"));
    const sourceRoot = join(tempDir, "release");
    const outputRoot = join(tempDir, "data");

    await mkdir(join(sourceRoot, "zi_images"), { recursive: true });
    await writeFile(join(sourceRoot, "zi_images", "G_123.png"), "zi", "utf-8");

    await copyZiImages(sourceRoot, outputRoot);

    const copied = await readFile(join(outputRoot, "zi_images", "G_123.png"), "utf-8");
    expect(copied).toBe("zi");
  });

  it("copies model images into model output folder", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "wds-model-images-"));
    const sourceDir = join(tempDir, "release", "us", "testmodel", "images");
    const outputDir = join(tempDir, "data", "models", "testmodel", "images");

    await mkdir(sourceDir, { recursive: true });
    await writeFile(join(sourceDir, "icon.gif"), "icon", "utf-8");

    await copyModelImages(sourceDir, outputDir);

    const copied = await readFile(join(outputDir, "icon.gif"), "utf-8");
    expect(copied).toBe("icon");
  });
});
