/**
 * this is a copy of ThemedImages but with dynamic props
 */

import { Colors } from "@/constants/Colors";
import React from "react";
import { Image, StyleSheet, useColorScheme, View } from "react-native";

const ThemedImage = ({ style = {}, src, size, resizeMode, ...props }) => {
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
        resizeMode={resizeMode || 'cover'}
      />
    </View>
  )
};

export default ThemedImage;

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderWidth: 2,
  },
  image: {
    resizeMode: "cover",
  },
});
