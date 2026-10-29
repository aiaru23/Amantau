import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Compass, User, Phone, Lock } from 'lucide-react-native';
import { ThemeColors } from '../constants/theme';
import { authService } from '../services/authService';

type AuthMode = 'login' | 'register';

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('register');

  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    if (mode === 'register') {
      const res = await authService.register(username, phoneNumber, password);
      setLoading(false);

      if (!res.success) {
        Alert.alert('Ошибка регистрации', res.error || 'Не удалось зарегистрироваться.');
        return;
      }

      Alert.alert('✅ Успешно', `Добро пожаловать в AmanTau, ${res.user?.username}!`);
      router.replace('/community');
    } else {
      const res = await authService.login(phoneNumber, password);
      setLoading(false);

      if (!res.success) {
        Alert.alert('Ошибка входа', res.error || 'Неверный телефон или пароль.');
        return;
      }

      Alert.alert('✅ Успешно', `Вы вошли как ${res.user?.username}`);
      router.replace('/community');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <Compass size={32} color={ThemeColors.accentGreen} />
          </View>
          <Text style={styles.title}>AmanTau ID</Text>
          <Text style={styles.subtitle}>
            {mode === 'register'
              ? 'Создайте аккаунт для поиска единомышленников и общения'
              : 'Войдите в свой профиль для общения с туристами'}
          </Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, mode === 'register' && styles.activeTabBtn]}
            onPress={() => setMode('register')}
          >
            <Text style={[styles.tabBtnText, mode === 'register' && styles.activeTabBtnText]}>
              Регистрация
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, mode === 'login' && styles.activeTabBtn]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.tabBtnText, mode === 'login' && styles.activeTabBtnText]}>
              Вход
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {mode === 'register' && (
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <User size={13} color={ThemeColors.textSecondary} />
                <Text style={styles.fieldLabel}>Имя пользователя</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Например: Арман_Алматы"
                placeholderTextColor={ThemeColors.textMuted}
                value={username}
                onChangeText={setUsername}
              />
            </View>
          )}

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Phone size={13} color={ThemeColors.textSecondary} />
              <Text style={styles.fieldLabel}>Номер телефона (1 аккаунт на номер)</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="+7 701 123 45 67"
              placeholderTextColor={ThemeColors.textMuted}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Lock size={13} color={ThemeColors.textSecondary} />
              <Text style={styles.fieldLabel}>Пароль</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={ThemeColors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>
              {loading
                ? 'Загрузка...'
                : mode === 'register'
                ? 'Создать аккаунт'
                : 'Войти в аккаунт'}
            </Text>
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
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: ThemeColors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  title: {
    color: ThemeColors.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },
  subtitle: {
    color: ThemeColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: ThemeColors.cardBg,
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 9,
  },
  activeTabBtn: {
    backgroundColor: ThemeColors.accentGreen,
  },
  tabBtnText: {
    color: ThemeColors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  activeTabBtnText: {
    color: ThemeColors.buttonPrimaryText,
    fontWeight: '900',
  },
  formCard: {
    backgroundColor: ThemeColors.cardBg,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    color: ThemeColors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    backgroundColor: ThemeColors.cardBgSubtle,
    borderColor: ThemeColors.cardBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: ThemeColors.textPrimary,
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: ThemeColors.buttonPrimaryBg,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: ThemeColors.buttonPrimaryText,
    fontSize: 15,
    fontWeight: '800',
  },
});
