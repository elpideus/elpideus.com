/**
 * The readable twin of a star.
 *
 * The map is a canvas, and a canvas is a blank page to a crawler, an AI
 * overview or a model that has been asked who Stefan is. Every route therefore
 * also ships the section's real copy as plain, server rendered HTML: same
 * words, same links, same order as the panel a visitor sees.
 *
 * It is clipped to a single pixel rather than removed, so it costs nothing on
 * screen, and it is `inert` and `aria-hidden` because the overlay panels are
 * already the accessible copy of this text: without that, a screen reader would
 * read the whole site twice and the keyboard would tab through links nobody can
 * see.
 *
 * Nothing here is written by hand. It all comes from `lib/content`, so the
 * document and the panels cannot drift apart.
 */

import { CHANNEL } from "@/lib/content/studio";
import { CONTACT, JOURNAL } from "@/lib/content/contact";
import { CRAFT_JOURNEY, ENGINEERING_JOURNEY, type JourneyEntry } from "@/lib/content/journey";
import { KIT } from "@/lib/content/kit";
import { PASSIONS } from "@/lib/content/passions";
import { PROFILE, ageAt, yearsCoding } from "@/lib/content/profile";
import { PROJECTS, PROJECT_BY_SLUG, type Project } from "@/lib/content/projects";
import { SOCIALS } from "@/lib/content/links";
import { JOURNEY, getStar, satellitesOf } from "@/lib/graph/nodes";
import { PanelKind, StarId } from "@/lib/graph/types";
import { starGraph } from "@/lib/seo/jsonLd";
import { starPageCopy } from "@/lib/seo/pages";
import { starPath } from "@/lib/seo/routes";

function JourneyList({ entries, title }: { entries: readonly JourneyEntry[]; title: string }) {
  return (
    <section>
      <h2>{title}</h2>
      {entries.map((entry) => (
        <article key={`${entry.year}-${entry.title}`}>
          <h3>
            {entry.year}: {entry.title}
          </h3>
          <p>{entry.body}</p>
          <p>
            {entry.focus}. {entry.tags.join(", ")}.
          </p>
          {entry.href ? <a href={entry.href}>{entry.title}</a> : null}
        </article>
      ))}
    </section>
  );
}

function ProjectBody({ project }: { project: Project }) {
  return (
    <>
      <p>{project.summary}</p>
      {project.body.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <p>Status: {project.status}.</p>
      <p>Period: {project.period}.</p>
      {project.client ? <p>Client: {project.client}.</p> : null}
      <p>Stack: {project.stack.join(", ")}.</p>
      <ul>
        {project.links.map((link) => (
          <li key={link.href}>
            <a href={link.href}>
              {link.kind}: {project.name}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

function PanelBody({ kind, payload }: { kind: PanelKind; payload?: string }) {
  switch (kind) {
    case PanelKind.Origin:
      return (
        <>
          <p>{PROFILE.lede}</p>
          {PROFILE.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <ul>
            <li>Name: {PROFILE.name}</li>
            <li>Known as: {PROFILE.handle}</li>
            <li>Role: {PROFILE.role}</li>
            <li>Age: {ageAt()}</li>
            <li>Writing code for: {yearsCoding()} years</li>
            <li>
              Location: {PROFILE.location}. {PROFILE.locationNote}
            </li>
            <li>{CONTACT.availability}</li>
          </ul>
        </>
      );

    case PanelKind.About:
      return (
        <>
          {PROFILE.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {PROFILE.principles.map((principle) => (
            <section key={principle.title}>
              <h3>{principle.title}</h3>
              <p>{principle.body}</p>
            </section>
          ))}
          <ul>
            {PROFILE.facts.map((fact) => (
              <li key={fact.label}>
                {fact.label}: {fact.value}
              </li>
            ))}
          </ul>
          <section>
            <h3>{PROFILE.learning.title}</h3>
            <p>{PROFILE.learning.body}</p>
          </section>
        </>
      );

    case PanelKind.Journey:
      return (
        <>
          <JourneyList entries={ENGINEERING_JOURNEY} title="Engineering" />
          <JourneyList entries={CRAFT_JOURNEY} title="Video and craft" />
        </>
      );

    case PanelKind.Projects:
      return (
        <>
          {PROJECTS.map((project) => {
            const star = satellitesOf(StarId.Betelgeuse).find(
              (satellite) => satellite.ref === project.slug,
            );
            return (
              <article key={project.slug}>
                <h3>
                  <a href={star ? starPath(star.id) : `/projects/${project.slug}`}>
                    {project.name}
                  </a>
                </h3>
                <ProjectBody project={project} />
              </article>
            );
          })}
        </>
      );

    case PanelKind.Project: {
      const project = payload ? PROJECT_BY_SLUG.get(payload) : undefined;
      if (!project) return null;
      return <ProjectBody project={project} />;
    }

    case PanelKind.Studio:
      return (
        <>
          {CHANNEL.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p>Channel opened on {CHANNEL.opened}.</p>
          <p>Tools: {CHANNEL.tools.join(", ")}.</p>
          <a href={CHANNEL.href}>{CHANNEL.name} on YouTube</a>
        </>
      );

    case PanelKind.Toolkit:
      return (
        <>
          {KIT.map((section) => (
            <section key={section.group}>
              <h3>{section.group}</h3>
              <p>{section.note}</p>
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </>
      );

    case PanelKind.Passions:
      return (
        <>
          {PASSIONS.map((passion) => (
            <section key={passion.kind}>
              <h3>{passion.title}</h3>
              {passion.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <p>{passion.notes.join(", ")}.</p>
              {passion.href ? <a href={passion.href}>{passion.hrefLabel ?? passion.href}</a> : null}
            </section>
          ))}
        </>
      );

    case PanelKind.Blog:
      return (
        <>
          <p>{JOURNAL.badge}</p>
          {JOURNAL.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </>
      );

    case PanelKind.Contact:
      return (
        <>
          {CONTACT.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p>{CONTACT.availability}</p>
          <p>{CONTACT.responseTime}</p>
          <ul>
            {SOCIALS.map((link) => (
              <li key={link.href}>
                <a href={link.href} rel="me">
                  {link.label}: {link.handle}
                </a>
              </li>
            ))}
          </ul>
        </>
      );
  }
}

/** Links to every other star, so the map has a crawlable link graph. */
function StarIndex({ current }: { current: StarId }) {
  const satellites = satellitesOf(StarId.Betelgeuse);
  return (
    <nav aria-label="Sections">
      <h2>Sections</h2>
      <ul>
        {[...JOURNEY, ...satellites.map((star) => star.id)]
          .filter((id) => id !== current)
          .map((id) => {
            const star = getStar(id);
            return (
              <li key={id}>
                <a href={starPath(id)}>
                  {star.section}: {star.tagline}
                </a>
              </li>
            );
          })}
      </ul>
    </nav>
  );
}

export function StarDocument({ id }: { id: StarId }) {
  const star = getStar(id);
  const copy = starPageCopy(id);

  return (
    <>
      <script
        type="application/ld+json"
        // Structured data is data, not markup: it is stringified once on the
        // server and never touched on the client.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(starGraph(id)) }}
      />
      <article className="sr-only" inert aria-hidden="true">
        <h1>{copy.heading}</h1>
        <p>{copy.summary}</p>
        <PanelBody kind={star.panel} payload={star.ref} />
        <StarIndex current={id} />
        <p>
          <a href="/api/cv">Download the curriculum of {PROFILE.name} as a PDF</a>
        </p>
      </article>
    </>
  );
}
