import { Colors } from '@/constants/Colors'
import React from 'react'
import { StyleSheet, useColorScheme, View } from 'react-native'

const ThemedProgressBar = ({step = 1, totalStep = 1}) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

  const renderSteps = () => {
    let steps = []
    for (let i = 1; i<= totalStep; i++) {
        steps.push(
            <View
                key={i}
                style={[
                    styles.step,
                    i <= step ? styles.activeStep : styles.inactiveStep,
                ]}
            />
        )
    }
    return steps
  }

  return (
    <View style={styles.container}>{renderSteps()}</View>
  )
}

export default ThemedProgressBar

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  step: {
    width: 30,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 5,
  },
  activeStep: {
    backgroundColor: Colors.primary, // active color
  },
  inactiveStep: {
    backgroundColor: '#ccc', // inactive color
  },
})