import type { FastifyReply, FastifyRequest } from "fastify";

// Simplified role guard - for now just pass through
// TODO: Implement proper admin role check when Admin model is used
export function roleGuard(allowedRoles: Array<"USER" | "ADMIN">) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.code(401).send({ error: "UNAUTHORIZED" });
    }
    // For now, just pass through if authenticated
    // TODO: Check admin role from Admin table
  };
}
