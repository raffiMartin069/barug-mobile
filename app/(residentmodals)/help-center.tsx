import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Pressable, StyleSheet, View, Linking } from 'react-native'

const helpTopics = [
  {
    title: 'Account & Profile',
    items: [
      { question: 'How do I update my profile information?', answer: 'Go to Settings > My Account > My Profile to update your personal information, contact details, and address.' },
      { question: 'How do I verify my residency?', answer: 'Navigate to Settings > My Account > Resident Verification and follow the steps to upload required documents for verification.' },
      { question: 'How do I change my MPIN?', answer: 'Go to Settings > My Account > Change MPIN and follow the security prompts to update your mobile PIN.' },
    ]
  },
  {
    title: 'Reports & Services',
    items: [
      { question: 'How do I file a blotter report?', answer: 'Use the "File Blotter Report" feature from the main menu. Provide detailed information about the incident and location.' },
      { question: 'What documents do I need for barangay services?', answer: 'Required documents vary by service. Common requirements include valid ID, proof of residency, and specific forms depending on the service requested.' },
      { question: 'How long does it take to process requests?', answer: 'Processing times vary by service type. Most certificates take 1-3 business days, while clearances may take 3-5 business days.' },
    ]
  },
  {
    title: 'Technical Support',
    items: [
      { question: 'The app is not working properly', answer: 'Try closing and reopening the app. If issues persist, check your internet connection or contact technical support.' },
      { question: 'I forgot my login credentials', answer: 'Use the "Forgot Password" option on the login screen or contact the barangay office for assistance with account recovery.' },
      { question: 'How do I update the app?', answer: 'Check your device\'s app store for available updates. Enable automatic updates for the latest features and security improvements.' },
    ]
  }
]

const contactInfo = [
  { icon: 'call-outline', label: 'Phone', value: '(02) 8XXX-XXXX', action: () => Linking.openURL('tel:+6328XXXXXXX') },
  { icon: 'mail-outline', label: 'Email', value: 'barangay@example.com', action: () => Linking.openURL('mailto:barangay@example.com') },
  { icon: 'location-outline', label: 'Address', value: 'Barangay Hall, Main Street', action: null },
  { icon: 'time-outline', label: 'Office Hours', value: 'Mon-Fri: 8:00 AM - 5:00 PM', action: null },
]

const HelpCenter = () => {
  const router = useRouter()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  return (
    <ThemedView safe>
      <ThemedAppBar title="Help Center" />
      <ThemedKeyboardAwareScrollView>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="help-circle" size={48} color="#6D2932" />
            <ThemedText style={styles.headerTitle}>How can we help you?</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Find answers to common questions or contact us for support
            </ThemedText>
          </View>

          {/* FAQ Sections */}
          {helpTopics.map((topic, topicIndex) => (
            <View key={topicIndex} style={styles.section}>
              <ThemedText style={styles.sectionTitle}>{topic.title}</ThemedText>
              {topic.items.map((item, itemIndex) => {
                const itemId = `${topicIndex}-${itemIndex}`
                const isExpanded = expandedItems.includes(itemId)
                
                return (
                  <Pressable
                    key={itemIndex}
                    style={styles.faqItem}
                    onPress={() => toggleExpanded(itemId)}
                  >
                    <View style={styles.questionRow}>
                      <ThemedText style={styles.question}>{item.question}</ThemedText>
                      <Ionicons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color="#666" 
                      />
                    </View>
                    {isExpanded && (
                      <ThemedText style={styles.answer}>{item.answer}</ThemedText>
                    )}
                  </Pressable>
                )
              })}
            </View>
          ))}

          {/* Contact Information */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Contact Us</ThemedText>
            <ThemedText style={styles.contactDescription}>
              Still need help? Get in touch with our support team
            </ThemedText>
            
            {contactInfo.map((contact, index) => (
              <Pressable
                key={index}
                style={[styles.contactItem, !contact.action && styles.contactItemDisabled]}
                onPress={contact.action || undefined}
                disabled={!contact.action}
              >
                <View style={styles.contactIcon}>
                  <Ionicons name={contact.icon as any} size={20} color="#6D2932" />
                </View>
                <View style={styles.contactText}>
                  <ThemedText style={styles.contactLabel}>{contact.label}</ThemedText>
                  <ThemedText style={styles.contactValue}>{contact.value}</ThemedText>
                </View>
                {contact.action && (
                  <Ionicons name="chevron-forward" size={16} color="#999" />
                )}
              </Pressable>
            ))}
          </View>

          {/* Emergency Notice */}
          <View style={styles.emergencyNotice}>
            <Ionicons name="warning" size={20} color="#DC2626" />
            <View style={styles.emergencyText}>
              <ThemedText style={styles.emergencyTitle}>Emergency?</ThemedText>
              <ThemedText style={styles.emergencyDescription}>
                For urgent matters, please call 911 or visit the barangay hall directly
              </ThemedText>
            </View>
          </View>
        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default HelpCenter

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
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
  faqItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  answer: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    lineHeight: 20,
  },
  contactDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactItemDisabled: {
    opacity: 0.8,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactText: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  emergencyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 16,
  },
  emergencyText: {
    marginLeft: 12,
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 4,
  },
  emergencyDescription: {
    fontSize: 14,
    color: '#991B1B',
  },
})