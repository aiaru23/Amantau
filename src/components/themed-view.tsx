import React from 'react';
import { View, ViewProps } from 'react-native';
import { ThemeColors } from '../constants/theme';

export function ThemedView(props: ViewProps & { type?: string }) {
  return <View style={[{ backgroundColor: ThemeColors.background }, props.style]} {...props} />;
}
