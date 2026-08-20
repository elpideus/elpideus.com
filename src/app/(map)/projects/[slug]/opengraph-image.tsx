import { PROJECTS } from "@/lib/content/projects";
import { starByRef } from "@/lib/graph/nodes";
import { StarId } from "@/lib/graph/types";
import { OG_CONTENT_TYPE, OG_SIZE, starCard } from "@/lib/seo/ogCard";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Project by Stefan Narcis Cucoranu";

export function generateStaticParams(): { slug: string }[] {
  return PROJECTS.map((project) => ({ slug: project.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const star = starByRef(slug);
  return starCard(star ? star.id : StarId.Betelgeuse);
}
