export function parseNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) {
    return null;
  }

  for (const part of linkHeader.split(",")) {
    const [rawUrl, rawRel] = part.trim().split(";");
    if (!rawUrl || !rawRel) {
      continue;
    }
    if (rawRel.includes('rel="next"')) {
      return rawUrl.trim().replace(/^</, "").replace(/>$/, "");
    }
  }

  return null;
}
