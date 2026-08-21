import { createHash } from "node:crypto";
import type { RepositoryIdentifier } from "./github-types.js";
import { mapGitHubError } from "./github-error-mapper.js";
import { isRecord, parseGitHubJson } from "./github-response-parser.js";

const MAX_MARKDOWN_FILE_BYTES = 1024 * 1024;

/**
 * Fetches the repository README and every tracked Markdown document. The
 * existing RepositoryReadme shape is intentionally kept as the persisted
 * documentation bundle so callers do not need a second, divergent evidence
 * path. Each document is labelled with its repository-relative path.
 */
export async function fetchRepositoryReadme(
  request: (path: string, init?: RequestInit) => Promise<Response>,
  repository: RepositoryIdentifier,
  signal: AbortSignal
) {
  const fetchedAt = new Date().toISOString();
  const primary = await fetchPrimaryReadme(request, repository, signal, fetchedAt);
  const markdownPaths = await listMarkdownPaths(request, repository, signal);
  const paths = uniquePaths([...(primary.path ? [primary.path] : []), ...markdownPaths]);

  if (!paths.length) return primary;

  const documents: MarkdownDocument[] = [];
  const warnings: string[] = primary.warning ? [primary.warning] : [];
  let truncated = primary.truncated;

  for (const path of paths) {
    if (path === primary.path && primary.content !== null) {
      documents.push({ path, content: primary.content, sha: primary.sha, sizeBytes: primary.sizeBytes });
      continue;
    }
    const document = await fetchMarkdownDocument(request, repository, path, signal);
    if (document.kind === "AVAILABLE") documents.push(document.document);
    else if (document.kind === "TOO_LARGE") {
      truncated = true;
      warnings.push(`${path} exceeds the 1 MB documentation cap and was omitted.`);
    } else warnings.push(`${path} could not be read and was omitted.`);
  }

  if (!documents.length) return primary;
  const content = documents
    .map((document) => `<!-- DOCUMENT: ${document.path} -->\n${document.content}`)
    .join("\n\n");
  const allPaths = documents.map((document) => document.path);
  return readme(
    "AVAILABLE",
    allPaths.join(" · "),
    hash(documents.map((document) => `${document.path}:${document.sha ?? ""}`).join("\n")),
    hash(content),
    documents.reduce((total, document) => total + document.sizeBytes, 0),
    content,
    truncated,
    fetchedAt,
    warnings.length ? warnings.join(" ") : null
  );
}

async function fetchPrimaryReadme(
  request: (path: string, init?: RequestInit) => Promise<Response>,
  repository: RepositoryIdentifier,
  signal: AbortSignal,
  fetchedAt: string
) {
  const response = await request(`/repos/${repository.owner}/${repository.name}/readme`, { signal });
  if (response.status === 404) return readme("MISSING", null, null, null, 0, null, false, fetchedAt, null);
  if (!response.ok) {
    if (response.status === 403) throw mapGitHubError(response, "README fetch failed.");
    return readme("FETCH_FAILED", null, null, null, 0, null, false, fetchedAt, "README fetch failed.");
  }
  const body = await parseGitHubJson(response);
  if (!isRecord(body)) {
    return readme("FETCH_FAILED", null, null, null, 0, null, false, fetchedAt, "GitHub returned an invalid README payload.");
  }
  return parseMarkdownPayload(body, fetchedAt, "README");
}

async function listMarkdownPaths(
  request: (path: string, init?: RequestInit) => Promise<Response>,
  repository: RepositoryIdentifier,
  signal: AbortSignal
): Promise<string[]> {
  const tree = repository.defaultBranch ?? "HEAD";
  const response = await request(
    `/repos/${repository.owner}/${repository.name}/git/trees/${encodeURIComponent(tree)}?recursive=1`,
    { signal }
  );
  if (!response.ok) return [];
  const body = await parseGitHubJson(response);
  if (!isRecord(body) || !Array.isArray(body.tree)) return [];
  return body.tree
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .filter((item) => item.type === "blob" && typeof item.path === "string" && /\.md$/i.test(item.path))
    .map((item) => item.path as string)
    .sort((left, right) => markdownPathPriority(left) - markdownPathPriority(right) || left.localeCompare(right));
}

