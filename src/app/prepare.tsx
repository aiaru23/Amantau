import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Map, UploadCloud, Clock, Plus, Minus, Play } from 'lucide-react-native';
import { ru } from '../locales/ru';
import { ThemeColors } from '../constants/theme';
import { formatMinutesToRussianReadable } from '../utils/time';
import { AppStorage } from '../database/storage';
import { RouteData } from '../types/route';

function getCurrentTimestamp(): number {
  return Date.now();
}

export default function PrepareScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [plannedMinutes, setPlannedMinutes] = useState<number>(180);

  useEffect(() => {
    async function loadRoute() {
      const routeId = params.routeId as string | undefined;
      const imported = await AppStorage.getImportedRoutes();

      if (routeId) {
        const found = imported.find((r) => r.id === routeId);
        if (found) {
          setSelectedRoute(found);
          setPlannedMinutes(found.estimatedDurationMinutes);
          setLoading(false);
          return;
        }
      }

      if (imported.length > 0) {
        setSelectedRoute(imported[0]);
        setPlannedMinutes(imported[0].estimatedDurationMinutes);
      } else {
        setSelectedRoute(null);
      }
      setLoading(false);
    }
    loadRoute();
  }, [params.routeId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator style={{ marginTop: 60 }} color={ThemeColors.accentGreen} />
      </SafeAreaView>
    );
  }

  const handleAdjustTime = (deltaMinutes: number) => {
    setPlannedMinutes((prev) => Math.max(30, prev + deltaMinutes));
  };

  const handleStartHike = async () => {
    if (!selectedRoute) return;
    const startTime = getCurrentTimestamp();
    const hikeSession = {
      routeId: selectedRoute.id,
      routeName: selectedRoute.name,
      startTime,
      plannedMinutes,
      initialRoute: selectedRoute,
    };

    await AppStorage.setActiveHike(hikeSession);
    router.replace('/hike');
  };

  if (!selectedRoute) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Map size={54} color={ThemeColors.textMuted} />
          <Text style={styles.emptyTitle}>Нет загруженных маршрутов</Text>
          <Text style={styles.emptySubtext}>
            Загрузите GPX файл в разделе «Мои маршруты» для подготовки к походу.
          </Text>

          <TouchableOpacity
            style={styles.emptyActionBtn}
            onPress={() => router.push('/routes')}
            activeOpacity={0.85}
          >
            <UploadCloud size={18} color={ThemeColors.buttonPrimaryText} />
            <Text style={styles.emptyActionBtnText}>Загрузить GPX маршрут</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Route Details Card */}
        <View style={styles.card}>
          <Text style={styles.routeName}>{selectedRoute.name}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{ru.routes.distance}</Text>
            <Text style={styles.infoValue}>{selectedRoute.distanceKm} км</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{ru.routes.duration}</Text>
            <Text style={styles.infoValue}>
              {formatMinutesToRussianReadable(selectedRoute.estimatedDurationMinutes)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{ru.routes.maxAltitude}</Text>
            <Text style={styles.infoValue}>{selectedRoute.maxAltitudeMeters} м</Text>
          </View>
        </View>

        {/* Time Adjuster Card */}
        <View style={styles.timeCard}>
          <View style={styles.timeHeaderGroup}>
            <Clock size={16} color={ThemeColors.accentGreen} />
            <Text style={styles.timeHeader}>{ru.prepare.plannedDuration}</Text>
          </View>
          <Text style={styles.timeSubtext}>{ru.prepare.adjustTimeHint}</Text>

          <View style={styles.timeControlRow}>
            <TouchableOpacity
              style={styles.adjustBtn}
              onPress={() => handleAdjustTime(-30)}
            >
              <Minus size={16} color={ThemeColors.textPrimary} />
              <Text style={styles.adjustBtnText}>30 мин</Text>
            </TouchableOpacity>

            <View style={styles.timeDisplayBox}>
              <Text style={styles.timeDisplayText}>
                {formatMinutesToRussianReadable(plannedMinutes)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.adjustBtn}
              onPress={() => handleAdjustTime(30)}
            >
              <Plus size={16} color={ThemeColors.textPrimary} />
              <Text style={styles.adjustBtnText}>30 мин</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Start Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={handleStartHike}
            activeOpacity={0.85}
          >
            <Play size={20} color={ThemeColors.buttonPrimaryText} />
            <Text style={styles.startBtnText}>{ru.prepare.startHikeBtn}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  container: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  emptyContainer: {
    padding: 24,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    color: ThemeColors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  emptySubtext: {
    color: ThemeColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  emptyActionBtn: {
    backgroundColor: ThemeColors.buttonPrimaryBg,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyActionBtnText: {
    color: ThemeColors.buttonPrimaryText,
    fontSize: 15,
    fontWeight: '800',
  },
  card: {
    backgroundColor: ThemeColors.cardBg,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  routeName: {
    fontSize: 18,
    fontWeight: '800',
    color: ThemeColors.textPrimary,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.cardBorder,
  },
  infoLabel: {
    color: ThemeColors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  infoValue: {
    color: ThemeColors.accentGreen,
    fontSize: 15,
    fontWeight: '800',
  },
  timeCard: {
    backgroundColor: ThemeColors.cardBg,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
    alignItems: 'center',
    marginVertical: 16,
  },
  timeHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  timeHeader: {
    color: ThemeColors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  timeSubtext: {
    color: ThemeColors.textSecondary,
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  timeControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  adjustBtn: {
    backgroundColor: ThemeColors.buttonSecondaryBg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adjustBtnText: {
    color: ThemeColors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  timeDisplayBox: {
    backgroundColor: ThemeColors.cardBgSubtle,
    borderColor: ThemeColors.accentGreen,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  timeDisplayText: {
    color: ThemeColors.accentGreen,
    fontSize: 16,
    fontWeight: '900',
  },
  actionContainer: {
    marginTop: 10,
  },
  startBtn: {
    backgroundColor: ThemeColors.buttonPrimaryBg,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  startBtnText: {
    color: ThemeColors.buttonPrimaryText,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
