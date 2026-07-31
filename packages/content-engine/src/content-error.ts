import type { ZodError } from "zod";

export class ContentValidationError extends Error {
  public constructor(
    public readonly filePath: string,
    public readonly issues: ZodError["issues"]
  ) {
    super(`Invalid content in ${filePath}: ${issues.map((issue) => issue.message).join("; ")}`);
    this.name = "ContentValidationError";
  }
}
