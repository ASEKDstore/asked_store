import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env";
import { authRoutes } from "./routes/auth";
import { meRoutes } from "./routes/me";
import { productsRoutes } from "./routes/products";
import { cartRoutes } from "./routes/cart";
import { ordersRoutes } from "./routes/orders";
import { adminRoutes } from "./routes/admin";

const fastify = Fastify({
  logger: true,
});

const start = async () => {
  try {
    // Register CORS before routes
    await fastify.register(cors, {
      origin: (origin, cb) => {
        // Allow requests without origin (curl, postman, etc.)
        if (!origin) return cb(null, true);

        const allowed = [
          "http://localhost:3001",
          "http://localhost:3002",
        ];

        if (allowed.includes(origin)) return cb(null, true);
        if (origin.endsWith(".onrender.com")) return cb(null, true);

        return cb(new Error("Not allowed by CORS"), false);
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: false,
    });

    // Health check endpoint
    fastify.get("/health", async (request, reply) => {
      return { ok: true };
    });

    // Register routes
    fastify.register(authRoutes, { prefix: "/auth" });
    fastify.register(meRoutes);
    fastify.register(productsRoutes);
    fastify.register(cartRoutes);
    fastify.register(ordersRoutes);
    fastify.register(adminRoutes);

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

