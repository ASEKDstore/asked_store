import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

type JwtPayload = {
  userId: string;
};

export async function authGuard(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const auth = request.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return reply.code(401).send({ error: "UNAUTHORIZED" });
  }

  try {
    const payload = jwt.verify(
      auth.slice(7),
      env.JWT_SECRET
    ) as JwtPayload;

    request.user = {
      id: payload.userId,
    };
  } catch {
    return reply.code(401).send({ error: "UNAUTHORIZED" });
  }
}
