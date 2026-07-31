import { generatorEnvironmentSchema } from "@muneeb-systems/shared-config";

export function loadEnvironment() {
  const result = generatorEnvironmentSchema.safeParse(process.env);

  if (!result.success) {
    throw new Error(`Invalid generator environment: ${result.error.message}`);
  }

  return result.data;
}
