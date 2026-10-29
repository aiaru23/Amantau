import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Mountain, Gauge, Footprints, Compass } from 'lucide-react-native';
import { ru } from '../locales/ru';
import { ThemeColors } from '../constants/theme';
import { RouteStatus } from './RouteStatus';

interface TelemetryBarProps {
  altitudeMeters: number;
  speedKmh: number;
  distanceTraveledKm: number;
  deviationMeters: number;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({
  altitudeMeters,
  speedKmh,
  distanceTraveledKm,
  deviationMeters,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <Text style={styles.statusTitle}>{ru.hike.statusTitle}</Text>
        <RouteStatus deviationMeters={deviationMeters} />
      </View>

      <View style={styles.gridContainer}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Mountain size={14} color={ThemeColors.accentLime} />
            <Text style={styles.metricLabel}>{ru.hike.altitude}</Text>
          </View>
          <Text style={styles.metricValue}>
            {altitudeMeters.toLocaleString('ru-RU')} <Text style={styles.unit}>{ru.common.meters}</Text>
          </Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Gauge size={14} color={ThemeColors.accentLime} />
            <Text style={styles.metricLabel}>{ru.hike.speed}</Text>
          </View>
          <Text style={styles.metricValue}>
            {speedKmh.toFixed(1)} <Text style={styles.unit}>{ru.common.kmh}</Text>
          </Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Footprints size={14} color={ThemeColors.accentLime} />
            <Text style={styles.metricLabel}>{ru.hike.traveled}</Text>
          </View>
          <Text style={styles.metricValue}>
            {distanceTraveledKm.toFixed(1)} <Text style={styles.unit}>{ru.common.kilometers}</Text>
          </Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Compass size={14} color={ThemeColors.accentLime} />
            <Text style={styles.metricLabel}>{ru.hike.deviation}</Text>
          </View>
          <Text
            style={[
              styles.metricValue,
              {
                color:
                  deviationMeters > 300
                    ? ThemeColors.dangerRed
                    : deviationMeters > 100
                    ? ThemeColors.warningYellow
                    : ThemeColors.accentLime,
              },
            ]}
          >
            {deviationMeters} <Text style={styles.unit}>{ru.common.meters}</Text>
          </Text>
        </View>
      </View>
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
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    color: ThemeColors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: ThemeColors.cardBgSubtle,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metricLabel: {
    color: ThemeColors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricValue: {
    color: ThemeColors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  unit: {
    fontSize: 12,
    color: ThemeColors.accentLime,
    fontWeight: '700',
  },
});
