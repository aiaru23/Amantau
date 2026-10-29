import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Compass, Users, Map, History, Settings, Play, ShieldAlert, ArrowRight } from 'lucide-react-native';
import { ru } from '../locales/ru';
import { ThemeColors } from '../constants/theme';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { AppStorage } from '../database/storage';

export default function HomeScreen() {
  const router = useRouter();
  const [activeHike, setActiveHike] = useState<any | null>(null);

  useEffect(() => {
    let active = true;
    setTimeout(() => {
      AppStorage.getActiveHike().then((hike) => {
        if (active) {
          setActiveHike(hike);
        }
      });
    }, 0);

    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.brandBadge}>
            <Compass size={28} color={ThemeColors.accentGreen} />
            <Text style={styles.appName}>AmanTau</Text>
          </View>
          <Text style={styles.tagline}>{ru.tagline}</Text>
          <Text style={styles.subTagline}>{ru.subTagline}</Text>
        </View>

        {/* System Status Bar */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{ru.gps.title}</Text>
            <View style={styles.gpsBadge}>
              <View style={styles.gpsDot} />
              <Text style={styles.gpsText}>{ru.gps.ready}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{ru.connection.title}</Text>
            <ConnectionStatus compact />
          </View>
        </View>

        {/* Active Hike Banner */}
        {activeHike && (
          <View style={styles.activeHikeCard}>
            <View style={styles.activeHikeHeader}>
              <ShieldAlert size={18} color={ThemeColors.warningYellow} />
              <Text style={styles.activeHikeBadge}>{ru.home.activeHikeBanner}</Text>
            </View>
            <Text style={styles.activeHikeTitle}>{activeHike.routeName}</Text>
            <TouchableOpacity
              style={styles.resumeButton}
              onPress={() => router.push('/hike')}
              activeOpacity={0.85}
            >
              <Text style={styles.resumeButtonText}>{ru.home.continueHike}</Text>
              <ArrowRight size={16} color={ThemeColors.buttonPrimaryText} />
            </TouchableOpacity>
          </View>
        )}

        {/* Action Options Grid */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/prepare')}
            activeOpacity={0.85}
          >
            <View style={styles.buttonContent}>
              <Play size={20} color={ThemeColors.buttonPrimaryText} />
              <Text style={styles.primaryButtonText}>{ru.home.startHike}</Text>
            </View>
            <ArrowRight size={18} color={ThemeColors.buttonPrimaryText} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push('/community')}
            activeOpacity={0.85}
          >
            <View style={styles.menuIconContainer}>
              <Users size={20} color={ThemeColors.accentGreen} />
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={styles.menuCardTitle}>Единомышленники & Чат</Text>
              <Text style={styles.menuCardSubtext}>Поиск спутников и общение</Text>
            </View>
            <ArrowRight size={16} color={ThemeColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push('/routes')}
            activeOpacity={0.85}
          >
            <View style={styles.menuIconContainer}>
              <Map size={20} color={ThemeColors.accentGreen} />
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={styles.menuCardTitle}>{ru.home.myRoutes}</Text>
              <Text style={styles.menuCardSubtext}>Импорт GPX и сохранённые треки</Text>
            </View>
            <ArrowRight size={16} color={ThemeColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push('/sos-history')}
            activeOpacity={0.85}
          >
            <View style={styles.menuIconContainer}>
              <History size={20} color={ThemeColors.dangerRed} />
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={styles.menuCardTitle}>{ru.home.sosHistory}</Text>
              <Text style={styles.menuCardSubtext}>Архив вызовов и координат</Text>
            </View>
            <ArrowRight size={16} color={ThemeColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push('/settings')}
            activeOpacity={0.85}
          >
            <View style={styles.menuIconContainer}>
              <Settings size={20} color={ThemeColors.textSecondary} />
            </View>
            <View style={styles.menuTextGroup}>
              <Text style={styles.menuCardTitle}>{ru.home.settings}</Text>
              <Text style={styles.menuCardSubtext}>Настройки алертов и контактов</Text>
            </View>
            <ArrowRight size={16} color={ThemeColors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>AmanTau • Автономная Система Безопасности</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginVertical: 12,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    color: ThemeColors.textPrimary,
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '700',
    color: ThemeColors.accentGreen,
    marginTop: 4,
  },
  subTagline: {
    fontSize: 13,
    color: ThemeColors.textSecondary,
    marginTop: 2,
  },
  statusCard: {
    backgroundColor: ThemeColors.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
    marginVertical: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  gpsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ThemeColors.safeGreen,
    marginRight: 6,
  },
  gpsText: {
    color: ThemeColors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: ThemeColors.cardBorder,
    marginVertical: 8,
  },
  activeHikeCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: ThemeColors.warningYellow,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  activeHikeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  activeHikeBadge: {
    color: ThemeColors.warningYellow,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeHikeTitle: {
    color: ThemeColors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  resumeButton: {
    backgroundColor: ThemeColors.warningYellow,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resumeButtonText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 13,
  },
  actionContainer: {
    gap: 10,
    marginVertical: 8,
  },
  primaryButton: {
    backgroundColor: ThemeColors.buttonPrimaryBg,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryButtonText: {
    color: ThemeColors.buttonPrimaryText,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  menuCard: {
    backgroundColor: ThemeColors.cardBg,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
    gap: 12,
  },
  menuIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: ThemeColors.cardBgSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  menuTextGroup: {
    flex: 1,
  },
  menuCardTitle: {
    color: ThemeColors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  menuCardSubtext: {
    color: ThemeColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  footerText: {
    color: ThemeColors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
});
