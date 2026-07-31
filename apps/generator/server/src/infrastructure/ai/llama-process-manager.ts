import { access, appendFile, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import path from "node:path";
import type { GeneratorAppConfig } from "../../config/app-config.js";
import { buildLlamaArguments } from "./llama-command-builder.js";

export class LlamaProcessManager {
  private process: ChildProcessWithoutNullStreams | null = null;

  public constructor(private readonly config: GeneratorAppConfig) {}

  public async executableExists(): Promise<boolean> {
    if (!this.config.aiServerExecutable) {
      return false;
    }
    try {
      await access(this.config.aiServerExecutable, constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }

  public processManagementAvailable(): boolean {
    return process.platform === "win32" && !process.env.DOCKER_CONTAINER;
  }

  public async start(): Promise<number> {
    if (!this.processManagementAvailable()) {
      throw new Error("Managed process mode is unavailable in the current runtime.");
    }
    if (!this.config.aiServerExecutable || !(await this.executableExists())) {
      throw new Error("llama-server executable is not configured or invalid.");
    }
    if (this.process) {
      throw new Error("Model process is already owned by the generator.");
    }
    await mkdir(this.config.aiLogDirectory, { recursive: true });
    const child = spawn(this.config.aiServerExecutable, buildLlamaArguments(this.config), {
      windowsHide: true,
      shell: false
    });
    this.process = child;
    child.stdout.on("data", (data: unknown) => void this.writeLog("stdout", toBuffer(data)));
    child.stderr.on("data", (data: unknown) => void this.writeLog("stderr", toBuffer(data)));
    child.on("exit", () => {
      this.process = null;
    });
    return child.pid ?? 0;
  }

  public stop(): void {
    if (!this.process) {
      return;
    }
    this.process.kill("SIGTERM");
    this.process = null;
  }

  private async writeLog(stream: "stdout" | "stderr", data: Buffer): Promise<void> {
    const ansiPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");
    const text = data.toString("utf8").replace(ansiPattern, "");
    await appendFile(
      path.join(this.config.aiLogDirectory, `${stream}.log`),
      `${new Date().toISOString()} ${text}`,
      "utf8"
    );
  }
}

function toBuffer(data: unknown): Buffer {
  if (Buffer.isBuffer(data)) return data;
  return Buffer.from(String(data));
}
