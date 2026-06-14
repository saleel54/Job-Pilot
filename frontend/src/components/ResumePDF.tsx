import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    color: '#334155',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e1b4b',
    textTransform: 'uppercase',
  },
  contactRow: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 15,
    color: '#64748b',
    fontSize: 9,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4f46e5',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 3,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  itemTitle: {
    fontWeight: 'bold',
    color: '#0f172a',
  },
  itemSubtitle: {
    color: '#475569',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  bulletPoint: {
    marginLeft: 10,
    marginBottom: 3,
    lineHeight: 1.3,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 5,
  },
  skillPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    color: '#334155',
    fontSize: 8,
  },
});

interface ResumePDFProps {
  profile: {
    name: string;
    email: string;
    phone: string;
    location: string;
    skills: string[];
    experience: any[];
    projects: any[];
    education: any[];
  };
}

export default function ResumePDF({ profile }: ResumePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{profile.name || 'Your Name'}</Text>
          <View style={styles.contactRow}>
            {profile.email && <Text>Email: {profile.email}</Text>}
            {profile.phone && <Text>Phone: {profile.phone}</Text>}
            {profile.location && <Text>Location: {profile.location}</Text>}
          </View>
        </View>

        {/* Experience */}
        {profile.experience && profile.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {profile.experience.map((exp, idx) => (
              <View key={idx} style={{ marginBottom: 10 }}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{exp.role}</Text>
                  <Text style={{ color: '#64748b', fontSize: 9 }}>{exp.duration}</Text>
                </View>
                <Text style={styles.itemSubtitle}>{exp.company}</Text>
                {exp.description && exp.description.map((bullet: string, bIdx: number) => (
                  <Text key={bIdx} style={styles.bulletPoint}>
                    • {bullet}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {profile.projects && profile.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {profile.projects.map((proj, idx) => (
              <View key={idx} style={{ marginBottom: 10 }}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{proj.name}</Text>
                  {proj.technologies && proj.technologies.length > 0 && (
                    <Text style={{ color: '#64748b', fontSize: 8 }}>
                      ({proj.technologies.join(', ')})
                    </Text>
                  )}
                </View>
                <Text style={{ lineHeight: 1.3, marginTop: 2 }}>{proj.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {profile.skills.map((skill, idx) => (
                <Text key={idx} style={styles.skillPill}>
                  {skill}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Education */}
        {profile.education && profile.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {profile.education.map((edu, idx) => (
              <View key={idx} style={{ marginBottom: 6 }}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{edu.degree}</Text>
                  <Text style={{ color: '#64748b', fontSize: 9 }}>{edu.year}</Text>
                </View>
                <Text style={styles.itemSubtitle}>{edu.school}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}
