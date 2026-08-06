import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import type { ResumeData, ResumeExperience } from "@/lib/resume/types"

const MARGIN = 54
const styles = StyleSheet.create({
  page: {
    paddingTop: MARGIN,
    paddingBottom: MARGIN,
    paddingHorizontal: MARGIN,
    fontFamily: "Times-Roman",
    fontSize: 10,
    lineHeight: 1.35,
    color: "#000",
  },
  header: {
    textAlign: "center",
    marginBottom: 14,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Times-Bold",
  },
  contact: {
    fontSize: 9,
    marginTop: 4,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 2,
    marginBottom: 5,
  },
  entry: {
    marginBottom: 7,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  entryTitle: {
    fontSize: 10.5,
    fontWeight: "bold",
    fontFamily: "Times-Bold",
    flex: 1,
  },
  entryDate: {
    fontSize: 9,
    marginLeft: 8,
    textAlign: "right",
  },
  entrySub: {
    fontSize: 9.5,
    marginTop: 1,
  },
  bullets: {
    marginTop: 2,
    paddingLeft: 14,
  },
  bullet: {
    fontSize: 9.5,
    marginBottom: 1.5,
  },
  skillsRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  skillsCategory: {
    width: 150,
    fontSize: 9.5,
    fontWeight: "bold",
    fontFamily: "Times-Bold",
  },
  skillsItems: {
    flex: 1,
    fontSize: 9.5,
  },
})

function BulletSection({ title, entries }: { title: string; entries: ResumeExperience[] }) {
  if (entries.length === 0) return null
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {entries.map((exp, i) => (
        <View key={i} style={styles.entry} wrap={false}>
          <View style={styles.entryHeader}>
            <Text style={styles.entryTitle}>{exp.title}</Text>
            {exp.date ? <Text style={styles.entryDate}>{exp.date}</Text> : null}
          </View>
          {exp.bullets.length > 0 && (
            <View style={styles.bullets}>
              {exp.bullets.map((b, j) => (
                <Text key={j} style={styles.bullet}>• {b}</Text>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  )
}

export default function ResumePdf({ data }: { data: ResumeData }) {
  const contactParts: string[] = []
  if (data.personalInfo.phone) contactParts.push(data.personalInfo.phone)
  if (data.personalInfo.email) contactParts.push(data.personalInfo.email)
  if (data.personalInfo.github) contactParts.push(data.personalInfo.github)
  if (data.personalInfo.linkedin) contactParts.push(data.personalInfo.linkedin)
  if (data.personalInfo.portfolio) contactParts.push(data.personalInfo.portfolio)

  return (
    <Document
      title="resume"
      author={data.personalInfo.name}
      subject="Resume"
      producer="til.ly"
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header} wrap={false}>
          <Text style={styles.name}>{data.personalInfo.name}</Text>
          {contactParts.length > 0 && (
            <Text style={styles.contact}>{contactParts.join(" · ")}</Text>
          )}
        </View>

        {data.summary ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.bullet}>{data.summary}</Text>
          </View>
        ) : null}

        {data.education.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Education</Text>
            {data.education.map((edu, i) => (
              <View key={i} style={styles.entry} wrap={false}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{edu.school}</Text>
                  {edu.date ? <Text style={styles.entryDate}>{edu.date}</Text> : null}
                </View>
                {edu.degree ? <Text style={styles.entrySub}>{edu.degree}</Text> : null}
                {edu.bullets.length > 0 && (
                  <View style={styles.bullets}>
                    {edu.bullets.map((b, j) => (
                      <Text key={j} style={styles.bullet}>• {b}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <BulletSection title="Experience" entries={data.experience} />

        {data.skills.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Skills</Text>
            {data.skills.map((cat, i) => (
              <View key={i} style={styles.skillsRow}>
                <Text style={styles.skillsCategory}>{cat.category}</Text>
                <Text style={styles.skillsItems}>{cat.items.join(", ")}</Text>
              </View>
            ))}
          </View>
        )}

        {data.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {data.projects.map((proj, i) => (
              <View key={i} style={styles.entry} wrap={false}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{proj.name}</Text>
                  {proj.tech ? <Text style={styles.entryDate}>{proj.tech}</Text> : null}
                </View>
                {proj.description ? (
                  <Text style={styles.entrySub}>{proj.description}</Text>
                ) : null}
                {proj.highlights.length > 0 && (
                  <View style={styles.bullets}>
                    {proj.highlights.map((h, j) => (
                      <Text key={j} style={styles.bullet}>• {h}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {data.certifications.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            <View style={styles.bullets}>
              {data.certifications.map((cert, i) => (
                <Text key={i} style={styles.bullet}>• {cert}</Text>
              ))}
            </View>
          </View>
        )}

        <BulletSection title="Co-Curricular Activities" entries={data.activities} />
        <BulletSection title="Volunteer Experience" entries={data.volunteer} />
      </Page>
    </Document>
  )
}
