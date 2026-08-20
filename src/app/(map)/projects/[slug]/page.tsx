import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StarDocument } from "@/components/seo/StarDocument";
import { PROJECTS } from "@/lib/content/projects";
import { starByRef } from "@/lib/graph/nodes";
import { StarDepth } from "@/lib/graph/types";
import { starMetadata } from "@/lib/seo/metadata";

/**
 * A project satellite as a document.
 *
 * Satellites sit under `/projects` because that is genuinely where they sit on
 * the map, and a search engine reads the same hierarchy out of the path.
 */
export function generateStaticParams(): { slug: string }[] {
  return PROJECTS.map((project) => ({ slug: project.slug }));
}

/** The satellite a slug names, or nothing if the slug is not a project. */
function satelliteFor(slug: string) {
  const star = starByRef(slug);
  return star && star.depth === StarDepth.Satellite ? star : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const star = satelliteFor(slug);
  if (!star) return {};
  return starMetadata(star.id);
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const star = satelliteFor(slug);
  if (!star) notFound();
  return <StarDocument id={star.id} />;
}
