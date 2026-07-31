# Queue Recovery

On API startup the generator loads the persisted queue, marks active jobs as `INTERRUPTED`, pauses the queue, and preserves pending and completed jobs. It does not repeat an AI request automatically after a restart.

Checkpoints record context preparation, AI response receipt, output validation, and draft persistence so interrupted work can be retried or reviewed safely in a later recovery action.
