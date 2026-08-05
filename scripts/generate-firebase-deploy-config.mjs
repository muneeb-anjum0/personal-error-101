import { createHash } from "node:crypto";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const workspace = process.cwd();
const outputDirectory = path.join(workspace, "apps/portfolio/out");
const sourceConfigPath = path.join(workspace, "firebase.json");
const deployConfigPath = path.join(workspace, ".firebase.deploy.json");

const htmlFiles = (await walk(outputDirectory)).filter((file) => file.endsWith(".html"));
if (htmlFiles.length === 0) throw new Error("No static HTML files were found for CSP hashing.");

const hashes = new Set();
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)) {
    const body = match[1];
    if (!body) continue;
    const digest = createHash("sha256").update(body, "utf8").digest("base64");
    hashes.add(`'sha256-${digest}'`);
  }
}

const config = JSON.parse(await readFile(sourceConfigPath, "utf8"));
const securityHeaders = config.hosting.headers.find((entry) => entry.source === "**")?.headers;
const cspHeader = securityHeaders?.find((header) => header.key === "Content-Security-Policy");
if (!cspHeader) throw new Error("The Firebase Content-Security-Policy header is missing.");

cspHeader.value = cspHeader.value
  .replace(" 'unsafe-inline' 'report-sample'", ` ${[...hashes].sort().join(" ")} 'report-sample'`)
  .replace("trusted-types 'none'", "trusted-types 'none'");

if (cspHeader.value.includes("script-src 'self' 'unsafe-inline'")) {
  throw new Error("Strict CSP generation failed to remove unsafe-inline from script-src.");
}

await writeFile(deployConfigPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
console.log(`Generated strict CSP with ${hashes.size} inline-script hashes.`);

async function walk(directory) {
  const entries = await readdir(directory);
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const resolved = path.join(directory, entry);
      return (await stat(resolved)).isDirectory() ? walk(resolved) : [resolved];
    })
  );
  return nested.flat();
}
