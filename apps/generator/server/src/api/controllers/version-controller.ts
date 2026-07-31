import type { VersionService } from "../../application/services/version-service.js";

export function getVersion(versionService: VersionService) {
  return versionService.getVersion();
}
