import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface SafeGitResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export class SafeGit {
  public constructor(private readonly repositoryRoot: string) {}

  public async run(args: string[], timeoutMs = 15_000): Promise<SafeGitResult> {
    try {
      const result = await execFileAsync("git", args, {
        cwd: this.repositoryRoot,
        timeout: timeoutMs,
        windowsHide: true,
        maxBuffer: 1024 * 1024
      });
      return {
        exitCode: 0,
        stdout: clean(result.stdout),
        stderr: clean(result.stderr),
        timedOut: false
      };
    } catch (error) {
      const failure = error as {
        code?: number | string;
        stdout?: string;
        stderr?: string;
        killed?: boolean;
        signal?: string;
      };
      return {
        exitCode: typeof failure.code === "number" ? failure.code : 1,
        stdout: clean(failure.stdout ?? ""),
        stderr: clean(failure.stderr ?? ""),
        timedOut: Boolean(failure.killed || failure.signal === "SIGTERM")
      };
    }
  }
}

export function clean(value: string): string {
  const ansiPattern = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");
  const controlPattern = new RegExp(
    `[${String.fromCharCode(0)}-${String.fromCharCode(8)}${String.fromCharCode(11)}${String.fromCharCode(12)}${String.fromCharCode(14)}-${String.fromCharCode(31)}${String.fromCharCode(127)}]`,
    "g"
  );
  return value.replace(ansiPattern, "").replace(controlPattern, "");
}
