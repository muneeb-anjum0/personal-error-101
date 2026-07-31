import { z } from "zod";

export const apiHealthResponseSchema = z.object({
  status: z.literal("healthy")
});

export const apiReadinessResponseSchema = z.object({
  status: z.literal("ready"),
  services: z.object({
    filesystem: z.boolean(),
    github: z.boolean(),
    ai: z.boolean()
  })
});

export const apiVersionResponseSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  phase: z.string().min(1)
});

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.unknown().optional()
  })
});
