import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PortfolioDeploymentStatus } from "@muneeb-systems/shared-types";
import { portfolioDeploymentStatusSchema } from "@muneeb-systems/shared-schemas";
import type { GeneratorAppConfig } from "../../config/app-config.js";
import type { ApplicationLogger } from "../../infrastructure/logging/application-logger.js";
import { GeneratorError } from "../../domain/errors/generator-error.js";

const initialState: PortfolioDeploymentStatus = {
  schemaVersion: 1,
  dirty: false,
  status: "IDLE",
  changeReasons: [],
  changedAt: null,
  deploymentStartedAt: null,
  deployedAt: null,
  error: null
};

export class PortfolioDeploymentService {
  private running = false;

  public constructor(
    private readonly config: GeneratorAppConfig,
    private readonly logger: ApplicationLogger
  ) {}

  public async recover(): Promise<void> {
    try {
      await readFile(this.config.portfolioDeploymentStatePath, "utf8");
    } catch {
      await this.save({
        ...initialState,
        dirty: true,
        changeReasons: ["Existing offline portfolio content"],
        changedAt: new Date().toISOString()
      });
      return;
    }
    const state = await this.status();
    if (state.status !== "DEPLOYING") return;
    await this.save({
      ...state,
      dirty: true,
      status: "FAILED",
      error: "Deployment was interrupted by an API restart. Save changes again."
    });
  }

  public async status(): Promise<PortfolioDeploymentStatus> {
    try {
      return portfolioDeploymentStatusSchema.parse(
        JSON.parse(await readFile(this.config.portfolioDeploymentStatePath, "utf8"))
      );
    } catch {
      return initialState;
    }
  }

  public async markDirty(reason: string): Promise<void> {
    const state = await this.status();
    await this.save({
      ...state,
      dirty: true,
      status: state.status === "DEPLOYING" ? state.status : "IDLE",
      changeReasons: [...new Set([...state.changeReasons, reason])].slice(-12),
      changedAt: new Date().toISOString(),
      error: null
    });
  }

  public async start(): Promise<PortfolioDeploymentStatus> {
    if (this.running) {
      throw new GeneratorError("DEPLOYMENT_RUNNING", "Website deployment is already running.", 409);
    }
    const state = await this.status();
    if (!state.dirty) return state;

    const deploying = await this.save({
      ...state,
      status: "DEPLOYING",
      deploymentStartedAt: new Date().toISOString(),
      error: null
    });
    this.running = true;
    void this.run(deploying.changedAt);
    return deploying;
  }

  private async run(changeMarker: string | null): Promise<void> {
    let output = "";
    try {
      const environment = {
        ...process.env,
        HOME: "/home/node",
        PORTFOLIO_DATA_DIR: this.config.dataDirectory,
        PORTFOLIO_STATIC_EXPORT: "true",
        NEXT_PUBLIC_SITE_URL: "https://muneeb-anjum.web.app"
      };
      const runCommand = (command: string, args: string[]): Promise<void> =>
        new Promise<void>((resolve, reject) => {
          const child = spawn(command, args, {
            cwd: this.config.repositoryRoot,
            env: environment,
            stdio: ["ignore", "pipe", "pipe"]
          });
          const collect = (chunk: Buffer): void => {
            output = `${output}${chunk.toString("utf8")}`.slice(-80_000);
          };
          child.stdout.on("data", collect);
          child.stderr.on("data", collect);
          child.once("error", reject);
          child.once("close", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`${command} exited with code ${code ?? 1}.`));
          });
        });

      await runCommand("pnpm", ["--filter", "@muneeb-systems/portfolio", "build"]);
      await runCommand("node", ["scripts/generate-firebase-deploy-config.mjs"]);
      // Firebase CLI can terminate during Hosting upload when its output is a
      // plain child-process pipe. `script` supplies a pseudo-terminal while
      // retaining a fixed, non-user-controlled command and the real exit code.
      await runCommand("script", [
        "-q",
        "-e",
        "-c",
        "npx --yes firebase-tools@15.25.1 deploy --config .firebase.deploy.json --only hosting --project personal-error-101 --non-interactive",
        "/dev/null"
      ]);
      await this.writeLog(output);

      const latest = await this.status();
      const changedDuringDeployment = latest.changedAt !== changeMarker;
      await this.save({
        ...latest,
        dirty: changedDuringDeployment,
        status: "SUCCEEDED",
        changeReasons: changedDuringDeployment ? latest.changeReasons : [],
        deployedAt: new Date().toISOString(),
        error: null
      });
      await this.logger.log("INFO", "STAGED_CONTENT", "Firebase website deployed", {});
    } catch (error) {
      await this.writeLog(output);
      const latest = await this.status();
      const message = error instanceof Error ? error.message : "Website deployment failed.";
      await this.save({ ...latest, dirty: true, status: "FAILED", error: message });
      await this.logger.log("ERROR", "STAGED_CONTENT", "Firebase deployment failed", {
        error: message
      });
    } finally {
      this.running = false;
    }
  }

  private async save(state: PortfolioDeploymentStatus): Promise<PortfolioDeploymentStatus> {
    const value = portfolioDeploymentStatusSchema.parse(state);
    await mkdir(path.dirname(this.config.portfolioDeploymentStatePath), { recursive: true });
    await writeFile(
      this.config.portfolioDeploymentStatePath,
      `${JSON.stringify(value, null, 2)}\n`,
      {
        mode: 0o600
      }
    );
    return value;
  }

  private async writeLog(value: string): Promise<void> {
    await mkdir(path.dirname(this.config.portfolioDeploymentLogPath), { recursive: true });
    await writeFile(this.config.portfolioDeploymentLogPath, value, { mode: 0o600 });
  }
}
