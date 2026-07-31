import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PublishingBundle } from "@muneeb-systems/shared-types";
import { publishingBundleSchema } from "@muneeb-systems/shared-schemas";
import type { GeneratorAppConfig } from "../../config/app-config.js";

export class PublishingBundleRepository {
  public constructor(private readonly config: GeneratorAppConfig) {}

  public async save(bundle: PublishingBundle, data: unknown): Promise<void> {
    await mkdir(this.config.publishingBundlesDirectory, { recursive: true });
    await writeFile(
      path.join(this.config.publishingBundlesDirectory, `${bundle.id}.json`),
      `${JSON.stringify({ bundle, data }, null, 2)}\n`,
      "utf8"
    );
    await writeFile(
      this.config.publishingCurrentPath,
      `${JSON.stringify(bundle, null, 2)}\n`,
      "utf8"
    );
  }

  public async list(): Promise<PublishingBundle[]> {
    try {
      const files = (await readdir(this.config.publishingBundlesDirectory)).filter((file) =>
        file.endsWith(".json")
      );
      const bundles = await Promise.all(files.map((file) => this.get(file.replace(/\.json$/, ""))));
      return bundles
        .filter((bundle): bundle is PublishingBundle => Boolean(bundle))
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    } catch {
      return [];
    }
  }

  public async get(id: string): Promise<PublishingBundle | null> {
    try {
      const wrapper = JSON.parse(
        await readFile(path.join(this.config.publishingBundlesDirectory, `${id}.json`), "utf8")
      ) as { bundle?: unknown };
      return publishingBundleSchema.parse(wrapper.bundle);
    } catch {
      return null;
    }
  }

  public async getData(id: string): Promise<unknown> {
    try {
      const wrapper = JSON.parse(
        await readFile(path.join(this.config.publishingBundlesDirectory, `${id}.json`), "utf8")
      ) as { data?: unknown };
      return wrapper.data ?? null;
    } catch {
      return null;
    }
  }
}
