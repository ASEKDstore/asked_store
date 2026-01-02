import { FastifyInstance } from "fastify";
import { AuthenticatedRequest } from "../types";
import { authGuard } from "../middleware/auth";
import { prisma } from "../lib/prisma";

export async function meRoutes(fastify: FastifyInstance) {
  // GET /me
  fastify.get(
    "/me",
    {
      preHandler: [authGuard],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const user = await prisma.user.findUnique({
          where: {
            id: request.user.userId,
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
        fastify.log.error(error);
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );
}

