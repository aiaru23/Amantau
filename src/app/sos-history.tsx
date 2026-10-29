import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldAlert, CheckCircle2, Clock } from 'lucide-react-native';
import { ru } from '../locales/ru';
import { ThemeColors } from '../constants/theme';
import { AppStorage } from '../database/storage';
import { EmergencyRecord } from '../types/emergency';
import { formatSecondsToHHMMSS } from '../utils/time';

export default function SOSHistoryScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<EmergencyRecord[]>([]);

  useEffect(() => {
    let active = true;
    setTimeout(() => {
      AppStorage.getEmergencyRecords().then((list) => {
        if (active) setRecords(list);
      });
    }, 0);

    return () => {
      active = false;
    };
  }, []);

  const renderSOSCard = ({ item }: { item: EmergencyRecord }) => {
    const dateFormatted = new Date(item.timestamp).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <ShieldAlert size={22} color={ThemeColors.dangerRed} style={{ marginRight: 10 }} />
          <View style={styles.headerTitleBox}>
            <Text style={styles.routeName}>{item.routeName}</Text>
            <Text style={styles.dateText}>{dateFormatted}</Text>
          </View>
        </View>

        <View
          style={[
            styles.syncBadge,
            item.synced ? styles.syncedBadge : styles.localBadge,
          ]}
        >
          {item.synced ? (
            <CheckCircle2 size={12} color={ThemeColors.accentGreen} />
          ) : (
            <Clock size={12} color={ThemeColors.textSecondary} />
          )}
          <Text style={[styles.syncText, { color: item.synced ? ThemeColors.accentGreen : ThemeColors.textSecondary }]}>
            {item.synced ? ru.sos.syncedBadge : ru.sos.localBadge}
          </Text>
        </View>

        <View style={styles.gridBox}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Координаты:</Text>
            <Text style={styles.gridValue}>
              {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
            </Text>
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Высота:</Text>
            <Text style={styles.gridValue}>{item.altitude} м</Text>
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Отклонение:</Text>
            <Text style={[styles.gridValue, { color: ThemeColors.dangerRed }]}>
              {item.distanceFromRouteMeters} м
            </Text>
          </View>

          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Время в походе:</Text>
            <Text style={styles.gridValue}>{formatSecondsToHHMMSS(item.tripDurationSeconds)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.subtext}>{ru.sos.historySubtext}</Text>

        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={renderSOSCard}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>{ru.sos.emptyHistory}</Text>
            </View>
          }
        />

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Вернуться назад</Text>
        </TouchableOpacity>
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
    padding: 16,
  },
  subtext: {
    color: ThemeColors.textSecondary,
    fontSize: 13,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 20,
    gap: 12,
  },
  card: {
    backgroundColor: ThemeColors.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitleBox: {
    flex: 1,
  },
  routeName: {
    color: ThemeColors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  dateText: {
    color: ThemeColors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  syncBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  syncedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  localBadge: {
    backgroundColor: ThemeColors.cardBgSubtle,
    borderColor: ThemeColors.cardBorder,
  },
  syncText: {
    fontSize: 11,
    fontWeight: '700',
  },
  gridBox: {
    backgroundColor: ThemeColors.cardBgSubtle,
    borderRadius: 8,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  gridItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridLabel: {
    color: ThemeColors.textSecondary,
    fontSize: 12,
  },
  gridValue: {
    color: ThemeColors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: ThemeColors.textSecondary,
    fontSize: 14,
  },
  backBtn: {
    backgroundColor: ThemeColors.buttonSecondaryBg,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  backBtnText: {
    color: ThemeColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});
