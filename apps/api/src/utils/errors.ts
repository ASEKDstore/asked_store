import type { FastifyReply } from "fastify";
import { ZodError } from "zod";

export function sendError(reply: FastifyReply, statusCode: number, message: string, details?: unknown) {
  return reply.code(statusCode).send({
    error: message,
    ...(details && typeof details === "object" ? { details } : {}),
  });
}

export function handleZodError(reply: FastifyReply, error: unknown) {
  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: "VALIDATION_ERROR",
      details: error.errors.map((err) => ({
        path: err.path.join("."),
        message: err.message,
      })),
    });
  }
  return sendError(reply, 400, "VALIDATION_ERROR");
}
