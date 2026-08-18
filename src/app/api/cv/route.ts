/**
 * Generates the curriculum as a PDF on demand.
 *
 * Rendering on the server keeps the client bundle free of a PDF engine, and
 * generating rather than serving a static file means the document can never
 * drift from the content in the repository.
 */

import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { CurriculumDocument } from "@/lib/cv/document";

export const runtime = "nodejs";
/** The document only changes when the code does, so cache it for a day. */
export const revalidate = 86400;

const FILE_NAME = "Stefan_Narcis_Cucoranu_CV.pdf";

export async function GET() {
  const generatedOn = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date());

  try {
    const buffer = await renderToBuffer(createElement(CurriculumDocument, { generatedOn }) as unknown as ReactElement<DocumentProps>);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${FILE_NAME}"`,
        "cache-control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error("[cv] failed to render the document:", error);
    return NextResponse.json({ error: "cv unavailable" }, { status: 500 });
  }
}
