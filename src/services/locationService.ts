import * as Location from 'expo-location';
import { UserLocation, DemoScenario } from '../types/location';
import { MOCK_ROUTE_BAO } from '../constants/mockRoute';
import { AppStorage } from '../database/storage';

type LocationCallback = (location: UserLocation) => void;

class LocationServiceManager {
  private isTracking: boolean = false;
  private locationSubscription: Location.LocationSubscription | null = null;
  private listeners: Set<LocationCallback> = new Set();
  private demoMode: boolean = false;
  private currentDemoScenario: DemoScenario = 'NORMAL';
  private demoInterval: any = null;
  private demoStepIndex: number = 0;

  constructor() {
    AppStorage.getDemoScenario().then((scenario) => {
      this.currentDemoScenario = scenario;
    });
    AppStorage.getDemoMode().then((enabled) => {
      this.demoMode = enabled;
    });
  }

  private getDemoLocation(): UserLocation {
    const routeStart = MOCK_ROUTE_BAO.coordinates[0];
    const routeMid = MOCK_ROUTE_BAO.coordinates[3]; 
    const now = Date.now();

    switch (this.currentDemoScenario) {
      case 'NORMAL':
        return {
          latitude: routeMid.latitude + (Math.sin(this.demoStepIndex * 0.1) * 0.0001),
          longitude: routeMid.longitude + (Math.cos(this.demoStepIndex * 0.1) * 0.0001),
          altitude: 2430,
          speed: 0.78, 
          timestamp: now,
        };

      case 'SLIGHT_DEVIATION':
        return {
          latitude: routeMid.latitude + 0.0013,
          longitude: routeMid.longitude + 0.0011,
          altitude: 2415,
          speed: 0.69, 
          timestamp: now,
        };

      case 'HEAVY_DEVIATION':
        return {
          latitude: routeMid.latitude + 0.0034,
          longitude: routeMid.longitude + 0.0031,
          altitude: 2380,
          speed: 0.55,
          timestamp: now,
        };

      case 'TIME_EXCEEDED':
        return {
          latitude: routeMid.latitude + 0.0002,
          longitude: routeMid.longitude + 0.0002,
          altitude: 2435,
          speed: 0.42,
          timestamp: now,
        };

      case 'SOS':
        return {
          latitude: 43.0601 + 0.0034,
          longitude: 76.9950 + 0.0031,
          altitude: 2430,
          speed: 0,
          timestamp: now,
        };

      default:
        return {
          latitude: routeStart.latitude,
          longitude: routeStart.longitude,
          altitude: 2100,
          speed: 0,
          timestamp: now,
        };
    }
  }

  public setDemoMode(enabled: boolean, scenario: DemoScenario = 'NORMAL') {
    this.demoMode = enabled;
    this.currentDemoScenario = scenario;
    AppStorage.setDemoMode(enabled);
    AppStorage.setDemoScenario(scenario);

    if (enabled && this.isTracking) {
      this.startDemoLoop();
    } else if (!enabled) {
      this.stopDemoLoop();
    }
  }

  public setDemoScenario(scenario: DemoScenario) {
    this.currentDemoScenario = scenario;
    this.demoMode = true;
    AppStorage.setDemoMode(true);
    AppStorage.setDemoScenario(scenario);

    this.startDemoLoop();
    this.emitLocation(this.getDemoLocation());
  }

  private startDemoLoop() {
    this.stopDemoLoop();
    this.demoInterval = setInterval(() => {
      this.demoStepIndex += 1;
      this.emitLocation(this.getDemoLocation());
    }, 2000);
    this.emitLocation(this.getDemoLocation());
  }

  private stopDemoLoop() {
    if (this.demoInterval) {
      clearInterval(this.demoInterval);
      this.demoInterval = null;
    }
  }

  public async startTracking(callback: LocationCallback): Promise<() => void> {
    this.listeners.add(callback);

    if (!this.isTracking) {
      this.isTracking = true;

      if (this.demoMode) {
        this.startDemoLoop();
      } else {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            this.locationSubscription = await Location.watchPositionAsync(
              {
                accuracy: Location.Accuracy.High,
                timeInterval: 2000,
                distanceInterval: 3,
              },
              (loc) => {
                if (!this.demoMode) {
                  this.emitLocation({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    altitude: loc.coords.altitude,
                    speed: loc.coords.speed,
                    heading: loc.coords.heading,
                    accuracy: loc.coords.accuracy,
                    timestamp: loc.timestamp,
                  });
                }
              }
            );
          } else {
            console.warn('GPS location permission denied. Falling back to default point.');
            this.emitLocation(this.getDemoLocation());
          }
        } catch (e) {
          console.warn('GPS location watch failed, using offline mock position:', e);
          this.emitLocation(this.getDemoLocation());
        }
      }
    }

    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        this.stopTracking();
      }
    };
  }

  private stopTracking() {
    this.isTracking = false;
    this.stopDemoLoop();
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
  }

  private emitLocation(location: UserLocation) {
    this.listeners.forEach((listener) => listener(location));
  }
}

export const locationService = new LocationServiceManager();