async function fetchMarkdownDocument(
  request: (path: string, init?: RequestInit) => Promise<Response>,
  repository: RepositoryIdentifier,
  path: string,
  signal: AbortSignal
): Promise<{ kind: "AVAILABLE"; document: MarkdownDocument } | { kind: "TOO_LARGE" | "UNAVAILABLE" }> {
  const response = await request(
    `/repos/${repository.owner}/${repository.name}/contents/${encodePath(path)}${repository.defaultBranch ? `?ref=${encodeURIComponent(repository.defaultBranch)}` : ""}`,
    { signal }
  );
  if (!response.ok) return { kind: "UNAVAILABLE" };
  const body = await parseGitHubJson(response);
  if (!isRecord(body)) return { kind: "UNAVAILABLE" };
  const parsed = parseMarkdownPayload(body, new Date().toISOString(), path);
  if (parsed.status === "TOO_LARGE") return { kind: "TOO_LARGE" };
  if (parsed.status !== "AVAILABLE" || parsed.content === null) return { kind: "UNAVAILABLE" };
  return { kind: "AVAILABLE", document: { path, content: parsed.content, sha: parsed.sha, sizeBytes: parsed.sizeBytes } };
}

function parseMarkdownPayload(body: Record<string, unknown>, fetchedAt: string, label: string) {
  const size = numberValue(body.size);
  const path = stringValue(body.path);
  const sha = stringValue(body.sha);
  if (size > MAX_MARKDOWN_FILE_BYTES) {
    return readme("TOO_LARGE", path, sha, null, size, null, true, fetchedAt, `${label} exceeds the 1 MB storage cap.`);
  }
  const encoding = stringValue(body.encoding);
  const encoded = stringValue(body.content);
  if (encoding !== "base64" || encoded === null) {
    return readme("UNSUPPORTED_ENCODING", path, sha, null, size, null, false, fetchedAt, `${label} encoding is not supported.`);
  }
  const content = Buffer.from(encoded.replace(/\s/g, ""), "base64").toString("utf8");
  if (!content.trim()) return readme("EMPTY", path, sha, hash(content), size, "", false, fetchedAt, null);
  return readme("AVAILABLE", path, sha, hash(content), Buffer.byteLength(content, "utf8"), content, false, fetchedAt, null);
}

interface MarkdownDocument { path: string; content: string; sha: string | null; sizeBytes: number; }

function markdownPathPriority(path: string): number {
  return /^readme\.md$/i.test(path) ? 0 : /(^|\/)(overview|architecture|design|features|security|docs)\b/i.test(path) ? 1 : 2;
}

function uniquePaths(paths: string[]): string[] {
  return [...new Set(paths.map((path) => path.trim()).filter(Boolean))];
}

function encodePath(path: string): string { return path.split("/").map(encodeURIComponent).join("/"); }

function readme(
  status: "AVAILABLE" | "MISSING" | "EMPTY" | "TOO_LARGE" | "UNSUPPORTED_ENCODING" | "FETCH_FAILED",
  path: string | null,
  sha: string | null,
  contentHash: string | null,
  sizeBytes: number,
  content: string | null,
  truncated: boolean,
  fetchedAt: string | null,
  warning: string | null
) {
  return { status, path, sha, hash: contentHash, sizeBytes, content, truncated, fetchedAt, warning };
}

function stringValue(value: unknown): string | null { return typeof value === "string" ? value : null; }
function numberValue(value: unknown): number { return typeof value === "number" && Number.isFinite(value) ? value : 0; }
function hash(content: string): string { return createHash("sha256").update(content).digest("hex"); }
