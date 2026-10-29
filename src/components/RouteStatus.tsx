import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react-native';
import { ru } from '../locales/ru';
import { ThemeColors } from '../constants/theme';

interface RouteStatusProps {
  deviationMeters: number;
}

export const RouteStatus: React.FC<RouteStatusProps> = ({ deviationMeters }) => {
  let statusColor = ThemeColors.safeGreen;
  let statusBg = 'rgba(16, 185, 129, 0.12)';
  let borderColor = 'rgba(16, 185, 129, 0.3)';
  let statusText = ru.hike.onRoute;
  let IconComponent = ShieldCheck;

  if (deviationMeters > 300) {
    statusColor = ThemeColors.dangerRed;
    statusBg = 'rgba(239, 68, 68, 0.12)';
    borderColor = 'rgba(239, 68, 68, 0.3)';
    statusText = ru.hike.offRoute;
    IconComponent = AlertOctagon;
  } else if (deviationMeters > 100) {
    statusColor = ThemeColors.warningYellow;
    statusBg = 'rgba(245, 158, 11, 0.12)';
    borderColor = 'rgba(245, 158, 11, 0.3)';
    statusText = ru.hike.slightDeviation;
    IconComponent = AlertTriangle;
  }

  return (
    <View style={[styles.container, { backgroundColor: statusBg, borderColor }]}>
      <IconComponent size={14} color={statusColor} style={styles.icon} />
      <Text style={[styles.text, { color: statusColor }]}>{statusText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
