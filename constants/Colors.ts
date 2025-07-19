/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';
const primary = "#310101";

export const Colors = {
  primary: "#310101",
  warning: "#cc475a",
  
  light: {
    text: '#11181C',
    title: '#11181C',
    link: '#310101',
    placeholder : '#A0A0A0',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primary,
  },
  dark: {
    text: '#ECEDEE',
    title: '#fff',
    link: '#310101',
    placeholder : '#A0A0A0',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: primary,
  },
};
