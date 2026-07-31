# llama.cpp Setup

Configure `LOCAL_AI_MODEL_PATH=D:\Desktop\Model\Qwen3-8B-Q4_K_M.gguf` and, only when running the generator server directly on Windows, set `LOCAL_AI_SERVER_EXECUTABLE` to the real `llama-server.exe` path.

Typical settings are context `8192`, parallel requests `1`, GPU layers `28`, and max VRAM target `5 GB`. Verify the installed llama.cpp help output before relying on a specific command line; the generator builds arguments safely and does not use shell strings.
