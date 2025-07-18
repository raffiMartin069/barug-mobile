import { Colors } from '@/constants/Colors'
import React from 'react'
import { Image, StyleSheet, useColorScheme, View } from 'react-native'

const ThemedImage = ({style = null, src, size, ...props}) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

  return (
    <View
        style={[
            styles.container,
            { width: size, height: size, borderRadius: size / 2, borderColor: theme.link },
            style,
        ]}
    >
      <Image
        source={src}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      />
    </View>
  )
}

export default ThemedImage

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        borderWidth: 2,
    },
    image: {
    resizeMode: 'cover',
  },
})