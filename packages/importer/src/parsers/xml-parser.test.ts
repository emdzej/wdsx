import { describe, expect, it } from "vitest";
import {
  extractDiagramId,
  extractInfoId,
  parseLink,
  parseTreeXml,
} from "./xml-parser.js";

describe("xml-parser", () => {
  it("parses tree xml with images, folders, and leaves", () => {
    const xml = `<?xml version="1.0"?>
    <tree>
      <imageList>
        <image name="11" file="images/icon_schem.gif" />
        <image name="13" file="images/icon_comploc.gif" />
      </imageList>
      <root name="E60" hidden="yes" id="root">
        <folder name="Drive">
          <leaf name="Diagram Leaf" image="11" link="../svg/sp/wrapper.htm?file=SP0000011761.htm" />
          <leaf name="Info Leaf" image="13" link="../zinfo/SCT0100FB1214_CAN.htm" />
        </folder>
      </root>
    </tree>`;

    const tree = parseTreeXml(xml);

    expect(tree.root.$.name).toBe("E60");
    expect(tree.imageList.image).toHaveLength(2);
    expect(tree.imageList.image[0].$.name).toBe("11");
    expect(tree.imageList.image[0].$.file).toBe("images/icon_schem.gif");

    const folder = tree.root.folder?.[0];
    expect(folder?.$.name).toBe("Drive");
    expect(folder?.leaf).toHaveLength(2);
    expect(folder?.leaf?.[0].$.link).toContain("SP0000011761");
    expect(folder?.leaf?.[1].$.link).toContain("SCT0100FB1214_CAN");
  });

  it("extracts diagram id from svg wrapper link", () => {
    expect(
      extractDiagramId("../svg/sp/wrapper.htm?file=SP0000011761.htm"),
    ).toBe("SP0000011761");
  });

  it("extracts info id from html link and strips leading S", () => {
    expect(extractInfoId("../zinfo/SCT0100FB1214_CAN.htm")).toBe(
      "CT0100FB1214_CAN",
    );
    expect(extractInfoId("../zinfo/HEMFB1214_MS45LS.htm")).toBe(
      "HEMFB1214_MS45LS",
    );
  });

  it("parses link to diagram or info", () => {
    expect(
      parseLink("../svg/sp/wrapper.htm?file=SP0000011761.htm"),
    ).toEqual({
      type: "diagram",
      id: "SP0000011761",
      originalLink: "../svg/sp/wrapper.htm?file=SP0000011761.htm",
    });

    expect(parseLink("../zinfo/HEMFB1214_MS45LS.htm")).toEqual({
      type: "info",
      id: "HEMFB1214_MS45LS",
      originalLink: "../zinfo/HEMFB1214_MS45LS.htm",
    });
  });
});
