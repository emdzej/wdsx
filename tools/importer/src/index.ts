#!/usr/bin/env node
/**
 * WDS Import Tool - CLI Entry Point
 * 
 * Usage:
 *   npm run import                    # Import all models
 *   npm run import -- --models e60,e46  # Import specific models
 *   npm run import:dry                # Dry run (validate only)
 */

import { defaultConfig, type Config, AVAILABLE_MODELS } from "./config.js";

async function main() {
  const args = process.argv.slice(2);
  
  const config: Config = { ...defaultConfig };
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === "--dry-run") {
      config.dryRun = true;
    } else if (arg === "--verbose" || arg === "-v") {
      config.verbose = true;
    } else if (arg === "--models" && i + 1 < args.length) {
      const models = args[++i].split(",").map((m) => m.trim());
      config.models = models;
    } else if (arg === "--source" && i + 1 < args.length) {
      config.sourcePath = args[++i];
    } else if (arg === "--output" && i + 1 < args.length) {
      config.outputPath = args[++i];
    } else if (arg === "--parallel" && i + 1 < args.length) {
      config.parallel = parseInt(args[++i], 10);
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }
  
  // Validate configuration
  if (config.models !== "all") {
    const invalid = config.models.filter((m) => !AVAILABLE_MODELS.includes(m));
    if (invalid.length > 0) {
      console.error(`❌ Invalid models: ${invalid.join(", ")}`);
      console.error(`   Available models: ${AVAILABLE_MODELS.join(", ")}`);
      process.exit(1);
    }
  }
  
  console.log("🚀 WDS Import Tool");
  console.log("==================");
  console.log(`Source: ${config.sourcePath}`);
  console.log(`Output: ${config.outputPath}`);
  console.log(`Models: ${config.models === "all" ? "all" : config.models.join(", ")}`);
  console.log(`Dry run: ${config.dryRun ? "Yes" : "No"}`);
  console.log("");
  
  // TODO: Implement actual import
  console.log("⚠️  Import functionality not yet implemented");
  console.log("   See docs/analysis/import-plan.md for implementation plan");
}

function printHelp() {
  console.log(`
WDS Import Tool - Convert legacy BMW WDS data to modern JSON format

Usage:
  npm run import [options]

Options:
  --models <list>       Comma-separated model IDs (e.g., e60,e46)
  --source <path>       Source data path (default: /Users/emdzej/WDS/release)
  --output <path>       Output directory (default: ./data)
  --parallel <n>        Parallel workers (default: 4)
  --dry-run             Validate without writing files
  --verbose, -v         Verbose logging
  --help, -h            Show this help

Examples:
  npm run import                        # Import all models
  npm run import -- --models e60,e46    # Import specific models
  npm run import:dry                    # Dry run mode
  npm run import -- --verbose           # Verbose output

Available Models:
  ${AVAILABLE_MODELS.join(", ")}
`);
}

// Run
main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
