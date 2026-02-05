import { describe, expect, it } from "vitest";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  cleanHtml,
  convertHtmlToMarkdown,
  extractMetadata,
  extractSections,
  parseHtml,
  processHtmlFile,
} from "./html-processor.js";
import { JSDOM } from "jsdom";

const sampleHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "../../xhtml/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Test module, data transfer</title>
  <meta name="Author" content="BMW AG"/>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <script type="text/javascript">console.log('ignore');</script>
</head>
<body>
  <h1>Test module, data transfer</h1>
  <p>Before carrying out this test module<br/>make sure it works.</p>
  <h2 class="chapter">Preconditions</h2>
  <h2 class="chapter">Test procedure</h2>
</body>
</html>`;

describe("html-processor", () => {
  it("extracts metadata and sections", () => {
    const dom = new JSDOM(sampleHtml);
    const metadata = extractMetadata(dom.window.document);

    expect(metadata.title).toBe("Test module, data transfer");
    expect(metadata.heading).toBe("Test module, data transfer");
    expect(metadata.sections).toEqual(["Preconditions", "Test procedure"]);
    expect(metadata.meta.Author).toBe("BMW AG");
  });

  it("extracts sections directly", () => {
    const dom = new JSDOM(sampleHtml);
    const sections = extractSections(dom.window.document);
    expect(sections).toEqual(["Preconditions", "Test procedure"]);
  });

  it("cleans html by stripping scripts", () => {
    const cleaned = cleanHtml(sampleHtml);
    expect(cleaned).not.toContain("console.log");
    expect(cleaned).toContain("Test module, data transfer");
  });

  it("converts html to markdown", () => {
    const cleaned = cleanHtml(sampleHtml);
    const markdown = convertHtmlToMarkdown(cleaned);

    expect(markdown).toContain("# Test module, data transfer");
    expect(markdown).toContain("## Preconditions");
    expect(markdown).toContain("make sure it works.");
  });

  it("parses html end-to-end", () => {
    const result = parseHtml(sampleHtml);
    expect(result.metadata.sections.length).toBe(2);
    expect(result.markdown).toContain("# Test module, data transfer");
  });

  it("processes html file to markdown", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "wds-html-"));
    const inputPath = join(tempDir, "input.htm");
    const outputPath = join(tempDir, "output.md");

    await writeFile(inputPath, sampleHtml, "utf-8");
    const metadata = await processHtmlFile(inputPath, outputPath);

    const output = await readFile(outputPath, "utf-8");
    expect(output).toContain("# Test module, data transfer");
    expect(metadata.sections).toEqual(["Preconditions", "Test procedure"]);
  });
});
