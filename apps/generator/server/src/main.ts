import { buildServer } from "./server.js";

const app = await buildServer();

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  app.log.info({ signal }, "Shutting down generator API");
  await app.close();
  process.exit(0);
};

process.on("SIGINT", (signal) => {
  void shutdown(signal);
});

process.on("SIGTERM", (signal) => {
  void shutdown(signal);
});

await app.listen({
  host: app.appConfig.host,
  port: app.appConfig.port
});
