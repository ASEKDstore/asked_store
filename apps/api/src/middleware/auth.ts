import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthenticatedRequest, JWTPayload } from "../types";

export async function authGuard(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.code(401).send({ error: "Missing or invalid Authorization header" });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

      // Добавляем user в request
      (request as AuthenticatedRequest).user = {
        userId: decoded.userId,
        role: decoded.role,
      };
    } catch (error) {
      return reply.code(401).send({ error: "Invalid or expired token" });
    }
  } catch (error) {
    return reply.code(401).send({ error: "Authentication failed" });
  }
}
