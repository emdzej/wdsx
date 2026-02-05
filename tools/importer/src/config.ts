/**
 * Configuration for WDS import tool
 */

export interface Config {
  sourcePath: string;
  outputPath: string;
  language: string;
  models: string[] | "all";
  parallel: number;
  dryRun: boolean;
  verbose: boolean;
}

export const defaultConfig: Config = {
  sourcePath: "/Users/emdzej/WDS/release",
  outputPath: "./data",
  language: "us",
  models: "all",
  parallel: 4,
  dryRun: false,
  verbose: false,
};

export const AVAILABLE_MODELS = [
  "e38new",
  "e38old",
  "e39new",
  "e39old",
  "e46",
  "e52",
  "e53",
  "e60e61",
  "e63e64",
  "e65e66",
  "e70",
  "e71",
  "e83",
  "e85",
  "e87",
  "e89",
  "e90",
  "f01",
];
