import React from 'react'
import { View, ViewStyle } from 'react-native'

type SpacerProps = {
  width?: ViewStyle['width']   // matches RN typing (number | string | undefined)
  height?: ViewStyle['height'] // number | undefined
}

const Spacer: React.FC<SpacerProps> = ({ width = '100%', height = 20 }) => {
  const style: ViewStyle = { width, height }
  return <View style={style} />
}

export default Spacer
