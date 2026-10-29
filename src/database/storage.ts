 import AsyncStorage from '@react-native-async-storage/async-storage';
import { EmergencyRecord } from '../types/emergency';
import { DemoScenario } from '../types/location';
import { RouteData } from '../types/route';

const STORAGE_KEYS = {
  EMERGENCY_RECORDS: '@mountain_safe_emergency_records',
  ACTIVE_HIKE: '@mountain_safe_active_hike',
  EMERGENCY_CONTACT: '@mountain_safe_emergency_contact',
  DEMO_MODE: '@mountain_safe_demo_mode',
  DEMO_SCENARIO: '@mountain_safe_demo_scenario',
  IMPORTED_ROUTES: '@mountain_safe_imported_routes',
  ALERT_ENABLED: '@mountain_safe_alert_enabled',
  ALERT_WARNING_M: '@mountain_safe_alert_warning_m',
  ALERT_DANGER_M: '@mountain_safe_alert_danger_m',
  SOS_CONTACTS: '@mountain_safe_sos_contacts',
};

const INITIAL_MOCK_SOS_RECORDS: EmergencyRecord[] = [
  {
    id: 'sos_mock_001',
    latitude: 43.0645,
    longitude: 76.9988,
    altitude: 2340,
    timestamp: Date.now() - 3600000 * 2,
    routeName: 'Большой Алматинский маршрут',
    distanceFromRouteMeters: 380,
    distanceTraveledMeters: 6200,
    tripDurationSeconds: 14200,
    lastRoutePoint: { latitude: 43.0601, longitude: 76.9950 },
    synced: true,
    syncedAt: Date.now() - 3600000 * 1.9,
  },
  {
    id: 'sos_mock_002',
    latitude: 43.0558,
    longitude: 76.9912,
    altitude: 2210,
    timestamp: Date.now() - 3600000 * 18, 
    routeName: 'Большой Алматинский маршрут',
    distanceFromRouteMeters: 140,
    distanceTraveledMeters: 3800,
    tripDurationSeconds: 8400,
    lastRoutePoint: { latitude: 43.0558, longitude: 76.9912 },
    synced: true,
    syncedAt: Date.now() - 3600000 * 17.5,
  },
];

export class AppStorage {

  static async getEmergencyRecords(): Promise<EmergencyRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EMERGENCY_RECORDS);
      if (!data) {
        await AsyncStorage.setItem(STORAGE_KEYS.EMERGENCY_RECORDS, JSON.stringify(INITIAL_MOCK_SOS_RECORDS));
        return INITIAL_MOCK_SOS_RECORDS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_MOCK_SOS_RECORDS;
    }
  }

  static async saveEmergencyRecord(record: EmergencyRecord): Promise<void> {
    try {
      const existing = await this.getEmergencyRecords();
      const updated = [record, ...existing];
      await AsyncStorage.setItem(STORAGE_KEYS.EMERGENCY_RECORDS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving emergency record to storage:', e);
    }
  }

  static async markRecordSynced(id: string): Promise<void> {
    try {
      const existing = await this.getEmergencyRecords();
      const updated = existing.map((rec) =>
        rec.id === id ? { ...rec, synced: true, syncedAt: Date.now() } : rec
      );
      await AsyncStorage.setItem(STORAGE_KEYS.EMERGENCY_RECORDS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error updating record sync status:', e);
    }
  }

  static async setActiveHike(hikeData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_HIKE, JSON.stringify(hikeData));
    } catch (e) {
      console.error('Error saving active hike state:', e);
    }
  }

  static async getActiveHike(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_HIKE);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static async clearActiveHike(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_HIKE);
    } catch (e) {
      console.error('Error clearing active hike:', e);
    }
  }

  static async setEmergencyContact(contact: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.EMERGENCY_CONTACT, contact);
  }

  static async getEmergencyContact(): Promise<string> {
    return (await AsyncStorage.getItem(STORAGE_KEYS.EMERGENCY_CONTACT)) || '';
  }

  static async setDemoMode(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.DEMO_MODE, JSON.stringify(enabled));
  }

  static async getDemoMode(): Promise<boolean> {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.DEMO_MODE);
    return val ? JSON.parse(val) : false;
  }

  static async setDemoScenario(scenario: DemoScenario): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.DEMO_SCENARIO, scenario);
  }

  static async getDemoScenario(): Promise<DemoScenario> {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.DEMO_SCENARIO);
    return (val as DemoScenario) || 'NORMAL';
  }

  static async getImportedRoutes(): Promise<RouteData[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.IMPORTED_ROUTES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static async saveImportedRoute(route: RouteData): Promise<void> {
    try {
      const existing = await this.getImportedRoutes();
      const filtered = existing.filter((r) => r.id !== route.id);
      await AsyncStorage.setItem(
        STORAGE_KEYS.IMPORTED_ROUTES,
        JSON.stringify([route, ...filtered])
      );
    } catch (e) {
      console.error('Error saving imported route:', e);
    }
  }

  static async deleteImportedRoute(routeId: string): Promise<void> {
    try {
      const existing = await this.getImportedRoutes();
      const updated = existing.filter((r) => r.id !== routeId);
      await AsyncStorage.setItem(STORAGE_KEYS.IMPORTED_ROUTES, JSON.stringify(updated));
    } catch (e) {
      console.error('Error deleting imported route:', e);
    }
  }

  static async getAlertEnabled(): Promise<boolean> {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.ALERT_ENABLED);
    return val === null ? true : JSON.parse(val);
  }

  static async setAlertEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ALERT_ENABLED, JSON.stringify(enabled));
  }

  static async getAlertWarningMeters(): Promise<number> {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.ALERT_WARNING_M);
    return val ? parseInt(val, 10) : 30;
  }

  static async setAlertWarningMeters(meters: number): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ALERT_WARNING_M, String(meters));
  }

  static async getAlertDangerMeters(): Promise<number> {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.ALERT_DANGER_M);
    return val ? parseInt(val, 10) : 50;
  }

  static async setAlertDangerMeters(meters: number): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ALERT_DANGER_M, String(meters));
  }

  static async getSosContacts(): Promise<string[]> {
    try {
      const val = await AsyncStorage.getItem(STORAGE_KEYS.SOS_CONTACTS);
      if (val) return JSON.parse(val);
      const legacy = await this.getEmergencyContact();
      return legacy ? [legacy] : [];
    } catch {
      return [];
    }
  }

  static async setSosContacts(contacts: string[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SOS_CONTACTS, JSON.stringify(contacts));
  }
}
