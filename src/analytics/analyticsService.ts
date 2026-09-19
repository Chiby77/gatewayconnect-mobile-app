import { SettingsRepository } from '../settings/settingsRepository';

export function trackEvent(eventName: string, payload?: Record<string, unknown>): void {
  if (!SettingsRepository.getAnalyticsOptIn()) {
    return;
  }

  // In a real application, this would send data to a service like PostHog, Firebase Analytics, etc.
  console.log(`[Analytics] Event: ${eventName}`, payload || {});
}
