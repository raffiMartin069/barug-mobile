import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import React from 'react'
import { StyleSheet, View } from 'react-native'

const FileBlotterReport = () => {
  return (
    <ThemedView safe style={{ flex: 1 }}>
      <ThemedAppBar
        title="File a Blotter Report"
        showNotif={false}
        showProfile={false}
      />

      <ThemedKeyboardAwareScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {/* Actions / Header */}
        <ThemedCard>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <View style={styles.row}>
                <ThemedIcon
                  name="document-text-outline"
                  bgColor="#6d2932"
                  size={20}
                  containerSize={28}
                />
                <ThemedText style={styles.title}>Blotter Report</ThemedText>
              </View>
              <ThemedText muted style={{ marginTop: 4 }}>
                Please review your information before submitting.
              </ThemedText>
            </View>
          </View>
        </ThemedCard>

        <Spacer height={16} />

        {/* Important Note */}
        <ThemedCard>
          <View style={[styles.row, { marginBottom: 6 }]}>
            <ThemedIcon
              name="information-circle-outline"
              bgColor="#310101"
              size={20}
              containerSize={28}
            />
            <ThemedText style={styles.noteTitle}>Important Note</ThemedText>
          </View>

          <ThemedText style={{ lineHeight: 20 }}>
            By submitting this blotter report, you affirm that all information provided
            is true and accurate to the best of your knowledge. False reporting may lead
            to legal consequences.
          </ThemedText>

          <Spacer height={10} />

          {/* Quick guidance bullets for UX clarity */}
          <View style={styles.bulletRow}>
            <ThemedIcon name="checkmark-circle-outline" size={16} containerSize={22} />
            <ThemedText muted style={styles.bulletText}>
              Make sure names, time, and location are accurate.
            </ThemedText>
          </View>
          <View style={styles.bulletRow}>
            <ThemedIcon name="shield-checkmark-outline" size={16} containerSize={22} />
            <ThemedText muted style={styles.bulletText}>
              Attach supporting photos/videos if available.
            </ThemedText>
          </View>
          <View style={styles.bulletRow}>
            <ThemedIcon name="chatbubbles-outline" size={16} containerSize={22} />
            <ThemedText muted style={styles.bulletText}>
              A barangay officer may contact you for clarification.
            </ThemedText>
          </View>
        </ThemedCard>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default FileBlotterReport

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    paddingLeft: 10,
    fontSize: 16,
    fontWeight: '700',
  },
  noteTitle: {
    paddingLeft: 10,
    fontWeight: '700',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  bulletText: {
    marginLeft: 6,
    flex: 1,
  },
})
