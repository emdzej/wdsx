import { access, mkdir, cp } from "node:fs/promises";
import { join } from "node:path";

async function dirExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(path: string, dryRun?: boolean): Promise<void> {
  if (dryRun) return;
  await mkdir(path, { recursive: true });
}

async function copyDir(source: string, destination: string, dryRun?: boolean): Promise<void> {
  if (!(await dirExists(source))) return;
  await ensureDir(destination, dryRun);
  if (dryRun) return;
  await cp(source, destination, { recursive: true, force: true });
}

export async function copySharedImages(sourceRoot: string, outputRoot: string, dryRun?: boolean): Promise<void> {
  const sourceDir = join(sourceRoot, "images");
  const destinationDir = join(outputRoot, "images");
  await copyDir(sourceDir, destinationDir, dryRun);
}

export async function copyZiImages(sourceRoot: string, outputRoot: string, dryRun?: boolean): Promise<void> {
  const sourceDir = join(sourceRoot, "zi_images");
  const destinationDir = join(outputRoot, "zi_images");
  await copyDir(sourceDir, destinationDir, dryRun);
}

export async function copyModelImages(modelSourceDir: string, modelOutputDir: string, dryRun?: boolean): Promise<void> {
  await copyDir(modelSourceDir, modelOutputDir, dryRun);
}
