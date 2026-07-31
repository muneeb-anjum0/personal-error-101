export class GeneratorError extends Error {
  public constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 500,
    public readonly details: unknown[] = []
  ) {
    super(message);
  }
}
