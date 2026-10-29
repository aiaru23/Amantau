import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ShieldAlert, FileText, PhoneCall, CheckCircle2, ListFilter } from 'lucide-react-native';
import { ru } from '../locales/ru';
import { ThemeColors } from '../constants/theme';
import { useNetworkStatus } from '../services/networkService';
import { sosService } from '../services/sosService';
import { smsService } from '../services/smsService';
import { EmergencyRecord } from '../types/emergency';

export default function SOSScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isOnline = useNetworkStatus();

  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedRecord, setSavedRecord] = useState<EmergencyRecord | null>(null);
  const [smsResult, setSmsResult] = useState<{ contact: string; message: string } | null>(null);

  const latitude = Number(params.lat || 43.0601);
  const longitude = Number(params.lng || 76.995);
  const altitude = Number(params.alt || 2430);
  const routeName = String(params.routeName || 'Большой Алматинский маршрут');
  const distanceFromRouteMeters = Number(params.deviation || 380);
  const distanceTraveledMeters = Number(params.traveled || 4700);
  const tripDurationSeconds = Number(params.duration || 13335);
  const batteryPercent = Number(params.batteryPercent ?? -1);
  const speedKmh = Number(params.speedKmh || 0);

  const lastPointLat = Number(params.lastPointLat || 43.0601);
  const lastPointLng = Number(params.lastPointLng || 76.995);
  const lastRoutePoint =
    lastPointLat && lastPointLng ? { latitude: lastPointLat, longitude: lastPointLng } : null;

  const sosPreview = smsService.generateSOSMessage({
    latitude,
    longitude,
    altitude,
    routeName,
    distanceFromRouteMeters,
    batteryPercent: batteryPercent >= 0 ? batteryPercent : null,
    speedKmh,
    tripDurationSeconds,
  });

  const handleConfirmSOS = async () => {
    setLoading(true);

    const record = await sosService.createEmergencyRecord({
      latitude,
      longitude,
      altitude,
      routeName,
      distanceFromRouteMeters,
      distanceTraveledMeters,
      tripDurationSeconds,
      lastRoutePoint,
    });

    const dispatch = await smsService.sendEmergencySMS({
      latitude,
      longitude,
      altitude,
      routeName,
      distanceFromRouteMeters,
      batteryPercent: batteryPercent >= 0 ? batteryPercent : null,
      speedKmh,
      tripDurationSeconds,
    });

    setSavedRecord(record);
    setSmsResult({ contact: dispatch.contacts.join(', '), message: dispatch.message });
    setLoading(false);
    setConfirmed(true);
  };

  const timestampToFormat = savedRecord?.timestamp;
  const formattedTime = timestampToFormat
    ? new Date(timestampToFormat).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--:--';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {!confirmed ? (
          <View style={styles.card}>
            <ShieldAlert size={48} color={ThemeColors.sosRed} style={{ marginBottom: 12 }} />
            <Text style={styles.title}>{ru.sos.emergencyTitle}</Text>
            <Text style={styles.subtext}>{ru.sos.emergencySubtext}</Text>

            <View style={styles.previewBox}>
              <View style={styles.previewHeaderGroup}>
                <FileText size={12} color={ThemeColors.accentGreen} />
                <Text style={styles.previewHeader}>МЧС-пакет (предпросмотр):</Text>
              </View>
              <Text style={styles.previewText} numberOfLines={8}>{sosPreview}</Text>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={ThemeColors.sosRed} style={{ marginVertical: 24 }} />
            ) : (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
                  <Text style={styles.cancelBtnText}>{ru.sos.cancel}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmSOS}>
                  <Text style={styles.confirmBtnText}>{ru.sos.confirm}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <CheckCircle2 size={44} color={ThemeColors.accentGreen} style={{ marginBottom: 10 }} />
            <Text style={styles.savedTitle}>{ru.sos.savedTitle}</Text>

            {smsResult && (
              <View style={styles.smsBanner}>
                <View style={styles.smsHeaderGroup}>
                  <PhoneCall size={14} color={ThemeColors.accentGreen} />
                  <Text style={styles.smsHeader}>Экстренное SMS выслано:</Text>
                </View>
                <Text style={styles.smsContactText}>{smsResult.contact}</Text>
                <Text style={styles.smsSubText}>Текст: {smsResult.message.slice(0, 70)}...</Text>
              </View>
            )}

            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{ru.sos.lastPosition}</Text>
                <Text style={styles.detailValue}>
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{ru.sos.altitudeLabel}</Text>
                <Text style={styles.detailValue}>{altitude} м</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{ru.sos.deviationLabel}</Text>
                <Text style={styles.detailValue}>{distanceFromRouteMeters} м</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{ru.sos.timeLabel}</Text>
                <Text style={styles.detailValue}>{formattedTime}</Text>
              </View>
            </View>

            <View
              style={[
                styles.noticeBanner,
                isOnline ? styles.syncedBanner : styles.offlineBanner,
              ]}
            >
              <Text
                style={[
                  styles.noticeText,
                  { color: isOnline ? '#D1FAE5' : '#E5E7EB' },
                ]}
              >
                {isOnline ? ru.sos.syncedNotice : ru.sos.offlineNotice}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.historyBtn}
              onPress={() => router.replace('/sos-history')}
            >
              <ListFilter size={15} color={ThemeColors.accentGreen} />
              <Text style={styles.historyBtnText}>Посмотреть историю всех SOS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
              <Text style={styles.closeBtnText}>{ru.sos.close}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: ThemeColors.cardBg,
    borderRadius: 18,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  previewBox: {
    backgroundColor: ThemeColors.cardBgSubtle,
    borderRadius: 10,
    padding: 12,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  previewHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  previewHeader: {
    color: ThemeColors.accentGreen,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  previewText: {
    color: ThemeColors.textSecondary,
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  title: {
    color: ThemeColors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  savedTitle: {
    color: ThemeColors.accentGreen,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  subtext: {
    color: ThemeColors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: ThemeColors.buttonSecondaryBg,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  cancelBtnText: {
    color: ThemeColors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  confirmBtn: {
    flex: 1.2,
    backgroundColor: ThemeColors.sosRed,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  smsBanner: {
    backgroundColor: ThemeColors.cardBgSubtle,
    borderColor: ThemeColors.accentGreen,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    width: '100%',
    marginBottom: 12,
  },
  smsHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smsHeader: {
    color: ThemeColors.accentGreen,
    fontSize: 12,
    fontWeight: '800',
  },
  smsContactText: {
    color: ThemeColors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  smsSubText: {
    color: ThemeColors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  detailsBox: {
    backgroundColor: ThemeColors.cardBgSubtle,
    borderRadius: 10,
    padding: 12,
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    color: ThemeColors.textSecondary,
    fontSize: 13,
  },
  detailValue: {
    color: ThemeColors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  noticeBanner: {
    padding: 10,
    borderRadius: 8,
    width: '100%',
    marginBottom: 12,
    borderWidth: 1,
  },
  syncedBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  offlineBanner: {
    backgroundColor: ThemeColors.cardBgSubtle,
    borderColor: ThemeColors.cardBorder,
  },
  noticeText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  historyBtn: {
    backgroundColor: ThemeColors.buttonSecondaryBg,
    borderColor: ThemeColors.cardBorder,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 10,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  historyBtnText: {
    color: ThemeColors.accentGreen,
    fontSize: 13,
    fontWeight: '700',
  },
  closeBtn: {
    backgroundColor: ThemeColors.cardBgSubtle,
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  closeBtnText: {
    color: ThemeColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});
