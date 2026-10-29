import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../services/networkService';
import { ru } from '../locales/ru';
import { ThemeColors } from '../constants/theme';

interface ConnectionStatusProps {
  compact?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ compact = false }) => {
  const isOnline = useNetworkStatus();

  return (
    <View style={[styles.badge, isOnline ? styles.onlineBadge : styles.offlineBadge, compact && styles.compactBadge]}>
      <View style={[styles.dot, { backgroundColor: isOnline ? ThemeColors.safeGreen : ThemeColors.textMuted }]} />
      <Text style={[styles.text, { color: isOnline ? ThemeColors.textPrimary : ThemeColors.textSecondary }]}>
        {isOnline ? ru.connection.online : ru.connection.offline}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  compactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  onlineBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  offlineBadge: {
    backgroundColor: ThemeColors.cardBgSubtle,
    borderColor: ThemeColors.cardBorder,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
