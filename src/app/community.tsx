import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Users, Search, MessageSquare, Edit3, LogOut, UserPlus, Compass, Phone } from 'lucide-react-native';
import { ThemeColors } from '../constants/theme';
import { authService, UserProfile } from '../services/authService';
import { chatService } from '../services/chatService';

const AVATAR_OPTIONS = ['🥾', '🏔️', '🎒', '🧗', '⛺', '🌲', '🏃', '🚴'];
const EXPERIENCE_LEVELS = ['Новичок', 'Любитель', 'Продвинутый', 'Эксперт'];

export default function CommunityScreen() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [lastMessages, setLastMessages] = useState<Record<string, { timestamp: number; text: string }>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLevel, setEditLevel] = useState('Любитель');
  const [editAvatar, setEditAvatar] = useState('🥾');

  useEffect(() => {
    let mounted = true;

    const fetchAllData = () => {
      authService.initSession().then((curr) => {
        if (!mounted) return;
        setCurrentUser(curr);
        authService.getAllUsers().then((all) => {
          if (!mounted) return;
          setUsersList(all);
          if (curr) {
            chatService.getUnreadCounts(curr.id).then((counts) => {
              if (mounted) setUnreadCounts(counts);
            });
            chatService.getLastMessageTimestamps(curr.id).then((timestamps) => {
              if (mounted) setLastMessages(timestamps);
            });
          }
        });
      });
    };

    fetchAllData();
    const interval = setInterval(fetchAllData, 2000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const openEditProfile = () => {
    if (!currentUser) return;
    setEditUsername(currentUser.username);
    setEditBio(currentUser.bio || '');
    setEditLevel(currentUser.experienceLevel || 'Любитель');
    setEditAvatar(currentUser.avatarEmoji || '🥾');
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editUsername.trim()) {
      Alert.alert('Ошибка', 'Имя не может быть пустым.');
      return;
    }

    const updated = await authService.updateProfile({
      username: editUsername.trim(),
      bio: editBio.trim(),
      experienceLevel: editLevel,
      avatarEmoji: editAvatar,
    });

    if (updated) {
      setCurrentUser(updated);
      setShowEditModal(false);
      Alert.alert('✅ Успешно', 'Ваш профиль обновлён!');
    }
  };

  const filteredUsers = usersList
    .filter((u) => {
      if (currentUser && u.id === currentUser.id) return false;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        u.username.toLowerCase().includes(q) ||
        u.phoneNumber.includes(q) ||
        (u.bio && u.bio.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      const timeA = lastMessages[a.id]?.timestamp || 0;
      const timeB = lastMessages[b.id]?.timestamp || 0;
      return timeB - timeA;
    });

  const handleStartChat = (user: UserProfile) => {
    router.push({
      pathname: '/chat',
      params: {
        recipientId: user.id,
        recipientName: user.username,
        recipientPhone: user.phoneNumber,
        avatarEmoji: user.avatarEmoji || '🥾',
      },
    });
  };

  const handleLogout = async () => {
    await authService.logout();
    router.replace('/auth');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Current User Profile Banner */}
        {currentUser ? (
          <View style={styles.currentUserCard}>
            <View style={styles.userHeaderRow}>
              <Text style={styles.userAvatar}>{currentUser.avatarEmoji || '🥾'}</Text>
              <View style={styles.userInfoBlock}>
                <Text style={styles.userName}>{currentUser.username}</Text>
                <Text style={styles.userPhone}>📱 {currentUser.phoneNumber}</Text>
                <Text style={styles.userLevel}>Опыт: {currentUser.experienceLevel || 'Любитель'}</Text>
              </View>

              <View style={styles.userActions}>
                <TouchableOpacity style={styles.editBtn} onPress={openEditProfile}>
                  <Edit3 size={13} color={ThemeColors.accentGreen} />
                  <Text style={styles.editBtnText}>Изменить</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                  <LogOut size={13} color="#F87171" />
                  <Text style={styles.logoutBtnText}>Выход</Text>
                </TouchableOpacity>
              </View>
            </View>

            {currentUser.bio && (
              <Text style={styles.userBio}>«{currentUser.bio}»</Text>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.loginPromptCard}
            onPress={() => router.push('/auth')}
          >
            <UserPlus size={24} color={ThemeColors.accentGreen} />
            <View style={styles.loginPromptTextGroup}>
              <Text style={styles.loginPromptTitle}>Войти в аккаунт AmanTau</Text>
              <Text style={styles.loginPromptText}>
                Зарегистрируйтесь по номеру телефона, чтобы общаться с туристами.
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Search size={16} color={ThemeColors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск единомышленников..."
            placeholderTextColor={ThemeColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleGroup}>
            <Users size={16} color={ThemeColors.accentGreen} />
            <Text style={styles.sectionTitle}>Попутчики в горы</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Пользователи со свежими сообщениями автоматически поднимаются наверх
          </Text>
        </View>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Compass size={42} color={ThemeColors.textMuted} />
            <Text style={styles.emptyTitle}>Попутчики не найдены</Text>
            <Text style={styles.emptyText}>
              Зарегистрируйтесь со второго устройства под другим номером (например: Test2) чтобы проверить реальный чат!
            </Text>
          </View>
        ) : (
          filteredUsers.map((user) => {
            const unreadCount = unreadCounts[user.id] || 0;
            const lastMsg = lastMessages[user.id];

            return (
              <View key={user.id} style={[styles.hikerCard, unreadCount > 0 && styles.hikerCardUnread]}>
                <View style={styles.hikerHeader}>
                  <Text style={styles.hikerAvatar}>{user.avatarEmoji || '🥾'}</Text>
                  <View style={styles.hikerInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.hikerName}>{user.username}</Text>
                      {unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>+{unreadCount} новых</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.phoneRow}>
                      <Phone size={11} color={ThemeColors.textSecondary} />
                      <Text style={styles.hikerPhone}>{user.phoneNumber}</Text>
                    </View>
                  </View>
                  <View style={styles.experienceBadge}>
                    <Text style={styles.experienceBadgeText}>
                      {user.experienceLevel || 'Любитель'}
                    </Text>
                  </View>
                </View>

                {lastMsg ? (
                  <View style={styles.lastMsgBox}>
                    <MessageSquare size={12} color={ThemeColors.accentGreen} />
                    <Text style={styles.lastMsgText} numberOfLines={1}>
                      {lastMsg.text}
                    </Text>
                  </View>
                ) : user.bio ? (
                  <Text style={styles.hikerBio}>«{user.bio}»</Text>
                ) : null}

                <TouchableOpacity
                  style={[styles.chatBtn, unreadCount > 0 && styles.chatBtnUnread]}
                  onPress={() => handleStartChat(user)}
                  activeOpacity={0.85}
                >
                  <MessageSquare size={15} color={unreadCount > 0 ? '#FFFFFF' : ThemeColors.buttonPrimaryText} />
                  <Text style={[styles.chatBtnText, unreadCount > 0 && styles.chatBtnUnreadText]}>
                    {unreadCount > 0 ? `Открыть чат (${unreadCount} новых)` : 'Написать в чат'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

      </ScrollView>

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Редактирование профиля</Text>

            {/* Avatar Picker */}
            <Text style={styles.fieldLabel}>Выберите иконку:</Text>
            <View style={styles.avatarRow}>
              {AVATAR_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.avatarChip,
                    editAvatar === emoji && styles.selectedAvatarChip,
                  ]}
                  onPress={() => setEditAvatar(emoji)}
                >
                  <Text style={styles.avatarChipText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Username */}
            <Text style={styles.fieldLabel}>Имя пользователя:</Text>
            <TextInput
              style={styles.modalInput}
              value={editUsername}
              onChangeText={setEditUsername}
              placeholder="Введите имя..."
              placeholderTextColor={ThemeColors.textMuted}
            />

            {/* Experience Level */}
            <Text style={styles.fieldLabel}>Уровень опыта в горах:</Text>
            <View style={styles.levelRow}>
              {EXPERIENCE_LEVELS.map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  style={[
                    styles.levelChip,
                    editLevel === lvl && styles.selectedLevelChip,
                  ]}
                  onPress={() => setEditLevel(lvl)}
                >
                  <Text
                    style={[
                      styles.levelChipText,
                      editLevel === lvl && styles.selectedLevelChipText,
                    ]}
                  >
                    {lvl}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bio */}
            <Text style={styles.fieldLabel}>О себе / Предпочтения в трекинге:</Text>
            <TextInput
              style={[styles.modalInput, { height: 70 }]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Расскажите о любимых маршрутах..."
              placeholderTextColor={ThemeColors.textMuted}
              multiline
            />

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Отмена</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveProfile}
              >
                <Text style={styles.modalSaveBtnText}>Сохранить</Text>
              </TouchableOpacity>
            </View>
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
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  currentUserCard: {
    backgroundColor: ThemeColors.cardBg,
    borderColor: ThemeColors.accentGreen,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  userHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    fontSize: 34,
  },
  userInfoBlock: {
    flex: 1,
  },
  userName: {
    color: ThemeColors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  userPhone: {
    color: ThemeColors.accentGreen,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  userLevel: {
    color: ThemeColors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  userActions: {
    gap: 6,
    alignItems: 'flex-end',
  },
  editBtn: {
    backgroundColor: ThemeColors.buttonSecondaryBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editBtnText: {
    color: ThemeColors.accentGreen,
    fontWeight: '700',
    fontSize: 11,
  },
  logoutBtn: {
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
  logoutBtnText: {
    color: '#F87171',
    fontWeight: '700',
    fontSize: 11,
  },
  userBio: {
    color: ThemeColors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: ThemeColors.cardBorder,
  },
  loginPromptCard: {
    backgroundColor: ThemeColors.cardBg,
    borderColor: ThemeColors.accentGreen,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loginPromptTextGroup: {
    flex: 1,
  },
  loginPromptTitle: {
    color: ThemeColors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  loginPromptText: {
    color: ThemeColors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  searchBox: {
    backgroundColor: ThemeColors.cardBg,
    borderRadius: 12,
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
    paddingVertical: 10,
    color: ThemeColors.textPrimary,
    fontSize: 13,
  },
  sectionHeader: {
    marginTop: 2,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: ThemeColors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: ThemeColors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: ThemeColors.cardBg,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
    gap: 8,
  },
  emptyTitle: {
    color: ThemeColors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    color: ThemeColors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  hikerCard: {
    backgroundColor: ThemeColors.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  hikerCardUnread: {
    borderColor: ThemeColors.accentGreen,
    backgroundColor: ThemeColors.cardBgSubtle,
  },
  hikerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  hikerAvatar: {
    fontSize: 30,
  },
  hikerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hikerName: {
    color: ThemeColors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  unreadBadge: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.3)',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  unreadBadgeText: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '800',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  hikerPhone: {
    color: ThemeColors.textSecondary,
    fontSize: 11,
  },
  experienceBadge: {
    backgroundColor: ThemeColors.cardBgSubtle,
    borderColor: ThemeColors.cardBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  experienceBadgeText: {
    color: ThemeColors.accentGreen,
    fontSize: 10,
    fontWeight: '700',
  },
  lastMsgBox: {
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lastMsgText: {
    color: ThemeColors.accentGreen,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  hikerBio: {
    color: ThemeColors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  chatBtn: {
    backgroundColor: ThemeColors.buttonPrimaryBg,
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  chatBtnUnread: {
    backgroundColor: ThemeColors.dangerRed,
  },
  chatBtnText: {
    color: ThemeColors.buttonPrimaryText,
    fontSize: 13,
    fontWeight: '800',
  },
  chatBtnUnreadText: {
    color: '#FFFFFF',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: ThemeColors.cardBg,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
    gap: 10,
  },
  modalTitle: {
    color: ThemeColors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  fieldLabel: {
    color: ThemeColors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  modalInput: {
    backgroundColor: ThemeColors.cardBgSubtle,
    borderColor: ThemeColors.cardBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: ThemeColors.textPrimary,
    fontSize: 13,
  },
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  avatarChip: {
    backgroundColor: ThemeColors.cardBgSubtle,
    borderColor: ThemeColors.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
  },
  selectedAvatarChip: {
    borderColor: ThemeColors.accentGreen,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  avatarChipText: {
    fontSize: 20,
  },
  levelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  levelChip: {
    backgroundColor: ThemeColors.cardBgSubtle,
    borderColor: ThemeColors.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  selectedLevelChip: {
    backgroundColor: ThemeColors.accentGreen,
    borderColor: ThemeColors.accentGreen,
  },
  levelChipText: {
    color: ThemeColors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  selectedLevelChipText: {
    color: ThemeColors.buttonPrimaryText,
    fontWeight: '900',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: ThemeColors.buttonSecondaryBg,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  modalCancelBtnText: {
    color: ThemeColors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  modalSaveBtn: {
    flex: 1.5,
    backgroundColor: ThemeColors.buttonPrimaryBg,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    color: ThemeColors.buttonPrimaryText,
    fontWeight: '800',
    fontSize: 13,
  },
});
