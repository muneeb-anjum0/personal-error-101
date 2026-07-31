import type { SettingsService } from "../../application/services/settings-service.js";

export function getSettings(service: SettingsService) {
  return service.getSettings();
}

export function updateSettings(service: SettingsService, update: unknown) {
  return service.updateSettings(update);
}
