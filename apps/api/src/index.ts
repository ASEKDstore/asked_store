import Fastify from "fastify";

const fastify = Fastify({
  logger: true,
});

// Health check endpoint
fastify.get("/health", async (request, reply) => {
  return { ok: true };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    const host = "0.0.0.0";

    await fastify.listen({ port, host });
    fastify.log.info(`Server listening on ${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

