import type { RepositoryIdentifier } from "./github-types.js";
import { parseGitHubJson } from "./github-response-parser.js";

export async function fetchRepositoryLanguages(
  request: (path: string, init?: RequestInit) => Promise<Response>,
  repository: RepositoryIdentifier,
  signal: AbortSignal
) {
  const response = await request(`/repos/${repository.owner}/${repository.name}/languages`, {
    signal
  });
  if (!response.ok) {
    return [];
  }
  const body = await parseGitHubJson(response);
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return [];
  }
  const entries = Object.entries(body)
    .filter((entry): entry is [string, number] => typeof entry[1] === "number")
    .sort((left, right) => right[1] - left[1]);
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  return entries.map(([name, bytes]) => ({
    name,
    bytes,
    percentage: total === 0 ? 0 : Number(((bytes / total) * 100).toFixed(2))
  }));
}
