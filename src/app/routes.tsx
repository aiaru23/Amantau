import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { FolderOpen, UploadCloud, Trash2, MapPin, Map, FileText, ChevronRight } from 'lucide-react-native';
import { ThemeColors } from '../constants/theme';
import { AppStorage } from '../database/storage';
import { RouteData } from '../types/route';
import { parseGpxString } from '../utils/gpx';

type Tab = 'my' | 'catalog';

interface RouteCardProps {
  route: RouteData;
  onSelect: (route: RouteData) => void;
  onDelete?: (id: string) => void;
  badge?: string;
  badgeColor?: string;
}

const RouteCard: React.FC<RouteCardProps> = ({
  route,
  onSelect,
  onDelete,
  badge = 'GPX',
  badgeColor = ThemeColors.accentGreen,
}) => (
  <View style={styles.card}>
    <View style={[styles.sourceBadge, { backgroundColor: badgeColor }]}>
      <Text style={styles.sourceBadgeText}>{badge}</Text>
    </View>
    <Text style={styles.routeName} numberOfLines={2}>
      {route.name}
    </Text>

    <View style={styles.statsRow}>
      <StatItem label="Дистанция" value={`${route.distanceKm} км`} />
      <View style={styles.statDivider} />
      <StatItem label="Вр. похода" value={formatDuration(route.estimatedDurationMinutes)} />
      <View style={styles.statDivider} />
      <StatItem label="Макс. высота" value={`${route.maxAltitudeMeters} м`} />
    </View>

    <View style={styles.pointsBox}>
      <View style={styles.pointRow}>
        <MapPin size={13} color={ThemeColors.safeGreen} />
        <Text style={styles.pointText}>
          <Text style={styles.pointBold}>Старт: </Text>
          {route.startPointName}
        </Text>
      </View>
      <View style={styles.pointRow}>
        <MapPin size={13} color={ThemeColors.warningYellow} />
        <Text style={styles.pointText}>
          <Text style={styles.pointBold}>Финиш: </Text>
          {route.endPointName}
        </Text>
      </View>
    </View>

    <View style={styles.cardActions}>
      <TouchableOpacity
        style={styles.openButton}
        onPress={() => onSelect(route)}
        activeOpacity={0.85}
      >
        <Text style={styles.openButtonText}>Открыть маршрут</Text>
        <ChevronRight size={16} color={ThemeColors.buttonPrimaryText} />
      </TouchableOpacity>

      {onDelete && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() =>
            Alert.alert('Удалить маршрут?', `«${route.name}» будет удалён.`, [
              { text: 'Отмена', style: 'cancel' },
              { text: 'Удалить', style: 'destructive', onPress: () => onDelete(route.id) },
            ])
          }
        >
          <Trash2 size={16} color={ThemeColors.dangerRed} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const StatItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function RoutesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('my');
  const [importedRoutes, setImportedRoutes] = useState<RouteData[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const loadImportedRoutes = useCallback(async () => {
    const routes = await AppStorage.getImportedRoutes();
    setImportedRoutes(routes);
  }, []);

  useEffect(() => {
    let mounted = true;
    AppStorage.getImportedRoutes().then((routes) => {
      if (mounted) setImportedRoutes(routes);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectRoute = (route: RouteData) => {
    router.push({ pathname: '/prepare', params: { routeId: route.id } });
  };

  const handleDeleteImported = async (id: string) => {
    await AppStorage.deleteImportedRoute(id);
    await loadImportedRoutes();
  };

  const handleImportGpx = async () => {
    try {
      setIsImporting(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/gpx+xml', 'text/xml', 'application/xml', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsImporting(false);
        return;
      }

      const asset = result.assets[0];
      const filename = asset.name || 'track.gpx';

      const response = await fetch(asset.uri);
      const gpxContent = await response.text();

      const parsed = parseGpxString(gpxContent, filename);

      if (!parsed.success || !parsed.route) {
        Alert.alert(
          'Ошибка импорта GPX',
          parsed.error || 'Не удалось разобрать файл GPX.'
        );
        return;
      }

      await AppStorage.saveImportedRoute(parsed.route);
      await loadImportedRoutes();

      Alert.alert(
        '✅ GPX сохранён в каталог',
        `Маршрут «${parsed.route.name}» успешно сохранён.\n${parsed.route.coordinates.length} точек, ${parsed.route.distanceKm} км.`
      );
    } catch (e) {
      Alert.alert('Ошибка', `Не удалось прочитать файл: ${String(e)}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.tabActive]}
          onPress={() => setActiveTab('my')}
        >
          <FolderOpen size={15} color={activeTab === 'my' ? ThemeColors.accentGreen : ThemeColors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
            Мои маршруты
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'catalog' && styles.tabActive]}
          onPress={() => setActiveTab('catalog')}
        >
          <FileText size={15} color={activeTab === 'catalog' ? ThemeColors.accentGreen : ThemeColors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'catalog' && styles.tabTextActive]}>
            Каталог GPX
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={[styles.importButton, isImporting && styles.importButtonDisabled]}
          onPress={handleImportGpx}
          disabled={isImporting}
          activeOpacity={0.8}
        >
          {isImporting ? (
            <ActivityIndicator color={ThemeColors.accentGreen} />
          ) : (
            <View style={styles.importBtnContent}>
              <UploadCloud size={20} color={ThemeColors.accentGreen} />
              <Text style={styles.importButtonText}>
                Загрузить GPX файл в каталог
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {importedRoutes.length === 0 ? (
          <View style={styles.emptyState}>
            <Map size={48} color={ThemeColors.textMuted} />
            <Text style={styles.emptyTitle}>Каталог пуст</Text>
            <Text style={styles.emptyText}>
              Загрузите GPX файл выше.{'\n'}Все загруженные маршруты сохраняются на устройстве.
            </Text>
          </View>
        ) : (
          importedRoutes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              onSelect={handleSelectRoute}
              onDelete={handleDeleteImported}
              badge="GPX Сохранён"
              badgeColor={ThemeColors.safeGreen}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}ч ${m}мин`;
  if (h > 0) return `${h}ч`;
  return `${m}мин`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: ThemeColors.navDark,
    paddingHorizontal: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.cardBorder,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: ThemeColors.accentGreen,
  },
  tabText: {
    color: ThemeColors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: ThemeColors.textPrimary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  importButton: {
    borderWidth: 1.5,
    borderColor: ThemeColors.accentGreen,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  importBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  importButtonDisabled: {
    opacity: 0.6,
  },
  importButtonText: {
    color: ThemeColors.accentGreen,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: {
    color: ThemeColors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: {
    color: ThemeColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: ThemeColors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  sourceBadgeText: {
    color: '#062E21',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '800',
    color: ThemeColors.textPrimary,
    marginBottom: 12,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ThemeColors.cardBgSubtle,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
    color: ThemeColors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: ThemeColors.textSecondary,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: ThemeColors.cardBorder,
  },
  pointsBox: {
    marginBottom: 14,
    gap: 6,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointText: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
  },
  pointBold: {
    color: ThemeColors.textPrimary,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  openButton: {
    flex: 1,
    backgroundColor: ThemeColors.buttonPrimaryBg,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  openButtonText: {
    color: ThemeColors.buttonPrimaryText,
    fontSize: 13,
    fontWeight: '800',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
});
