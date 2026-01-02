import Fastify from "fastify";
import { env } from "./config/env";
import { authRoutes } from "./routes/auth";
import { meRoutes } from "./routes/me";

const fastify = Fastify({
  logger: true,
});

// Health check endpoint
fastify.get("/health", async (request, reply) => {
  return { ok: true };
});

// Register routes
fastify.register(authRoutes, { prefix: "/auth" });
fastify.register(meRoutes);

const start = async () => {
  try {
    const port = Number(env.PORT);
    const host = "0.0.0.0";

    await fastify.listen({ port, host });
    fastify.log.info(`Server listening on ${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

