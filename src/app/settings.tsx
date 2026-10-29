import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { Database, FolderOpen, Phone, ShieldAlert, Bell, Vibrate, Check, Gamepad2, Play, Lock, Trash2, Plus } from 'lucide-react-native';
import { ru } from '../locales/ru';
import { ThemeColors } from '../constants/theme';
import { AppStorage } from '../database/storage';
import { locationService } from '../services/locationService';
import { alertService } from '../services/alertService';
import { DemoScenario } from '../types/location';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();

  const [emergencyContact, setEmergencyContact] = useState('');
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [demoModeEnabled, setDemoModeEnabled] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>('NORMAL');

  const [alertEnabled, setAlertEnabled] = useState(true);
  const [alertWarningM, setAlertWarningM] = useState(30);
  const [alertDangerM, setAlertDangerM] = useState(50);

  const [sosContacts, setSosContacts] = useState<string[]>([]);
  const [newContact, setNewContact] = useState('');

  useEffect(() => {
    let isMounted = true;
    setTimeout(() => {
      Promise.all([
        AppStorage.getEmergencyContact(),
        AppStorage.getDemoMode(),
        AppStorage.getDemoScenario(),
        AppStorage.getAlertEnabled(),
        AppStorage.getAlertWarningMeters(),
        AppStorage.getAlertDangerMeters(),
        AppStorage.getSosContacts(),
      ]).then(([contact, demo, scenario, aEnabled, aWarn, aDanger, contacts]) => {
        if (!isMounted) return;
        setEmergencyContact(contact);
        setDemoModeEnabled(demo);
        setSelectedScenario(scenario);
        setAlertEnabled(aEnabled);
        setAlertWarningM(aWarn);
        setAlertDangerM(aDanger);
        setSosContacts(contacts);
        if (demo) {
          locationService.setDemoMode(true, scenario);
        }
        alertService.configure({ isEnabled: aEnabled, warningThresholdMeters: aWarn, dangerThresholdMeters: aDanger });
      });
    }, 0);

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveContact = async () => {
    await AppStorage.setEmergencyContact(emergencyContact);
    setIsEditingContact(false);
    Alert.alert('Успешно', 'Экстренный контакт сохранён.');
  };

  const handleAddSosContact = async () => {
    const trimmed = newContact.trim();
    if (!trimmed) return;
    const updated = [...sosContacts, trimmed];
    setSosContacts(updated);
    await AppStorage.setSosContacts(updated);
    setNewContact('');
    Alert.alert('✅ Добавлено', `Контакт «${trimmed}» добавлен в список SOS.`);
  };

  const handleRemoveSosContact = async (index: number) => {
    const updated = sosContacts.filter((_, i) => i !== index);
    setSosContacts(updated);
    await AppStorage.setSosContacts(updated);
  };

  const handleToggleAlert = async (value: boolean) => {
    setAlertEnabled(value);
    await AppStorage.setAlertEnabled(value);
    alertService.configure({ isEnabled: value });
  };

  const handleTestAlert = async () => {
    await alertService.testAlert('danger');
    Alert.alert('🔔 Тест', 'Вибрация сработала! Если не ощутили — проверьте настройки звука.');
  };

  const handleToggleDemoMode = async (value: boolean) => {
    setDemoModeEnabled(value);
    await AppStorage.setDemoMode(value);
    locationService.setDemoMode(value, selectedScenario);
  };

  const handleSelectScenario = (scenario: DemoScenario) => {
    setSelectedScenario(scenario);
    setDemoModeEnabled(true);
    locationService.setDemoScenario(scenario);

    if (scenario === 'SOS') {
      router.push({
        pathname: '/sos',
        params: {
          lat: 43.0601 + 0.0034,
          lng: 76.995 + 0.0031,
          alt: 2430,
          routeName: 'Большой Алматинский маршрут',
          deviation: 380,
          traveled: 4700,
          duration: 13335,
        },
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Database Viewer Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderGroup}>
            <Database size={15} color={ThemeColors.accentGreen} />
            <Text style={styles.sectionHeader}>База данных аккаунтов</Text>
          </View>
          <TouchableOpacity
            style={styles.adminDbBtn}
            onPress={() => router.push('/admin-db' as any)}
          >
            <FolderOpen size={16} color={ThemeColors.accentGreen} />
            <Text style={styles.adminDbBtnText}>Просмотр всех пользователей и БД</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderGroup}>
            <Phone size={15} color={ThemeColors.accentGreen} />
            <Text style={styles.sectionHeader}>{ru.settings.emergencyContactSection}</Text>
          </View>

          {emergencyContact && !isEditingContact ? (
            <View style={styles.contactSavedBox}>
              <Text style={styles.contactLabel}>{ru.settings.savedContact}</Text>
              <Text style={styles.contactValue}>{emergencyContact}</Text>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => setIsEditingContact(true)}
              >
                <Text style={styles.editBtnText}>Изменить</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.contactInputBox}>
              <TextInput
                style={styles.textInput}
                placeholder="Имя / Телефон (+7 701 123 45 67)"
                placeholderTextColor={ThemeColors.textMuted}
                value={emergencyContact}
                onChangeText={setEmergencyContact}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveContact}>
                <Text style={styles.saveBtnText}>{ru.settings.addContactBtn}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderGroup}>
            <ShieldAlert size={15} color={ThemeColors.accentGreen} />
            <Text style={styles.sectionHeader}>SOS-контакты МЧС</Text>
          </View>
          <Text style={styles.sectionSubtext}>
            При подтверждении SOS SMS отправляется всем контактам из списка.
          </Text>

          {sosContacts.map((contact, i) => (
            <View key={i} style={styles.contactRow}>
              <Text style={styles.contactValue}>{contact}</Text>
              <TouchableOpacity
                onPress={() => Alert.alert('Удалить контакт?', contact, [
                  { text: 'Отмена', style: 'cancel' },
                  { text: 'Удалить', style: 'destructive', onPress: () => handleRemoveSosContact(i) },
                ])}
              >
                <Trash2 size={15} color="#F87171" />
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.contactInputBox}>
            <TextInput
              style={styles.textInput}
              placeholder="+7 701 123 45 67"
              placeholderTextColor={ThemeColors.textMuted}
              value={newContact}
              onChangeText={setNewContact}
              keyboardType="phone-pad"
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddSosContact}>
              <Plus size={14} color={ThemeColors.buttonPrimaryText} />
              <Text style={styles.saveBtnText}>Добавить контакт</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.rowItem}>
            <View style={{ flex: 1 }}>
              <View style={styles.sectionHeaderGroup}>
                <Bell size={15} color={ThemeColors.accentGreen} />
                <Text style={styles.sectionHeader}>Вибро-алерты при отклонении</Text>
              </View>
              <Text style={styles.sectionSubtext}>
                Вибрация при сходе с маршрута
              </Text>
            </View>
            <Switch
              value={alertEnabled}
              onValueChange={handleToggleAlert}
              trackColor={{ false: ThemeColors.cardBorder, true: ThemeColors.accentGreen }}
              thumbColor={alertEnabled ? '#FFFFFF' : ThemeColors.textMuted}
            />
          </View>

          {alertEnabled && (
            <View style={styles.alertThresholdsBox}>
              <View style={styles.thresholdRow}>
                <Text style={styles.thresholdLabel}>Предупреждение:</Text>
                <View style={styles.thresholdControls}>
                  <TouchableOpacity
                    style={styles.thresholdBtn}
                    onPress={async () => { const v = Math.max(10, alertWarningM - 10); setAlertWarningM(v); await AppStorage.setAlertWarningMeters(v); alertService.configure({ warningThresholdMeters: v }); }}
                  >
                    <Text style={styles.thresholdBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.thresholdValue}>{alertWarningM} м</Text>
                  <TouchableOpacity
                    style={styles.thresholdBtn}
                    onPress={async () => { const v = Math.min(alertDangerM - 5, alertWarningM + 10); setAlertWarningM(v); await AppStorage.setAlertWarningMeters(v); alertService.configure({ warningThresholdMeters: v }); }}
                  >
                    <Text style={styles.thresholdBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.thresholdRow}>
                <Text style={styles.thresholdLabel}>Опасность:</Text>
                <View style={styles.thresholdControls}>
                  <TouchableOpacity
                    style={styles.thresholdBtn}
                    onPress={async () => { const v = Math.max(alertWarningM + 5, alertDangerM - 10); setAlertDangerM(v); await AppStorage.setAlertDangerMeters(v); alertService.configure({ dangerThresholdMeters: v }); }}
                  >
                    <Text style={styles.thresholdBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.thresholdValue}>{alertDangerM} м</Text>
                  <TouchableOpacity
                    style={styles.thresholdBtn}
                    onPress={async () => { const v = alertDangerM + 10; setAlertDangerM(v); await AppStorage.setAlertDangerMeters(v); alertService.configure({ dangerThresholdMeters: v }); }}
                  >
                    <Text style={styles.thresholdBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.testAlertBtn} onPress={handleTestAlert}>
                <Vibrate size={14} color={ThemeColors.accentGreen} />
                <Text style={styles.testAlertBtnText}>Тест вибрации</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>{ru.settings.unitsSection}</Text>
          <View style={styles.rowItem}>
            <Text style={styles.rowLabel}>{ru.settings.unitsMetric}</Text>
            <Check size={16} color={ThemeColors.accentGreen} />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.rowItem}>
            <View style={{ flex: 1 }}>
              <View style={styles.sectionHeaderGroup}>
                <Gamepad2 size={15} color={ThemeColors.accentGreen} />
                <Text style={styles.demoTitle}>{ru.settings.demoModeSection}</Text>
              </View>
              <Text style={styles.demoSubtext}>Симуляция движения и тревог для презентации жюри</Text>
            </View>
            <Switch
              value={demoModeEnabled}
              onValueChange={handleToggleDemoMode}
              trackColor={{ false: ThemeColors.cardBorder, true: ThemeColors.accentGreen }}
              thumbColor={demoModeEnabled ? '#FFFFFF' : ThemeColors.textMuted}
            />
          </View>

          {demoModeEnabled && (
            <View style={styles.presetsBox}>
              <Text style={styles.presetsTitle}>{ru.settings.demoPresetTitle}</Text>

              <TouchableOpacity
                style={[
                  styles.presetBtn,
                  selectedScenario === 'NORMAL' && styles.selectedPresetBtn,
                ]}
                onPress={() => handleSelectScenario('NORMAL')}
              >
                <Text style={[styles.presetBtnText, selectedScenario === 'NORMAL' && styles.selectedPresetBtnText]}>
                  {ru.settings.demoPresets.normal}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetBtn,
                  selectedScenario === 'SLIGHT_DEVIATION' && styles.selectedPresetBtn,
                ]}
                onPress={() => handleSelectScenario('SLIGHT_DEVIATION')}
              >
                <Text style={[styles.presetBtnText, selectedScenario === 'SLIGHT_DEVIATION' && styles.selectedPresetBtnText]}>
                  {ru.settings.demoPresets.slightDev}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetBtn,
                  selectedScenario === 'HEAVY_DEVIATION' && styles.selectedPresetBtn,
                ]}
                onPress={() => handleSelectScenario('HEAVY_DEVIATION')}
              >
                <Text style={[styles.presetBtnText, selectedScenario === 'HEAVY_DEVIATION' && styles.selectedPresetBtnText]}>
                  {ru.settings.demoPresets.heavyDev}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetBtn,
                  selectedScenario === 'TIME_EXCEEDED' && styles.selectedPresetBtn,
                ]}
                onPress={() => handleSelectScenario('TIME_EXCEEDED')}
              >
                <Text style={[styles.presetBtnText, selectedScenario === 'TIME_EXCEEDED' && styles.selectedPresetBtnText]}>
                  {ru.settings.demoPresets.timeExceeded}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetBtn,
                  styles.sosPresetBtn,
                  selectedScenario === 'SOS' && styles.selectedPresetBtn,
                ]}
                onPress={() => handleSelectScenario('SOS')}
              >
                <Text style={styles.sosPresetBtnText}>{ru.settings.demoPresets.sosTrigger}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.openHikeDemoBtn}
                onPress={() => router.push('/hike')}
              >
                <Play size={15} color={ThemeColors.buttonPrimaryText} />
                <Text style={styles.openHikeDemoBtnText}>Открыть маршрут с демо-режимом</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>История сигналов</Text>
          <TouchableOpacity
            style={styles.sosFeedBtn}
            onPress={() => router.push('/sos-history')}
          >
            <ShieldAlert size={16} color="#FFFFFF" />
            <Text style={styles.sosFeedBtnText}>{ru.home.sosHistory}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>{ru.settings.aboutSection}</Text>
          <Text style={styles.appNameAbout}>{ru.settings.appNameAbout}</Text>
          <Text style={styles.aboutSubtext}>{ru.settings.aboutSubtext}</Text>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderGroup}>
            <Lock size={15} color={ThemeColors.accentGreen} />
            <Text style={styles.sectionHeader}>{ru.settings.privacySection}</Text>
          </View>
          <TouchableOpacity
            style={styles.privacyBtn}
            onPress={() => Alert.alert(ru.settings.privacySection, 'Локальные данные хранятся исключительно на устройстве пользователя и синхронизируются только при явном подтверждении SOS.')}
          >
            <Text style={styles.privacyBtnText}>{ru.settings.openPrivacy}</Text>
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
    padding: 16,
    gap: 12,
  },
  sectionHeaderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  adminDbBtn: {
    backgroundColor: ThemeColors.cardBgSubtle,
    borderColor: ThemeColors.cardBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  adminDbBtnText: {
    color: ThemeColors.accentGreen,
    fontWeight: '700',
    fontSize: 13,
  },
  sectionCard: {
    backgroundColor: ThemeColors.cardBg,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  sectionHeader: {
    color: ThemeColors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    color: ThemeColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  contactSavedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactLabel: {
    color: ThemeColors.textSecondary,
    fontSize: 12,
  },
  contactValue: {
    color: ThemeColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  editBtn: {
    backgroundColor: ThemeColors.buttonSecondaryBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  editBtnText: {
    color: ThemeColors.accentGreen,
    fontSize: 12,
    fontWeight: '700',
  },
  contactInputBox: {
    gap: 8,
  },
  textInput: {
    backgroundColor: ThemeColors.cardBgSubtle,
    borderColor: ThemeColors.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: ThemeColors.textPrimary,
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: ThemeColors.buttonPrimaryBg,
    borderRadius: 8,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveBtnText: {
    color: ThemeColors.buttonPrimaryText,
    fontWeight: '800',
    fontSize: 13,
  },
  demoTitle: {
    color: ThemeColors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  demoSubtext: {
    color: ThemeColors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  presetsBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: ThemeColors.cardBorder,
    gap: 6,
  },
  presetsTitle: {
    color: ThemeColors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  presetBtn: {
    backgroundColor: ThemeColors.cardBgSubtle,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  selectedPresetBtn: {
    backgroundColor: ThemeColors.accentGreen,
    borderColor: ThemeColors.accentGreen,
  },
  presetBtnText: {
    color: ThemeColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  selectedPresetBtnText: {
    color: ThemeColors.buttonPrimaryText,
    fontWeight: '800',
  },
  sosPresetBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  sosPresetBtnText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '800',
  },
  openHikeDemoBtn: {
    backgroundColor: ThemeColors.buttonPrimaryBg,
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  openHikeDemoBtnText: {
    color: ThemeColors.buttonPrimaryText,
    fontWeight: '800',
    fontSize: 12,
  },
  sosFeedBtn: {
    backgroundColor: ThemeColors.dangerRed,
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  sosFeedBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  appNameAbout: {
    color: ThemeColors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  aboutSubtext: {
    color: ThemeColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  privacyBtn: {
    backgroundColor: ThemeColors.buttonSecondaryBg,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  privacyBtnText: {
    color: ThemeColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  sectionSubtext: {
    color: ThemeColors.textSecondary,
    fontSize: 11,
    marginBottom: 6,
  },
  alertThresholdsBox: {
    marginTop: 10,
    gap: 8,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thresholdLabel: {
    color: ThemeColors.textPrimary,
    fontSize: 12,
  },
  thresholdControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  thresholdBtn: {
    backgroundColor: ThemeColors.buttonSecondaryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
  },
  thresholdBtnText: {
    color: ThemeColors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  thresholdValue: {
    color: ThemeColors.accentGreen,
    fontSize: 13,
    fontWeight: '800',
    minWidth: 36,
    textAlign: 'center',
  },
  testAlertBtn: {
    backgroundColor: ThemeColors.buttonSecondaryBg,
    borderColor: ThemeColors.cardBorder,
    borderWidth: 1,
    paddingVertical: 7,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  testAlertBtnText: {
    color: ThemeColors.accentGreen,
    fontSize: 12,
    fontWeight: '700',
  },
});
