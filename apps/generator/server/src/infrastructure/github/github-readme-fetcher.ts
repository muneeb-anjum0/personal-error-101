import { createHash } from "node:crypto";
import type { RepositoryIdentifier } from "./github-types.js";
import { mapGitHubError } from "./github-error-mapper.js";
import { isRecord, parseGitHubJson } from "./github-response-parser.js";

const MAX_README_BYTES = 1024 * 1024;

export async function fetchRepositoryReadme(
  request: (path: string, init?: RequestInit) => Promise<Response>,
  repository: RepositoryIdentifier,
  signal: AbortSignal
) {
  const response = await request(`/repos/${repository.owner}/${repository.name}/readme`, {
    signal
  });
  const fetchedAt = new Date().toISOString();

  if (response.status === 404) {
    return readme("MISSING", null, null, null, 0, null, false, fetchedAt, null);
  }
  if (!response.ok) {
    if (response.status === 403) {
      throw mapGitHubError(response, "README fetch failed.");
    }
    return readme(
      "FETCH_FAILED",
      null,
      null,
      null,
      0,
      null,
      false,
      fetchedAt,
      "README fetch failed."
    );
  }

  const body = await parseGitHubJson(response);
  if (!isRecord(body)) {
    return readme(
      "FETCH_FAILED",
      null,
      null,
      null,
      0,
      null,
      false,
      fetchedAt,
      "GitHub returned an invalid README payload."
    );
  }

  const size = numberValue(body.size);
  const path = stringValue(body.path);
  const sha = stringValue(body.sha);
  if (size > MAX_README_BYTES) {
    return readme(
      "TOO_LARGE",
      path,
      sha,
      null,
      size,
      null,
      true,
      fetchedAt,
      "README exceeds the 1 MB storage cap."
    );
  }

  const encoding = stringValue(body.encoding);
  const encoded = stringValue(body.content);
  if (encoding !== "base64" || encoded === null) {
    return readme(
      "UNSUPPORTED_ENCODING",
      path,
      sha,
      null,
      size,
      null,
      false,
      fetchedAt,
      "README encoding is not supported."
    );
  }

  const content = Buffer.from(encoded.replace(/\s/g, ""), "base64").toString("utf8");
  if (content.trim().length === 0) {
    return readme("EMPTY", path, sha, hash(content), size, "", false, fetchedAt, null);
  }
  return readme(
    "AVAILABLE",
    path,
    sha,
    hash(content),
    Buffer.byteLength(content, "utf8"),
    content,
    false,
    fetchedAt,
    null
  );
}

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
  return {
    status,
    path,
    sha,
    hash: contentHash,
    sizeBytes,
    content,
    truncated,
    fetchedAt,
    warning
  };
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numberValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function hash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}
