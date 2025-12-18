import React from 'react'
import { StyleSheet } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

const ThemedKeyboardAwareScrollView = ({ style = null, children, ...props }) => {
  return (
    <KeyboardAwareScrollView
        style={[style]}
        contentContainerStyle={styles.scrollContainer}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        {...props}
    >
      {children}
    </KeyboardAwareScrollView>
  )
}

export default ThemedKeyboardAwareScrollView

const styles = StyleSheet.create({
  scrollContainer: {
      flexGrow: 1,
      padding: 20,
      backgroundColor: 'white',
      justifyContent: 'space-between',
    },
})