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
  LOCAL_AI_HOST_BASE_URL: z.string().url().default("http://127.0.0.1:8080/v1"),
  LOCAL_AI_MODEL: z.string().min(1).default("Qwen3-8B-Q4_K_M"),
  LOCAL_AI_API_KEY: z.string().optional().default("local"),
  LOCAL_AI_CONTEXT_SIZE: z.coerce.number().int().positive().default(8192),
  LOCAL_AI_PARALLEL_REQUESTS: z.coerce.number().int().positive().max(1).default(1),
  LOCAL_AI_GPU_LAYERS: z.coerce.number().int().nonnegative().default(28),
  LOCAL_AI_MAX_VRAM_GB: z.coerce.number().positive().default(5),
  LOCAL_AI_SERVER_PORT: z.coerce.number().int().positive().default(8080),
  LOCAL_AI_SERVER_HOST: z.string().min(1).default("127.0.0.1"),
  LOCAL_AI_SERVER_EXECUTABLE: z.string().optional().default(""),
  LOCAL_AI_RUNTIME_MODE: z.enum(["external", "managed"]).default("external")
});

export type GeneratorEnvironment = z.infer<typeof generatorEnvironmentSchema>;
