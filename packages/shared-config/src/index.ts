import { z } from "zod";

export const generatorEnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  GENERATOR_HOST: z.string().min(1).default("127.0.0.1"),
  GENERATOR_API_PORT: z.coerce.number().int().positive().default(4000),
  GENERATOR_API_URL: z.string().url().default("http://localhost:4000"),
  GITHUB_USERNAME: z.string().min(1).default("muneeb-anjum0"),
  GITHUB_TOKEN: z.string().optional().default(""),
  GITHUB_INCLUDE_PRIVATE: z.coerce.boolean().default(false),
  LOCAL_AI_MODEL_PATH: z.string().min(1).default("D:\\Desktop\\Model\\Qwen3-8B-Q4_K_M.gguf"),
  LOCAL_AI_BASE_URL: z.string().url().default("http://host.docker.internal:8080/v1"),
  LOCAL_AI_MODEL: z.string().min(1).default("Qwen3-8B-Q4_K_M"),
  LOCAL_AI_API_KEY: z.string().optional().default("local")
});

export type GeneratorEnvironment = z.infer<typeof generatorEnvironmentSchema>;
