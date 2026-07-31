import type { GeneratorAppConfig } from "../../config/app-config.js";

export function buildLlamaArguments(config: GeneratorAppConfig): string[] {
  return [
    "-m",
    config.modelPath,
    "--host",
    config.aiServerHost,
    "--port",
    String(config.aiServerPort),
    "-c",
    String(config.aiContextSize),
    "--parallel",
    String(config.aiParallelRequests),
    "-ngl",
    String(config.aiGpuLayers)
  ];
}
