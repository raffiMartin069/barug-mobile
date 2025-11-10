import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, View, Image, Linking, Pressable } from 'react-native'

const features = [
  { icon: 'document-text-outline', title: 'Digital Services', description: 'Request barangay certificates and clearances online' },
  { icon: 'shield-checkmark-outline', title: 'Incident Reporting', description: 'File blotter reports and track their status' },
  { icon: 'people-outline', title: 'Resident Directory', description: 'Connect with verified community members' },
  { icon: 'notifications-outline', title: 'Announcements', description: 'Stay updated with community news and events' },
]

const teamMembers = [
  { name: 'Hon. [Barangay Captain Name]', role: 'Barangay Captain' },
  { name: '[Secretary Name]', role: 'Barangay Secretary' },
  { name: '[Treasurer Name]', role: 'Barangay Treasurer' },
]

const About = () => {
  const handleWebsitePress = () => {
    Linking.openURL('https://barangay-website.com')
  }

  const handleEmailPress = () => {
    Linking.openURL('mailto:barangay@example.com')
  }

  return (
    <ThemedView safe>
      <ThemedAppBar title="About" />
      <ThemedKeyboardAwareScrollView>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="home" size={48} color="#6D2932" />
            </View>
            <ThemedText style={styles.appTitle}>BARUG Mobile</ThemedText>
            <ThemedText style={styles.appSubtitle}>Barangay Services at Your Fingertips</ThemedText>
            <ThemedText style={styles.version}>Version 1.0.0</ThemedText>
          </View>

          {/* Mission */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Our Mission</ThemedText>
            <ThemedText style={styles.missionText}>
              To provide efficient, transparent, and accessible barangay services to our community members through innovative digital solutions, fostering better communication and engagement between residents and local government.
            </ThemedText>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Key Features</ThemedText>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={24} color="#6D2932" />
                </View>
                <View style={styles.featureContent}>
                  <ThemedText style={styles.featureTitle}>{feature.title}</ThemedText>
                  <ThemedText style={styles.featureDescription}>{feature.description}</ThemedText>
                </View>
              </View>
            ))}
          </View>

          {/* Barangay Information */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Barangay Information</ThemedText>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color="#6D2932" />
                <View style={styles.infoText}>
                  <ThemedText style={styles.infoLabel}>Address</ThemedText>
                  <ThemedText style={styles.infoValue}>Barangay Hall, Main Street, City</ThemedText>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color="#6D2932" />
                <View style={styles.infoText}>
                  <ThemedText style={styles.infoLabel}>Contact Number</ThemedText>
                  <ThemedText style={styles.infoValue}>(02) 8XXX-XXXX</ThemedText>
                </View>
              </View>

              <Pressable style={styles.infoRow} onPress={handleEmailPress}>
                <Ionicons name="mail-outline" size={20} color="#6D2932" />
                <View style={styles.infoText}>
                  <ThemedText style={styles.infoLabel}>Email</ThemedText>
                  <ThemedText style={[styles.infoValue, styles.linkText]}>barangay@example.com</ThemedText>
                </View>
                <Ionicons name="open-outline" size={16} color="#6D2932" />
              </Pressable>

              <Pressable style={styles.infoRow} onPress={handleWebsitePress}>
                <Ionicons name="globe-outline" size={20} color="#6D2932" />
                <View style={styles.infoText}>
                  <ThemedText style={styles.infoLabel}>Website</ThemedText>
                  <ThemedText style={[styles.infoValue, styles.linkText]}>barangay-website.com</ThemedText>
                </View>
                <Ionicons name="open-outline" size={16} color="#6D2932" />
              </Pressable>
            </View>
          </View>

          {/* Leadership */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Leadership Team</ThemedText>
            {teamMembers.map((member, index) => (
              <View key={index} style={styles.memberItem}>
                <View style={styles.memberAvatar}>
                  <Ionicons name="person" size={24} color="#6D2932" />
                </View>
                <View style={styles.memberInfo}>
                  <ThemedText style={styles.memberName}>{member.name}</ThemedText>
                  <ThemedText style={styles.memberRole}>{member.role}</ThemedText>
                </View>
              </View>
            ))}
          </View>

          {/* Legal */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Legal Information</ThemedText>
            <View style={styles.legalCard}>
              <ThemedText style={styles.legalText}>
                This application is developed and maintained by the Barangay Government in compliance with the Data Privacy Act of 2012 and other applicable laws.
              </ThemedText>
              <ThemedText style={styles.legalText}>
                All personal information collected through this app is used solely for the provision of barangay services and is protected according to our privacy policy.
              </ThemedText>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              © 2024 Barangay Government. All rights reserved.
            </ThemedText>
            <ThemedText style={styles.footerText}>
              Made with ❤️ for our community
            </ThemedText>
          </View>
        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default About

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#6D2932',
  },
  appSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    color: '#999',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#6D2932',
  },
  missionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    textAlign: 'justify',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  linkText: {
    color: '#6D2932',
    textDecorationLine: 'underline',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
    color: '#666',
  },
  legalCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  legalText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
    textAlign: 'justify',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
})