import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

/**
 * The touch icon iOS asks for.
 *
 * Safari ignores an SVG here, so the mark is rasterised at build time from the
 * same `icon.svg` the rest of the site uses. One drawing, two formats, no
 * second file to keep in step.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const alt = "elpideus";

export default async function AppleIcon() {
  const mark = await readFile(path.join(process.cwd(), "src/app/icon.svg"), "base64");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#05040a",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/svg+xml;base64,${mark}`} width={180} height={180} alt="" />
      </div>
    ),
    size,
  );
}
