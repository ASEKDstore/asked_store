import type { FastifyReply, FastifyRequest } from "fastify";

export function roleGuard(allowedRoles: Array<"USER" | "ADMIN">) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.code(401).send({ error: "UNAUTHORIZED" });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.code(403).send({ error: "FORBIDDEN" });
    }
  };
}

