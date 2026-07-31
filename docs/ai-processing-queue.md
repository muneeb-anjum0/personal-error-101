# AI Processing Queue

Only manually selected repositories can be enqueued. Jobs run one at a time in stable enqueue order, with pause, resume, pending cancellation, active cancellation requests, single-job retry, and retry-all-failed controls.

Queue state lives in `data/ai/queue.json`; append-only events live in `data/ai/queue-events.jsonl`; private draft artifacts live in `data/ai/drafts/`. These files are ignored and are not public portfolio content.
