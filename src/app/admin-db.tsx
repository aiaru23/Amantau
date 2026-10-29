import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Database, RefreshCw, FileText, Trash2, Search, FolderOpen, Key, Phone, Lock, User, FileCode, Clock, MessageSquare, X } from 'lucide-react-native';
import { ThemeColors } from '../constants/theme';
import { authService, UserProfile } from '../services/authService';

export default function AdminDbScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [jsonModalVisible, setJsonModalVisible] = useState(false);

  const loadDatabase = useCallback(async () => {
    setLoading(true);
    const all = await authService.getAllUsers();
    setUsers(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    authService.getAllUsers().then((all) => {
      if (mounted) setUsers(all);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleDeleteUser = (user: UserProfile) => {
    Alert.alert(
      'Удалить запись?',
      `Пользователь «${user.username}» (${user.phoneNumber}) будет полностью удалён из БД.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            await authService.deleteUser(user.id);
            await loadDatabase();
            Alert.alert('✅ Удалено', `Запись «${user.username}» удалена из БД.`);
          },
        },
      ]
    );
  };

  const handleClearDatabase = () => {
    Alert.alert(
      'Очистить базу пользователей?',
      'Все аккаунты, зарегистрированные в AmanTau, будут удалены из локального хранилища!',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Очистить всё',
          style: 'destructive',
          onPress: async () => {
            await authService.clearUsersDatabase();
            await loadDatabase();
            Alert.alert('Очищено', 'База данных пользователей полностью очищена.');
          },
        },
      ]
    );
  };

  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.username.toLowerCase().includes(q) ||
      u.phoneNumber.includes(q) ||
      u.id.toLowerCase().includes(q) ||
      (u.password && u.password.toLowerCase().includes(q))
    );
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <Database size={22} color={ThemeColors.accentGreen} />
            <Text style={styles.title}>База данных пользователей</Text>
          </View>
          <Text style={styles.subtitle}>
            Сохранённые профили и параметры учетных записей ({users.length})
          </Text>
        </View>

        {/* Global Action Bar */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={loadDatabase}
            disabled={loading}
          >
            <RefreshCw size={13} color={ThemeColors.textPrimary} />
            <Text style={styles.actionBtnText}>
              {loading ? 'Загрузка...' : 'Обновить'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.jsonBtn}
            onPress={() => setJsonModalVisible(true)}
          >
            <FileCode size={13} color={ThemeColors.textPrimary} />
            <Text style={styles.actionBtnText}>JSON Формат</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearBtn} onPress={handleClearDatabase}>
            <Trash2 size={13} color="#F87171" />
            <Text style={styles.clearBtnText}>Очистить БД</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Search size={15} color={ThemeColors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск по имени, телефону, ID..."
            placeholderTextColor={ThemeColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Database Users Cards */}
        {filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <FolderOpen size={42} color={ThemeColors.textMuted} />
            <Text style={styles.emptyTitle}>Записи не найдены</Text>
            <Text style={styles.emptySubtext}>
              В базе данных пока нет зарегистрированных аккаунтов.
            </Text>
          </View>
        ) : (
          filtered.map((u, index) => {
            const formattedDate = new Date(u.createdAt).toLocaleString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <View key={u.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordIndex}>#{index + 1}</Text>
                  <Text style={styles.recordAvatar}>{u.avatarEmoji || '🥾'}</Text>
                  <Text style={styles.recordUsername}>{u.username}</Text>
                  <TouchableOpacity
                    style={styles.deleteUserBtn}
                    onPress={() => handleDeleteUser(u)}
                  >
                    <Trash2 size={14} color="#F87171" />
                  </TouchableOpacity>
                </View>

                <View style={styles.fieldsGrid}>
                  <View style={styles.fieldRow}>
                    <View style={styles.keyGroup}>
                      <Key size={11} color={ThemeColors.textMuted} />
                      <Text style={styles.fieldKey}>ID записи:</Text>
                    </View>
                    <Text style={styles.fieldValMono}>{u.id}</Text>
                  </View>

                  <View style={styles.fieldRow}>
                    <View style={styles.keyGroup}>
                      <Phone size={11} color={ThemeColors.textMuted} />
                      <Text style={styles.fieldKey}>Телефон:</Text>
                    </View>
                    <Text style={styles.fieldValLime}>{u.phoneNumber}</Text>
                  </View>

                  <View style={styles.fieldRow}>
                    <View style={styles.keyGroup}>
                      <Lock size={11} color={ThemeColors.textMuted} />
                      <Text style={styles.fieldKey}>Пароль:</Text>
                    </View>
                    <Text style={styles.fieldValPassword}>{u.password || '—'}</Text>
                  </View>

                  <View style={styles.fieldRow}>
                    <View style={styles.keyGroup}>
                      <User size={11} color={ThemeColors.textMuted} />
                      <Text style={styles.fieldKey}>Опыт:</Text>
                    </View>
                    <Text style={styles.fieldVal}>{u.experienceLevel || 'Любитель'}</Text>
                  </View>

                  <View style={styles.fieldRow}>
                    <View style={styles.keyGroup}>
                      <FileText size={11} color={ThemeColors.textMuted} />
                      <Text style={styles.fieldKey}>О себе:</Text>
                    </View>
                    <Text style={styles.fieldVal}>{u.bio || '—'}</Text>
                  </View>

                  <View style={styles.fieldRow}>
                    <View style={styles.keyGroup}>
                      <Clock size={11} color={ThemeColors.textMuted} />
                      <Text style={styles.fieldKey}>Регистрация:</Text>
                    </View>
                    <Text style={styles.fieldVal}>{formattedDate}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.chatLinkBtn}
                  onPress={() => {
                    router.push({
                      pathname: '/chat',
                      params: {
                        recipientId: u.id,
                        recipientName: u.username,
                        recipientPhone: u.phoneNumber,
                        avatarEmoji: u.avatarEmoji || '🥾',
                      },
                    });
                  }}
                >
                  <MessageSquare size={13} color={ThemeColors.accentGreen} />
                  <Text style={styles.chatLinkBtnText}>Написать пользователю в чат</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

      </ScrollView>

      {/* RAW JSON VIEW MODAL */}
      <Modal
        visible={jsonModalVisible}
        animationType="slide"
        onRequestClose={() => setJsonModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Исходный JSON базы данных</Text>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setJsonModalVisible(false)}
            >
              <X size={14} color="#FFFFFF" />
              <Text style={styles.closeModalBtnText}>Закрыть</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.jsonScrollView}>
            <Text style={styles.jsonText}>{JSON.stringify(users, null, 2)}</Text>
          </ScrollView>
        </SafeAreaView>
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
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  header: {
    marginBottom: 2,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: ThemeColors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: ThemeColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  refreshBtn: {
    flex: 1,
    backgroundColor: ThemeColors.buttonSecondaryBg,
    borderColor: ThemeColors.cardBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  jsonBtn: {
    flex: 1,
    backgroundColor: ThemeColors.buttonSecondaryBg,
    borderColor: ThemeColors.cardBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  clearBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnText: {
    color: ThemeColors.textPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  clearBtnText: {
    color: '#F87171',
    fontWeight: '700',
    fontSize: 12,
  },
  searchBox: {
    backgroundColor: ThemeColors.cardBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    color: ThemeColors.textPrimary,
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: ThemeColors.cardBg,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  emptyTitle: {
    color: ThemeColors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtext: {
    color: ThemeColors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  recordCard: {
    backgroundColor: ThemeColors.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.cardBorder,
  },
  recordIndex: {
    color: ThemeColors.accentGreen,
    fontWeight: '800',
    fontSize: 13,
  },
  recordAvatar: {
    fontSize: 20,
  },
  recordUsername: {
    flex: 1,
    color: ThemeColors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  deleteUserBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  fieldsGrid: {
    gap: 4,
    marginBottom: 10,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  keyGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  fieldKey: {
    color: ThemeColors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  fieldVal: {
    color: ThemeColors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  fieldValMono: {
    color: ThemeColors.textSecondary,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  fieldValLime: {
    color: ThemeColors.accentGreen,
    fontSize: 12,
    fontWeight: '700',
  },
  fieldValPassword: {
    color: ThemeColors.warningYellow,
    fontSize: 12,
    fontWeight: '700',
  },
  chatLinkBtn: {
    backgroundColor: ThemeColors.cardBgSubtle,
    borderColor: ThemeColors.cardBorder,
    borderWidth: 1,
    paddingVertical: 9,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  chatLinkBtnText: {
    color: ThemeColors.accentGreen,
    fontWeight: '700',
    fontSize: 12,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.cardBorder,
  },
  modalTitle: {
    color: ThemeColors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  closeModalBtn: {
    backgroundColor: ThemeColors.buttonDangerBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  jsonScrollView: {
    flex: 1,
    padding: 16,
  },
  jsonText: {
    color: ThemeColors.accentGreen,
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
});
