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
  for (const body of inlineScriptBodies(html)) {
    if (!body) continue;
    const digest = createHash("sha256").update(body, "utf8").digest("base64");
    hashes.add(`'sha256-${digest}'`);
  }
}

const config = JSON.parse(await readFile(sourceConfigPath, "utf8"));
const securityHeaders = config.hosting.headers.find((entry) => entry.source === "**")?.headers;
const cspHeader = securityHeaders?.find((header) => header.key === "Content-Security-Policy");
if (!cspHeader) throw new Error("The Firebase Content-Security-Policy header is missing.");

cspHeader.value = cspHeader.value.replace(
  " 'unsafe-inline' 'report-sample'",
  ` ${[...hashes].sort().join(" ")} 'report-sample'`
);

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

function inlineScriptBodies(html) {
  const normalized = html.toLowerCase();
  const bodies = [];
  let cursor = 0;

  while (cursor < html.length) {
    const open = normalized.indexOf("<script", cursor);
    if (open === -1) break;

    const boundary = normalized[open + "<script".length];
    if (boundary !== ">" && !/\s/.test(boundary ?? "")) {
      cursor = open + "<script".length;
      continue;
    }

    const openingTagEnd = normalized.indexOf(">", open + "<script".length);
    if (openingTagEnd === -1) throw new Error("An unterminated script opening tag was found.");

    const closingTagStart = normalized.indexOf("</script", openingTagEnd + 1);
    if (closingTagStart === -1) throw new Error("A script element is missing its closing tag.");

    let closingTagEnd = closingTagStart + "</script".length;
    while (/\s/.test(normalized[closingTagEnd] ?? "")) closingTagEnd += 1;
    if (normalized[closingTagEnd] !== ">") {
      throw new Error("An invalid script closing tag was found.");
    }

    bodies.push(html.slice(openingTagEnd + 1, closingTagStart));
    cursor = closingTagEnd + 1;
  }

  return bodies;
}
