import type { FastifyInstance } from "fastify";

const loopbackHosts = new Set(["localhost", "127.0.0.1", "::1"]);

export function registerLocalAccessGuard(app: FastifyInstance): void {
  app.addHook("onRequest", async (request, reply) => {
    const host = String(request.headers.host ?? "")
      .split(":")[0]
      ?.toLowerCase();
    const address = request.ip.replace("::ffff:", "");
    const loopbackAddress = address === "127.0.0.1" || address === "::1" || address === "localhost";
    const dockerBridge =
      address.startsWith("172.") || address.startsWith("192.168.") || address.startsWith("10.");
    const allowedHost = !host || loopbackHosts.has(host) || dockerBridge;

    if (!allowedHost || (!loopbackAddress && !dockerBridge)) {
      await app.applicationLogger.log(
        "WARN",
        "SECURITY",
        "Rejected non-local generator API request",
        {
          host,
          address
        }
      );
      await reply.code(403).send({
        error: {
          code: "LOCAL_ACCESS_DENIED",
          message: "Generator API only accepts local development traffic.",
          requestId: request.requestId,
          details: [],
          timestamp: new Date().toISOString()
        }
      });
    }
  });
}
