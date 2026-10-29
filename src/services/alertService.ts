import * as Haptics from 'expo-haptics';

export type AlertLevel = 'none' | 'warning' | 'danger';

interface AlertState {
  lastAlertTimestamp: number;
  lastAlertLevel: AlertLevel;
  isEnabled: boolean;
  warningThresholdMeters: number;
  dangerThresholdMeters: number;
  repeatIntervalSeconds: number;
}

class AlertServiceManager {
  private state: AlertState = {
    lastAlertTimestamp: 0,
    lastAlertLevel: 'none',
    isEnabled: true,
    warningThresholdMeters: 30,
    dangerThresholdMeters: 50,
    repeatIntervalSeconds: 60,
  };

  configure(opts: Partial<Pick<AlertState, 'warningThresholdMeters' | 'dangerThresholdMeters' | 'isEnabled' | 'repeatIntervalSeconds'>>) {
    this.state = { ...this.state, ...opts };
  }

  enable() { this.state.isEnabled = true; }
  disable() { this.state.isEnabled = false; }

  async evaluateDeviation(deviationMeters: number): Promise<AlertLevel> {
    if (!this.state.isEnabled) return 'none';

    const level = this.getAlertLevel(deviationMeters);
    if (level === 'none') {
      this.state.lastAlertLevel = 'none';
      return 'none';
    }

    const now = Date.now();
    const secondsSinceLast = (now - this.state.lastAlertTimestamp) / 1000;
    const sameLevel = level === this.state.lastAlertLevel;

    if (sameLevel && secondsSinceLast < this.state.repeatIntervalSeconds) {
      return level;
    }

    await this.fireAlert(level);
    this.state.lastAlertTimestamp = now;
    this.state.lastAlertLevel = level;

    return level;
  }

  private getAlertLevel(deviationMeters: number): AlertLevel {
    if (deviationMeters >= this.state.dangerThresholdMeters) return 'danger';
    if (deviationMeters >= this.state.warningThresholdMeters) return 'warning';
    return 'none';
  }

  private async fireAlert(level: AlertLevel): Promise<void> {
    try {
      if (level === 'danger') {
        await this.vibrateDanger();
      } else if (level === 'warning') {
        await this.vibrateWarning();
      }
    } catch (e) {
      console.warn('AlertService: Haptic feedback failed:', e);
    }
  }

  private async vibrateWarning(): Promise<void> {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await delay(200);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  private async vibrateDanger(): Promise<void> {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await delay(150);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await delay(150);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await delay(300);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  async testAlert(level: AlertLevel = 'danger'): Promise<void> {
    await this.fireAlert(level);
  }

  resetCooldown(): void {
    this.state.lastAlertTimestamp = 0;
    this.state.lastAlertLevel = 'none';
  }

  get currentLevel(): AlertLevel {
    return this.state.lastAlertLevel;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const alertService = new AlertServiceManager();
