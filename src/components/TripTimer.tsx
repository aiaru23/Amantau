import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { formatSecondsToHHMMSS, formatMinutesToRussianReadable } from '../utils/time';
import { ThemeColors } from '../constants/theme';
import { ru } from '../locales/ru';

interface TripTimerProps {
  elapsedSeconds: number;
  plannedDurationMinutes: number;
}

export const TripTimer: React.FC<TripTimerProps> = ({ elapsedSeconds, plannedDurationMinutes }) => {
  const plannedSeconds = plannedDurationMinutes * 60;
  const remainingSeconds = plannedSeconds - elapsedSeconds;

  const isOneHourRemaining = remainingSeconds <= 3600 && remainingSeconds > 0;
  const isTimeExceeded = remainingSeconds <= 0;

  let timerColor = ThemeColors.textPrimary;
  let statusBannerText: string | null = null;
  let bannerType: 'NONE' | 'WARNING' | 'DANGER' = 'NONE';

  if (isTimeExceeded) {
    timerColor = ThemeColors.dangerRed;
    statusBannerText = ru.hike.timeExceededWarning;
    bannerType = 'DANGER';
  } else if (isOneHourRemaining) {
    timerColor = ThemeColors.warningYellow;
    statusBannerText = ru.hike.timeRemainingWarning;
    bannerType = 'WARNING';
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.labelGroup}>
          <Clock size={14} color={ThemeColors.accentLime} />
          <Text style={styles.label}>{ru.hike.timeTitle}</Text>
        </View>
        <Text style={styles.plannedLabel}>
          План: {formatMinutesToRussianReadable(plannedDurationMinutes)}
        </Text>
      </View>

      <Text style={[styles.timerDisplay, { color: timerColor }]}>
        {formatSecondsToHHMMSS(elapsedSeconds)}
      </Text>

      {statusBannerText && (
        <View
          style={[
            styles.banner,
            bannerType === 'DANGER' ? styles.dangerBanner : styles.warningBanner,
          ]}
        >
          <Text
            style={[
              styles.bannerText,
              { color: bannerType === 'DANGER' ? ThemeColors.dangerRed : ThemeColors.warningYellow },
            ]}
          >
            {statusBannerText}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: ThemeColors.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    color: ThemeColors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  plannedLabel: {
    color: ThemeColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  timerDisplay: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1.5,
    fontVariant: ['tabular-nums'],
    marginVertical: 2,
  },
  banner: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  warningBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  dangerBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
});
