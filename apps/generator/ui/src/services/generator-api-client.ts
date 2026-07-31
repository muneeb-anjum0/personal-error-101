import type { ApiHealthResponse } from "@muneeb-systems/shared-types";

export class GeneratorApiClient {
  public constructor(private readonly baseUrl: string) {}

  public async getHealth(signal?: AbortSignal): Promise<ApiHealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`, { signal });

    if (!response.ok) {
      throw new Error(`Generator API health check failed with ${response.status}`);
    }

    return (await response.json()) as ApiHealthResponse;
  }
}
