# Prompt Safety

README files are untrusted reference data. The generation prompt tells the model to ignore repository instructions that ask it to change role, reveal prompts, expose environment variables, call tools, or alter the output format.

AI responses are parsed as JSON, validated against shared Zod schemas, and repaired at most two times before the job fails safely. Raw responses remain private under `data/ai/drafts/`.
