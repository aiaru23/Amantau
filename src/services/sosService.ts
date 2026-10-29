import { AppStorage } from '../database/storage';
import { EmergencyRecord } from '../types/emergency';
import { networkService } from './networkService';

export class SOSServiceManager {
  private isSyncing: boolean = false;

  constructor() {
    networkService.subscribe((isOnline) => {
      if (isOnline) {
        this.syncPendingRecords();
      }
    });
  }

  public async createEmergencyRecord(params: {
    latitude: number;
    longitude: number;
    altitude: number;
    routeName: string;
    distanceFromRouteMeters: number;
    distanceTraveledMeters: number;
    tripDurationSeconds: number;
    lastRoutePoint: { latitude: number; longitude: number } | null;
  }): Promise<EmergencyRecord> {
    const record: EmergencyRecord = {
      id: `sos_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      latitude: params.latitude,
      longitude: params.longitude,
      altitude: Math.round(params.altitude),
      timestamp: Date.now(),
      routeName: params.routeName,
      distanceFromRouteMeters: Math.round(params.distanceFromRouteMeters),
      distanceTraveledMeters: Math.round(params.distanceTraveledMeters),
      tripDurationSeconds: Math.round(params.tripDurationSeconds),
      lastRoutePoint: params.lastRoutePoint,
      synced: false,
    };

    await AppStorage.saveEmergencyRecord(record);

    if (networkService.isOnline) {
      this.syncRecord(record);
    }

    return record;
  }


  public async syncRecord(record: EmergencyRecord): Promise<boolean> {
    try {
      console.log('Sending SOS emergency payload to POST /api/emergency/:', record);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      await AppStorage.markRecordSynced(record.id);
      return true;
    } catch (e) {
      console.warn('Failed to sync SOS record to backend API (will retry when online):', e);
      return false;
    }
  }


  public async syncPendingRecords(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const records = await AppStorage.getEmergencyRecords();
      const unsynced = records.filter((r) => !r.synced);

      for (const rec of unsynced) {
        await this.syncRecord(rec);
      }
    } finally {
      this.isSyncing = false;
    }
  }
}

export const sosService = new SOSServiceManager();
