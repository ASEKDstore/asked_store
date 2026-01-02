import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authGuard } from "../middleware/auth";
import { prisma } from "../lib/prisma";

export async function meRoutes(app: FastifyInstance) {
  app.get(
    "/me",
    { preHandler: authGuard },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        return reply.code(401).send({ error: "UNAUTHORIZED" });
      }

      try {
        const user = await prisma.user.findUnique({
          where: {
            id: request.user.id,
          },
          select: {
            id: true,
            telegramId: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true,
          },
        });

        if (!user) {
          return reply.code(404).send({ error: "User not found" });
        }

        return reply.send(user);
      } catch (error) {
        app.log.error(error);
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );
}

