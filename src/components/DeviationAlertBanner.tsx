import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertOctagon, AlertTriangle } from 'lucide-react-native';
import { ThemeColors } from '../constants/theme';

interface DeviationAlertBannerProps {
  deviationMeters: number;
  warningThresholdMeters?: number;
  dangerThresholdMeters?: number;
}

export const DeviationAlertBanner: React.FC<DeviationAlertBannerProps> = ({
  deviationMeters,
  warningThresholdMeters = 30,
  dangerThresholdMeters = 50,
}) => {
  const isDanger = deviationMeters >= dangerThresholdMeters;
  const isWarning = deviationMeters >= warningThresholdMeters;
  const isAlert = isDanger || isWarning;

  if (!isAlert) return null;

  const bgColor = isDanger ? '#2D1616' : '#2A1F13';
  const borderColor = isDanger ? ThemeColors.dangerRed : ThemeColors.warningYellow;
  const textColor = isDanger ? '#F87171' : '#FBBF24';
  const IconComponent = isDanger ? AlertOctagon : AlertTriangle;

  const title = isDanger
    ? `Отклонение ${deviationMeters} м`
    : `Внимание: ${deviationMeters} м от тропы`;
  const subtitle = isDanger
    ? 'Сильное отклонение от маршрута. Немедленно вернитесь на тропу.'
    : 'Вы отклоняетесь от заданного маршрута.';

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor }]}>
      <IconComponent size={20} color={textColor} style={styles.icon} />
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginVertical: 6,
    gap: 10,
  },
  icon: {
    marginRight: 2,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: ThemeColors.textSecondary,
    fontWeight: '500',
  },
});
