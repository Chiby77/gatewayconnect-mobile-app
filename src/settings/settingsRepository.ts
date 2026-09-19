import { getAppSetting, setAppSetting } from '../db/database';

export class SettingsRepository {
  static getLowDataMode(): boolean {
    const val = getAppSetting('low_data_mode');
    return val === 'true';
  }

  static setLowDataMode(enabled: boolean): void {
    setAppSetting('low_data_mode', enabled ? 'true' : 'false');
  }

  static getAnalyticsOptIn(): boolean {
    const val = getAppSetting('analytics_opt_in');
    // Default to true if not explicitly set to false
    return val !== 'false';
  }

  static setAnalyticsOptIn(enabled: boolean): void {
    setAppSetting('analytics_opt_in', enabled ? 'true' : 'false');
  }
}
