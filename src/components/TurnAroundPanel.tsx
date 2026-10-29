import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors } from '../constants/theme';
import {
  calculateTurnAroundTime,
  getSunsetTime,
  formatMinutesCountdown,
} from '../utils/sun';

interface TurnAroundPanelProps {
  latitude: number;
  longitude: number;
  currentAltitudeMeters: number;
  maxRouteAltitudeMeters: number;
  remainingDistanceKm: number;
  currentSpeedKmh: number;
  plannedEndTimestamp: number;
}

export const TurnAroundPanel: React.FC<TurnAroundPanelProps> = ({
  latitude,
  longitude,
  currentAltitudeMeters,
  maxRouteAltitudeMeters,
  remainingDistanceKm,
  currentSpeedKmh,
  plannedEndTimestamp,
}) => {
  const info = useMemo(() => {
    try {
      return calculateTurnAroundTime({
        latitude,
        longitude,
        currentAltitudeMeters,
        maxRouteAltitudeMeters,
        remainingDistanceKm,
        currentSpeedKmh: Math.max(0.5, currentSpeedKmh),
        plannedEndTimestamp,
        safetyBufferMinutes: 30,
      });
    } catch {
      return null;
    }
  }, [latitude, longitude, currentAltitudeMeters, maxRouteAltitudeMeters, remainingDistanceKm, currentSpeedKmh, plannedEndTimestamp]);

  const sunInfo = useMemo(() => {
    try {
      return getSunsetTime(latitude, longitude);
    } catch {
      return null;
    }
  }, [latitude, longitude]);

  if (!info) return null;

  const urgency = info.isPastTurnAround
    ? 'danger'
    : info.minutesUntilTurnAround <= 30
    ? 'warning'
    : 'safe';

  const urgencyColor =
    urgency === 'danger'
      ? ThemeColors.dangerRed
      : urgency === 'warning'
      ? ThemeColors.warningYellow
      : ThemeColors.safeGreen;

  const containerBg =
    urgency === 'danger'
      ? 'rgba(200,77,69,0.12)'
      : urgency === 'warning'
      ? 'rgba(214,168,61,0.10)'
      : ThemeColors.cardBg;

  const borderColor =
    urgency === 'danger'
      ? 'rgba(200,77,69,0.5)'
      : urgency === 'warning'
      ? 'rgba(214,168,61,0.4)'
      : ThemeColors.cardBorder;

  return (
    <View style={[styles.container, { backgroundColor: containerBg, borderColor }]}>
      <View style={styles.headerRow}>
        <Text style={styles.headerIcon}>⏱️</Text>
        <Text style={styles.headerTitle}>ТОЧКА НЕВОЗВРАТА</Text>
        {urgency !== 'safe' && (
          <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor }]}>
            <Text style={styles.urgencyBadgeText}>
              {urgency === 'danger' ? '⚠️ ВРЕМЯ!' : '⚠️ СКОРО'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>Разворот в</Text>
          <Text style={[styles.timeValue, { color: urgencyColor }]}>
            {info.turnAroundTimeString}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>Через</Text>
          <Text style={[styles.timeValue, { color: urgencyColor }]}>
            {info.isPastTurnAround
              ? 'ПРОШЛО'
              : formatMinutesCountdown(info.minutesUntilTurnAround)}
          </Text>
        </View>

        {sunInfo && (
          <>
            <View style={styles.divider} />
            <View style={styles.timeBlock}>
              <Text style={styles.timeLabel}>🌅 Закат</Text>
              <Text style={styles.sunsetValue}>{sunInfo.sunsetTimeString}</Text>
            </View>
          </>
        )}
      </View>

      <Text style={styles.reason} numberOfLines={2}>
        {info.reason}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    marginVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  headerIcon: {
    fontSize: 16,
  },
  headerTitle: {
    flex: 1,
    color: ThemeColors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  urgencyBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeBlock: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    color: ThemeColors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sunsetValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: ThemeColors.cardBorder,
    marginHorizontal: 4,
  },
  reason: {
    color: ThemeColors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
  },
});
