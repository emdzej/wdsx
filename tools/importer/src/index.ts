#!/usr/bin/env node
/**
 * WDS Import Tool - CLI Entry Point
 *
 * Usage:
 *   npm run import                     # Import all models
 *   npm run import -- --models e60,e46 # Import specific models
 *   npm run import -- --dry-run        # Dry run (validate only)
 */

import { Command } from "commander";
import chalk from "chalk";
import PQueue from "p-queue";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { defaultConfig, type Config, AVAILABLE_MODELS } from "./config.js";
import { transformModel, type ModelTransformResult } from "./transformers/model-transformer.js";
import { writeIndexes } from "./builders/index-builder.js";

interface ImportCliOptions {
  models?: string;
  source?: string;
  output?: string;
  language?: string;
  parallel?: number;
  dryRun?: boolean;
  verbose?: boolean;
}

function parseModelList(value: string): string[] {
  return value
    .split(",")
    .map((model) => model.trim())
    .filter((model) => model.length > 0);
}

function resolveModels(config: Config): string[] {
  if (config.models === "all") return AVAILABLE_MODELS;
  return config.models;
}

function validateModels(models: string[]): void {
  const invalid = models.filter((m) => !AVAILABLE_MODELS.includes(m));
  if (invalid.length > 0) {
    throw new Error(`Invalid models: ${invalid.join(", ")}. Available: ${AVAILABLE_MODELS.join(", ")}`);
  }
}

function printHeader(config: Config, models: string[]): void {
  console.log(chalk.cyan.bold("\n🚀 WDS Import Tool"));
  console.log(chalk.cyan("=================="));
  console.log(`Source:   ${config.sourcePath}`);
  console.log(`Output:   ${config.outputPath}`);
  console.log(`Language: ${config.language}`);
  console.log(`Models:   ${models.join(", ")}`);
  console.log(`Parallel: ${config.parallel}`);
  console.log(`Dry run:  ${config.dryRun ? "Yes" : "No"}`);
  console.log("");
}

async function runImport(options: ImportCliOptions): Promise<void> {
  const config: Config = { ...defaultConfig };
  if (options.models) config.models = parseModelList(options.models);
  if (options.source) config.sourcePath = options.source;
  if (options.output) config.outputPath = options.output;
  if (options.language) config.language = options.language;
  if (typeof options.parallel === "number") config.parallel = options.parallel;
  if (options.dryRun) config.dryRun = true;
  if (options.verbose) config.verbose = true;

  const models = resolveModels(config);
  validateModels(models);

  printHeader(config, models);

  const results: ModelTransformResult[] = [];
  const failures: { model: string; error: Error }[] = [];
  const queue = new PQueue({ concurrency: config.parallel });

  let completed = 0;
  const total = models.length;
  const startedAt = Date.now();

  for (const modelId of models) {
    queue.add(async () => {
      const label = chalk.blue(`[${modelId}]`);
      console.log(`${label} Starting import...`);
      try {
        const result = await transformModel({
          modelId,
          sourcePath: config.sourcePath,
          outputPath: config.outputPath,
          language: config.language,
          dryRun: config.dryRun,
        });
        results.push(result);
        console.log(
          chalk.green(
            `${label} Done. nodes=${result.treeSize} diagrams=${result.diagramCount} info=${result.infoCount}`,
          ),
        );
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        failures.push({ model: modelId, error: err });
        console.error(chalk.red(`${label} Failed: ${err.message}`));
        if (config.verbose && err.stack) {
          console.error(chalk.gray(err.stack));
        }
      } finally {
        completed += 1;
        console.log(chalk.gray(`Progress: ${completed}/${total}`));
      }
    });
  }

  await queue.onIdle();

  if (results.length > 0) {
    console.log(chalk.cyan("\n📦 Building indexes..."));
    await writeIndexes(results, {
      outputPath: config.outputPath,
      dryRun: config.dryRun,
      sourceLanguage: config.language,
    });
  } else {
    console.log(chalk.yellow("\n⚠️  No models imported - skipping index generation."));
  }

  const durationSec = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(chalk.cyan("\nSummary"));
  console.log(chalk.cyan("-------"));
  console.log(`Models requested: ${total}`);
  console.log(`Succeeded:        ${results.length}`);
  console.log(`Failed:           ${failures.length}`);
  console.log(`Duration:         ${durationSec}s`);

  if (failures.length > 0) {
    console.log(chalk.red("\nFailures:"));
    failures.forEach(({ model, error }) => {
      console.log(`- ${model}: ${error.message}`);
    });
    process.exitCode = 1;
  }
}

async function runStats(options: { output?: string }): Promise<void> {
  const outputPath = options.output ?? defaultConfig.outputPath;
  const modelsIndexPath = join(outputPath, "models", "index.json");
  const diagramsIndexPath = join(outputPath, "diagrams", "index.json");
  const infoIndexPath = join(outputPath, "info", "index.json");

  try {
    const [modelsRaw, diagramsRaw, infoRaw] = await Promise.all([
      readFile(modelsIndexPath, "utf-8"),
      readFile(diagramsIndexPath, "utf-8"),
      readFile(infoIndexPath, "utf-8"),
    ]);

    const models = JSON.parse(modelsRaw) as { models?: unknown[] };
    const diagrams = JSON.parse(diagramsRaw) as { diagrams?: unknown[] };
    const info = JSON.parse(infoRaw) as { pages?: unknown[] };

    console.log(chalk.cyan("\n📊 WDS Import Stats"));
    console.log(chalk.cyan("-------------------"));
    console.log(`Models:   ${models.models?.length ?? 0}`);
    console.log(`Diagrams: ${diagrams.diagrams?.length ?? 0}`);
    console.log(`Info:     ${info.pages?.length ?? 0}`);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(chalk.red(`Failed to read indexes from ${outputPath}: ${err.message}`));
    process.exitCode = 1;
  }
}

const program = new Command();
program
  .name("wds-importer")
  .description("Convert legacy BMW WDS data to modern JSON format")
  .version("0.1.0");

program
  .command("import")
  .description("Run full import for all models or selected ones")
  .option("--models <list>", "Comma-separated model IDs (e.g., e60,e46)")
  .option("--source <path>", "Source data path", defaultConfig.sourcePath)
  .option("--output <path>", "Output directory", defaultConfig.outputPath)
  .option("--language <code>", "Source language", defaultConfig.language)
  .option("--parallel <n>", "Parallel workers", (value) => parseInt(value, 10), defaultConfig.parallel)
  .option("--dry-run", "Validate without writing files", false)
  .option("--verbose, -v", "Verbose logging", false)
  .action((options: ImportCliOptions) => runImport(options));

program
  .command("validate")
  .description("Validate source data without writing files")
  .option("--models <list>", "Comma-separated model IDs (e.g., e60,e46)")
  .option("--source <path>", "Source data path", defaultConfig.sourcePath)
  .option("--output <path>", "Output directory", defaultConfig.outputPath)
  .option("--language <code>", "Source language", defaultConfig.language)
  .option("--parallel <n>", "Parallel workers", (value) => parseInt(value, 10), defaultConfig.parallel)
  .option("--verbose, -v", "Verbose logging", false)
  .action((options: ImportCliOptions) => runImport({ ...options, dryRun: true }));

program
  .command("stats")
  .description("Show summary stats from generated indexes")
  .option("--output <path>", "Output directory", defaultConfig.outputPath)
  .action((options: { output?: string }) => runStats(options));

program.parseAsync(process.argv).catch((error) => {
  console.error(chalk.red("❌ Fatal error:"), error);
  process.exit(1);
});
