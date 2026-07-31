# Local AI Runtime

Phase 5 supports external-server mode and optional managed process mode for `Qwen3-8B-Q4_K_M`. Docker should use `LOCAL_AI_BASE_URL=http://host.docker.internal:8080/v1`; direct Windows development can use `LOCAL_AI_HOST_BASE_URL=http://127.0.0.1:8080/v1`.

The API inspects model path, executable configuration, process-management capability, endpoint health, detected models, warm-up state, and active queue job. Docker containers do not start the Windows `llama-server.exe`; managed mode is for direct Windows server runs only.
