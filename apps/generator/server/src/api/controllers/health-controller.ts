import type { ApiHealthResponse } from "@muneeb-systems/shared-types";

export function getHealth(): ApiHealthResponse {
  return { status: "healthy" };
}
