import { execFile } from "node:child_process";
import { access, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { promisify } from "node:util";
import path from "node:path";
import type { SystemInformation } from "@muneeb-systems/shared-types";
import type { GeneratorAppConfig } from "../../config/app-config.js";
import type { StaticContentInspector } from "../filesystem/static-content-inspector.js";

const execFileAsync = promisify(execFile);

export class EnvironmentInspector {
  public constructor(
    private readonly config: GeneratorAppConfig,
    private readonly contentInspector: StaticContentInspector
  ) {}

  public async getSystemInformation(): Promise<SystemInformation> {
    const [git, docker, model, filesystem] = await Promise.all([
      commandVersion("git", ["--version"]),
      commandVersion("docker", ["--version"]),
      modelStatus(this.config.modelPath),
      this.contentInspector.checkReadWrite()
    ]);
    const memory = process.memoryUsage();

    return {
      applicationVersion: this.config.version,
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      processUptimeSeconds: process.uptime(),
      serverStartedAt: this.config.serverStartedAt.toISOString(),
      memoryUsage: {
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal
      },
      apiHost: this.config.host,
      apiPort: this.config.port,
      repositoryRoot: this.config.repositoryRoot,
      dataDirectory: this.config.dataDirectory,
      logDirectory: this.config.logDirectory,
      portfolioPath: this.config.portfolioPath,
      git,
      docker,
      modelPath: model,
      filesystem: {
        dataDirectoryReadable: filesystem.readable,
        dataDirectoryWritable: filesystem.writable
      }
    };
  }
}

async function commandVersion(command: "git" | "docker", args: string[]) {
  try {
    const { stdout } = await execFileAsync(command, args, {
      timeout: 2000,
      maxBuffer: 4096,
      windowsHide: true
    });
    return { available: true, version: stdout.trim().slice(0, 180) };
  } catch {
    return { available: false, version: null };
  }
}

async function modelStatus(configuredPath: string): Promise<SystemInformation["modelPath"]> {
  const extensionValid = path.extname(configuredPath).toLowerCase() === ".gguf";
  try {
    await access(configuredPath, constants.F_OK);
    const fileStat = await stat(configuredPath);
    return {
      configuredPath,
      exists: true,
      extensionValid,
      sizeBytes: fileStat.size,
      note: "Host path is visible to this process; model was not read or started."
    };
  } catch {
    return {
      configuredPath,
      exists: false,
      extensionValid,
      sizeBytes: null,
      note: "Host path configured. Container access may require an explicit mount in a later phase."
    };
  }
}
