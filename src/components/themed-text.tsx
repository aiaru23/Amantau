import React from 'react';
import { Text, TextProps } from 'react-native';
import { ThemeColors } from '../constants/theme';

export function ThemedText(props: TextProps & { type?: string; themeColor?: string }) {
  return <Text style={[{ color: ThemeColors.textPrimary }, props.style]} {...props} />;
}
