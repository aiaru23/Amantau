import * as Location from 'expo-location';

export type GpsMode = 'HIGH' | 'BALANCED' | 'LOW';

interface GpsModeConfig {
  accuracy: Location.LocationAccuracy;
  timeIntervalMs: number;
  distanceIntervalM: number;
  label: string;
}

const GPS_MODES: Record<GpsMode, GpsModeConfig> = {
  HIGH: {
    accuracy: Location.Accuracy.BestForNavigation,
    timeIntervalMs: 2000,
    distanceIntervalM: 3,
    label: 'Высокая (перекрёсток)',
  },
  BALANCED: {
    accuracy: Location.Accuracy.High,
    timeIntervalMs: 8000,
    distanceIntervalM: 15,
    label: 'Сбалансированная',
  },
  LOW: {
    accuracy: Location.Accuracy.Balanced,
    timeIntervalMs: 20000,
    distanceIntervalM: 30,
    label: 'Экономия (прямой участок)',
  },
};

type LocationCallback = (location: Location.LocationObject) => void;

class AdaptiveGpsService {
  private currentMode: GpsMode = 'BALANCED';
  private subscription: Location.LocationSubscription | null = null;
  private callback: LocationCallback | null = null;
  private isRunning = false;

  private recentHeadings: number[] = [];
  private readonly HEADING_HISTORY = 5;
  private readonly HEADING_VARIANCE_THRESHOLD = 15;

  get mode(): GpsMode {
    return this.currentMode;
  }

  get modeLabel(): string {
    return GPS_MODES[this.currentMode].label;
  }

  async start(cb: LocationCallback): Promise<boolean> {
    if (this.isRunning) {
      await this.stop();
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return false;

    this.callback = cb;
    this.isRunning = true;
    await this.applyMode('BALANCED');
    return true;
  }

  async stop(): Promise<void> {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    this.isRunning = false;
    this.callback = null;
  }

  async requestMode(mode: GpsMode): Promise<void> {
    if (mode === this.currentMode) return;
    await this.applyMode(mode);
  }

  async autoAdjust(heading: number | null, speedKmh: number, deviationMeters: number): Promise<GpsMode> {
    if (deviationMeters > 25) {
      await this.requestMode('HIGH');
      return 'HIGH';
    }

    if (speedKmh < 0.5) {
      await this.requestMode('LOW');
      return 'LOW';
    }

    if (heading !== null) {
      this.recentHeadings.push(heading);
      if (this.recentHeadings.length > this.HEADING_HISTORY) {
        this.recentHeadings.shift();
      }

      if (this.recentHeadings.length >= this.HEADING_HISTORY) {
        const variance = this.headingVariance(this.recentHeadings);
        const newMode: GpsMode = variance > this.HEADING_VARIANCE_THRESHOLD ? 'HIGH' : 'BALANCED';
        await this.requestMode(newMode);
        return newMode;
      }
    }

    return this.currentMode;
  }

  private headingVariance(headings: number[]): number {
    const sinVals = headings.map((h) => Math.sin((h * Math.PI) / 180));
    const cosVals = headings.map((h) => Math.cos((h * Math.PI) / 180));

    const meanSin = sinVals.reduce((a, b) => a + b, 0) / headings.length;
    const meanCos = cosVals.reduce((a, b) => a + b, 0) / headings.length;

    const R = Math.sqrt(meanSin * meanSin + meanCos * meanCos);
    const circularVariance = 1 - R;
    return circularVariance * 180;
  }

  private async applyMode(mode: GpsMode): Promise<void> {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }

    this.currentMode = mode;
    const config = GPS_MODES[mode];

    if (!this.callback || !this.isRunning) return;

    try {
      this.subscription = await Location.watchPositionAsync(
        {
          accuracy: config.accuracy,
          timeInterval: config.timeIntervalMs,
          distanceInterval: config.distanceIntervalM,
        },
        (loc) => {
          if (this.callback) this.callback(loc);
        }
      );
    } catch (e) {
      console.warn('AdaptiveGps: Failed to start watchPositionAsync:', e);
    }
  }
}

export const adaptiveGpsService = new AdaptiveGpsService();
