import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Battery from 'expo-battery';
import { Home, X, Activity, Battery as BatteryIcon, MapPin, AlertOctagon } from 'lucide-react-native';

import { ThemeColors } from '../constants/theme';
import { ru } from '../locales/ru';
import { AppStorage } from '../database/storage';
import { locationService } from '../services/locationService';
import { alertService } from '../services/alertService';
import { adaptiveGpsService } from '../services/adaptiveGpsService';
import { RouteData } from '../types/route';
import { UserLocation } from '../types/location';
import { MOCK_ROUTE_BAO } from '../constants/mockRoute';
import { calculateRouteDeviation, calculateHaversineDistance } from '../utils/geo';

import { ConnectionStatus } from '../components/ConnectionStatus';
import { TelemetryBar } from '../components/TelemetryBar';
import { TripTimer } from '../components/TripTimer';
import { SOSButton } from '../components/SOSButton';
import { MapViewComponent } from '../components/MapView';
import { DeviationAlertBanner } from '../components/DeviationAlertBanner';

const DEFAULT_LOCATION: UserLocation = {
  latitude: 43.0505,
  longitude: 76.9841,
  altitude: 2100,
  speed: null,
  heading: null,
  accuracy: null,
  timestamp: Date.now(),
};

export default function HikeScreen() {
  const router = useRouter();

  const [activeRoute, setActiveRoute] = useState<RouteData>(MOCK_ROUTE_BAO);
  const [plannedMinutes, setPlannedMinutes] = useState<number>(MOCK_ROUTE_BAO.estimatedDurationMinutes);

  const [userLocation, setUserLocation] = useState<UserLocation>(DEFAULT_LOCATION);
  const [deviationMeters, setDeviationMeters] = useState(0);
  const [lastPointOnRoute, setLastPointOnRoute] = useState<{ latitude: number; longitude: number; altitude?: number } | null>(null);
  const [traveledKm, setTraveledKm] = useState(0);
  const prevLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [alertWarningM, setAlertWarningM] = useState(30);
  const [alertDangerM, setAlertDangerM] = useState(50);
  const [gpsMode, setGpsMode] = useState<string>('BALANCED');

  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  const [showDeviationModal, setShowDeviationModal] = useState(false);
  const [lastDismissedDeviation, setLastDismissedDeviation] = useState(0);

  const loadSession = useCallback(async () => {
    const session = await AppStorage.getActiveHike();
    if (session) {
      if (session.initialRoute) setActiveRoute(session.initialRoute);
      if (session.plannedMinutes) setPlannedMinutes(session.plannedMinutes);
      if (session.startTime) {
        const passedSec = Math.floor((Date.now() - session.startTime) / 1000);
        setElapsedSeconds(Math.max(0, passedSec));
      }
    }

    const [enabled, warnM, dangerM] = await Promise.all([
      AppStorage.getAlertEnabled(),
      AppStorage.getAlertWarningMeters(),
      AppStorage.getAlertDangerMeters(),
    ]);
    setAlertWarningM(warnM);
    setAlertDangerM(dangerM);
    alertService.configure({
      isEnabled: enabled,
      warningThresholdMeters: warnM,
      dangerThresholdMeters: dangerM,
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    Battery.getBatteryLevelAsync()
      .then((level: number) => { if (isMounted) setBatteryLevel(level); })
      .catch(() => {});

    const sub = Battery.addBatteryLevelListener(({ batteryLevel: lvl }: { batteryLevel: number }) => {
      if (isMounted) setBatteryLevel(lvl);
    });

    return () => {
      isMounted = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    setTimeout(() => {
      loadSession().then(() => {
        if (!isMounted) return;
      });
    }, 0);

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const unsubscribeGpsPromise = locationService.startTracking((loc) => {
      if (!isMounted) return;
      setUserLocation(loc);

      setActiveRoute((route) => {
        const { minDistanceMeters, nearestPointOnRoute } = calculateRouteDeviation(
          { latitude: loc.latitude, longitude: loc.longitude },
          route.coordinates
        );

        setDeviationMeters(minDistanceMeters);

        if (minDistanceMeters <= 100) {
          setLastPointOnRoute(nearestPointOnRoute);
        }

        setTraveledKm((prev) => {
          if (prevLocationRef.current) {
            const delta = calculateHaversineDistance(
              prevLocationRef.current,
              { latitude: loc.latitude, longitude: loc.longitude }
            );
            return prev + delta / 1000;
          }
          prevLocationRef.current = { latitude: loc.latitude, longitude: loc.longitude };
          return prev;
        });
        prevLocationRef.current = { latitude: loc.latitude, longitude: loc.longitude };

        alertService.evaluateDeviation(minDistanceMeters).catch(() => {});

        const speedKmh = loc.speed ? Math.max(0, loc.speed * 3.6) : 2.8;
        adaptiveGpsService
          .autoAdjust(loc.heading ?? null, speedKmh, minDistanceMeters)
          .then((mode) => {
            if (isMounted) setGpsMode(mode);
          })
          .catch(() => {});

        if (minDistanceMeters > alertDangerM && Math.abs(minDistanceMeters - lastDismissedDeviation) > 100) {
          setShowDeviationModal(true);
        }

        return route;
      });
    });

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      unsubscribeGpsPromise.then((unsub) => unsub && unsub());
    };
  }, [alertDangerM, lastDismissedDeviation, loadSession]);

  const speedKmh = userLocation.speed ? Math.max(0, userLocation.speed * 3.6) : 2.8;
  const currentAltitude = userLocation.altitude || activeRoute.maxAltitudeMeters;
  const batteryPercent = batteryLevel !== null ? Math.round(batteryLevel * 100) : null;

  const handleTriggerSOS = () => {
    router.push({
      pathname: '/sos',
      params: {
        lat: userLocation.latitude,
        lng: userLocation.longitude,
        alt: currentAltitude,
        routeName: activeRoute.name,
        deviation: deviationMeters,
        traveled: traveledKm * 1000,
        duration: elapsedSeconds,
        lastPointLat: lastPointOnRoute?.latitude || 0,
        lastPointLng: lastPointOnRoute?.longitude || 0,
        batteryPercent: batteryPercent ?? -1,
        speedKmh: speedKmh,
      },
    });
  };

  const handleFinishHike = () => {
    Alert.alert(ru.hike.confirmFinishTitle, ru.hike.confirmFinishText, [
      { text: ru.prepare.cancel, style: 'cancel' },
      {
        text: ru.hike.finishHike,
        style: 'destructive',
        onPress: async () => {
          alertService.disable();
          await AppStorage.clearActiveHike();
          router.replace('/');
        },
      },
    ]);
  };

  const handleGoHome = () => {
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Level 1: Navigation & Actions Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={handleGoHome} style={styles.homeBadge}>
            <Home size={14} color={ThemeColors.textPrimary} />
            <Text style={styles.homeBadgeText}>Главная</Text>
          </TouchableOpacity>

          <View style={styles.routeNameChip}>
            <Text style={styles.routeNameChipText} numberOfLines={1}>
              {activeRoute.name}
            </Text>
          </View>

          <TouchableOpacity onPress={handleFinishHike} style={styles.finishBadge}>
            <X size={14} color="#F87171" />
            <Text style={styles.finishBadgeText}>Финиш</Text>
          </TouchableOpacity>
        </View>

        {/* Level 2: Status Bar */}
        <View style={styles.statusBar}>
          <ConnectionStatus compact />
          <View style={styles.gpsModeChip}>
            <Activity size={12} color={ThemeColors.textSecondary} />
            <Text style={styles.gpsModeText}>{gpsMode}</Text>
          </View>
          {batteryPercent !== null && (
            <View style={styles.batteryBadge}>
              <BatteryIcon size={12} color={batteryPercent < 20 ? ThemeColors.dangerRed : ThemeColors.accentGreen} />
              <Text style={[
                styles.batteryText,
                { color: batteryPercent < 20 ? ThemeColors.dangerRed : ThemeColors.textPrimary }
              ]}>
                {batteryPercent}%
              </Text>
            </View>
          )}
        </View>

        {/* Map View */}
        <MapViewComponent
          routePoints={activeRoute.coordinates}
          userLocation={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
          lastPointOnRoute={lastPointOnRoute}
          deviationMeters={deviationMeters}
        />

        <DeviationAlertBanner
          deviationMeters={deviationMeters}
          warningThresholdMeters={alertWarningM}
          dangerThresholdMeters={alertDangerM}
        />

        {deviationMeters > alertWarningM && lastPointOnRoute && (
          <View style={styles.lastPointCard}>
            <View style={styles.lastPointHeaderGroup}>
              <MapPin size={14} color="#FCA5A5" />
              <Text style={styles.lastPointHeader}>{ru.hike.lastRoutePointTitle}</Text>
            </View>
            <Text style={styles.lastPointSubtext}>
              {ru.hike.lastPointDistance(deviationMeters)}
            </Text>
          </View>
        )}

        <TelemetryBar
          altitudeMeters={currentAltitude}
          speedKmh={speedKmh}
          distanceTraveledKm={traveledKm}
          deviationMeters={deviationMeters}
        />

        <View style={styles.sectionSpacer}>
          <TripTimer
            elapsedSeconds={elapsedSeconds}
            plannedDurationMinutes={plannedMinutes}
          />
        </View>

        <View style={styles.sosContainer}>
          <SOSButton onPress={handleTriggerSOS} />
        </View>

      </ScrollView>

      <Modal
        visible={showDeviationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeviationModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <AlertOctagon size={42} color={ThemeColors.dangerRed} style={{ marginBottom: 12 }} />
            <Text style={styles.modalTitle}>{ru.hike.deviationAlertTitle}</Text>
            <Text style={styles.modalText}>{ru.hike.deviationAlertText(deviationMeters)}</Text>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setLastDismissedDeviation(deviationMeters);
                alertService.resetCooldown();
                setShowDeviationModal(false);
              }}
            >
              <Text style={styles.modalPrimaryBtnText}>{ru.hike.showRouteOnMap}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  container: {
    padding: 14,
    paddingBottom: 40,
    flexGrow: 1,
  },

  // Level 1 Nav Bar
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  homeBadge: {
    backgroundColor: ThemeColors.cardBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  homeBadgeText: {
    color: ThemeColors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  routeNameChip: {
    flex: 1,
    backgroundColor: ThemeColors.cardBgSubtle,
    borderColor: ThemeColors.cardBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  routeNameChipText: {
    color: ThemeColors.accentGreen,
    fontSize: 12,
    fontWeight: '800',
  },
  finishBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  finishBadgeText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
  },

  // Level 2 Status Bar
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ThemeColors.cardBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
    marginBottom: 12,
    gap: 8,
  },
  gpsModeChip: {
    backgroundColor: ThemeColors.cardBgSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gpsModeText: {
    color: ThemeColors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  batteryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  batteryText: {
    fontSize: 11,
    fontWeight: '700',
  },

  lastPointCard: {
    backgroundColor: '#2D1616',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastPointHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lastPointHeader: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
  },
  lastPointSubtext: {
    color: '#F9FAFB',
    fontSize: 13,
    fontWeight: '800',
  },

  sectionSpacer: {
    marginTop: 10,
  },
  sosContainer: {
    marginTop: 16,
    marginBottom: 16,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: ThemeColors.cardBg,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.dangerRed,
  },
  modalTitle: {
    color: ThemeColors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalText: {
    color: ThemeColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalPrimaryBtn: {
    backgroundColor: ThemeColors.buttonPrimaryBg,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    color: ThemeColors.buttonPrimaryText,
    fontSize: 15,
    fontWeight: '800',
  },
});
