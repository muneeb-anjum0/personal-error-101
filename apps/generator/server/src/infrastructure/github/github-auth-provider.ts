import type { GitHubAuthenticationMode } from "@muneeb-systems/shared-types";

export class GitHubAuthProvider {
  public constructor(private readonly token: string) {}

  public mode(): GitHubAuthenticationMode {
    return this.token.trim().length > 0 ? "TOKEN" : "ANONYMOUS";
  }

  public tokenConfigured(): boolean {
    return this.mode() === "TOKEN";
  }

  public headers(): Record<string, string> {
    if (!this.tokenConfigured()) {
      return {};
    }
    return { authorization: `Bearer ${this.token}` };
  }
}
