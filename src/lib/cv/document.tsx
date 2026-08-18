/**
 * The printable curriculum.
 *
 * Deliberately plain: a single text column, standard PDF core fonts, no images,
 * no columns that split a sentence in two and no decorative glyphs. Applicant
 * tracking systems read this file far more often than humans do, and anything
 * clever here costs interviews. Visual interest comes from typography and
 * spacing alone, matching the grayscale look of the reference layout.
 */

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { CV, type CvEntry, type CvSection } from "./data";

/** Grayscale palette lifted from the reference document. */
const INK = {
  strong: "#111112",
  body: "#222224",
  muted: "#4a4a4d",
  rule: "#c8c8ca",
  page: "#ffffff",
} as const;

const styles = StyleSheet.create({
  page: {
    backgroundColor: INK.page,
    color: INK.body,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    lineHeight: 1.42,
    paddingTop: 38,
    paddingBottom: 42,
    paddingHorizontal: 45,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  name: {
    fontFamily: "Helvetica-Bold",
    fontSize: 24,
    color: INK.strong,
    lineHeight: 1.1,
    maxWidth: 300,
  },
  role: {
    fontSize: 9.5,
    color: INK.muted,
    marginTop: 4,
  },
  contact: {
    alignItems: "flex-end",
  },
  contactLine: {
    fontSize: 8.5,
    color: INK.muted,
  },

  sectionHeading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    letterSpacing: 2.2,
    color: INK.strong,
    marginTop: 14,
    marginBottom: 6,
  },
  rule: {
    borderBottomWidth: 0.6,
    borderBottomColor: INK.rule,
    marginBottom: 8,
  },

  entry: { marginBottom: 9 },
  entryHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  entryTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: INK.strong,
  },
  entryMeta: {
    fontSize: 8,
    color: INK.muted,
  },
  entrySubtitle: {
    fontSize: 8.5,
    color: INK.muted,
    marginTop: 1.5,
    marginBottom: 3,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bulletMark: {
    width: 9,
    color: INK.muted,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
  },

  paragraph: { fontSize: 9.3 },

  skillRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  skillLabel: {
    fontFamily: "Helvetica-Bold",
    width: 96,
    fontSize: 8.6,
    color: INK.strong,
  },
  skillItems: {
    flex: 1,
    fontSize: 9,
    color: INK.body,
  },

  footer: {
    position: "absolute",
    bottom: 22,
    left: 45,
    right: 45,
    fontSize: 7.5,
    color: INK.muted,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

function Heading({ children }: { children: string }) {
  return (
    <View wrap={false}>
      <Text style={styles.sectionHeading}>{children.toUpperCase()}</Text>
      <View style={styles.rule} />
    </View>
  );
}

function Entry({ entry }: { entry: CvEntry }) {
  return (
    <View style={styles.entry} wrap={false}>
      <View style={styles.entryHead}>
        <Text style={styles.entryTitle}>{entry.title}</Text>
        <Text style={styles.entryMeta}>{entry.meta}</Text>
      </View>
      {entry.subtitle ? <Text style={styles.entrySubtitle}>{entry.subtitle}</Text> : null}
      {entry.bullets.map((bullet) => (
        <View key={bullet.slice(0, 32)} style={styles.bulletRow}>
          <Text style={styles.bulletMark}>-</Text>
          <Text style={styles.bulletText}>{bullet}</Text>
        </View>
      ))}
    </View>
  );
}

function Section({ section }: { section: CvSection }) {
  return (
    <View>
      <Heading>{section.heading}</Heading>
      {section.entries.map((entry) => (
        <Entry key={entry.title} entry={entry} />
      ))}
    </View>
  );
}

/** The document itself. Rendered server side by the `/api/cv` route. */
export function CurriculumDocument({ generatedOn }: { generatedOn: string }) {
  return (
    <Document
      title={`${CV.name} - Curriculum Vitae`}
      author={CV.name}
      subject={CV.role}
      keywords="full stack developer, web developer, react, next.js, typescript, node, remote"
      creator="elpideus.com"
      producer="elpideus.com"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.name}>{CV.name}</Text>
            <Text style={styles.role}>{CV.role}</Text>
          </View>
          <View style={styles.contact}>
            {CV.contact.map((line) => (
              <Text key={line} style={styles.contactLine}>
                {line}
              </Text>
            ))}
          </View>
        </View>

        <Heading>Profile</Heading>
        <Text style={styles.paragraph}>{CV.profile}</Text>

        <Section section={CV.experience} />
        <Section section={CV.projects} />

        <Heading>Technical skills</Heading>
        {CV.skills.map((row) => (
          <View key={row.label} style={styles.skillRow} wrap={false}>
            <Text style={styles.skillLabel}>{row.label}</Text>
            <Text style={styles.skillItems}>{row.items.join(" · ")}</Text>
          </View>
        ))}

        <Section section={CV.education} />

        <Heading>Other</Heading>
        {CV.other.map((line) => (
          <View key={line.slice(0, 32)} style={styles.bulletRow}>
            <Text style={styles.bulletMark}>-</Text>
            <Text style={styles.bulletText}>{line}</Text>
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>{CV.name}</Text>
          <Text>Generated on {generatedOn} · elpideus.com</Text>
        </View>
      </Page>
    </Document>
  );
}
