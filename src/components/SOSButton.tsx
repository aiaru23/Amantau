import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { ShieldAlert } from 'lucide-react-native';
import { ru } from '../locales/ru';
import { ThemeColors } from '../constants/theme';

interface SOSButtonProps {
  onPress: () => void;
  compact?: boolean;
}

export const SOSButton: React.FC<SOSButtonProps> = ({ onPress, compact = false }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.button, compact ? styles.compactButton : styles.fullButton]}
    >
      <View style={styles.content}>
        <ShieldAlert size={compact ? 16 : 20} color="#FFFFFF" style={styles.icon} />
        <Text style={[styles.text, compact && styles.compactText]}>{ru.sos.buttonLabel}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: ThemeColors.sosRed,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B91C1C',
  },
  fullButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
  },
  compactButton: {
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  compactText: {
    fontSize: 14,
  },
});
