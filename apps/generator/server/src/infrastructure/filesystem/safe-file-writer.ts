import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile, copyFile, readdir, unlink } from "node:fs/promises";
import path from "node:path";

export class SafeFileWriter {
  public constructor(private readonly approvedRoot: string) {}

  public async writeJsonWithBackup(
    targetPath: string,
    value: unknown,
    backupDirectory: string,
    backupPrefix: string,
    retain = 10
  ): Promise<void> {
    this.assertApproved(targetPath);
    this.assertApproved(backupDirectory);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await mkdir(backupDirectory, { recursive: true });

    const serialized = `${JSON.stringify(value, null, 2)}\n`;
    const tempPath = `${targetPath}.${process.pid}.${Date.now()}.${randomUUID()}.tmp`;

    try {
      await writeFile(tempPath, serialized, "utf8");
      await this.backupExisting(targetPath, backupDirectory, backupPrefix);
      if (process.platform === "win32") {
        await rm(targetPath, { force: true });
      }
      await rename(tempPath, targetPath);
      await this.retainBackups(backupDirectory, backupPrefix, retain);
    } catch (error) {
      await rm(tempPath, { force: true });
      throw error;
    }
  }

  private assertApproved(candidate: string): void {
    const resolvedRoot = path.resolve(this.approvedRoot);
    const resolvedCandidate = path.resolve(candidate);
    if (
      resolvedCandidate !== resolvedRoot &&
      !resolvedCandidate.startsWith(`${resolvedRoot}${path.sep}`)
    ) {
      throw new Error(`Refusing to write outside approved root: ${resolvedCandidate}`);
    }
  }

  private async backupExisting(
    targetPath: string,
    backupDirectory: string,
    backupPrefix: string
  ): Promise<void> {
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      await copyFile(targetPath, path.join(backupDirectory, `${backupPrefix}-${stamp}.json`));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  private async retainBackups(directory: string, prefix: string, retain: number): Promise<void> {
    const files = (await readdir(directory))
      .filter((file) => file.startsWith(prefix) && file.endsWith(".json"))
      .sort()
      .reverse();

    await Promise.all(files.slice(retain).map((file) => unlink(path.join(directory, file))));
  }
}
