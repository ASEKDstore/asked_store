import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authGuard } from "../middleware/auth";
import { updateOrderStatusSchema } from "../schemas/orders";
import { createProduct, updateProduct, deleteProduct } from "../services/productsService";
import { updateOrderStatus } from "../services/ordersService";
import { handleZodError, sendError } from "../utils/errors";
import { prisma } from "../lib/prisma";

// Simplified admin guard - for now just check auth
const adminGuard = async (request: FastifyRequest, reply: FastifyReply) => {
  // TODO: Implement proper admin check
  // For now, just pass through if authenticated
};

export async function adminRoutes(fastify: FastifyInstance) {
  // Products CRUD
  fastify.post(
    "/admin/products",
    { preHandler: [authGuard, adminGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = request.body as any;
        const product = await createProduct(body);
        return reply.code(201).send(product);
      } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
          return handleZodError(reply, error as any);
        }
        fastify.log.error(error);
        return sendError(reply, 500, "INTERNAL_SERVER_ERROR");
      }
    }
  );

  fastify.get(
    "/admin/products",
    { preHandler: [authGuard, adminGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const products = await prisma.product.findMany({
          include: {
            category: true,
          },
          orderBy: { createdAt: "desc" },
        });
        return reply.send(products);
      } catch (error) {
        fastify.log.error(error);
        return sendError(reply, 500, "INTERNAL_SERVER_ERROR");
      }
    }
  );

  fastify.get(
    "/admin/products/:id",
    { preHandler: [authGuard, adminGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const params = request.params as { id: string };
        const product = await prisma.product.findUnique({
          where: { id: params.id },
          include: {
            category: true,
          },
        });

        if (!product) {
          return sendError(reply, 404, "PRODUCT_NOT_FOUND");
        }

        return reply.send(product);
      } catch (error) {
        fastify.log.error(error);
        return sendError(reply, 500, "INTERNAL_SERVER_ERROR");
      }
    }
  );

  fastify.put(
    "/admin/products/:id",
    { preHandler: [authGuard, adminGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const params = request.params as { id: string };
        const body = request.body as any;
        const product = await updateProduct(params.id, body);
        return reply.send(product);
      } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
          return handleZodError(reply, error as any);
        }
        if (error instanceof Error && error.message.includes("Record to update not found")) {
          return sendError(reply, 404, "PRODUCT_NOT_FOUND");
        }
        fastify.log.error(error);
        return sendError(reply, 500, "INTERNAL_SERVER_ERROR");
      }
    }
  );

  fastify.delete(
    "/admin/products/:id",
    { preHandler: [authGuard, adminGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const params = request.params as { id: string };
        await deleteProduct(params.id);
        return reply.code(204).send();
      } catch (error) {
        if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
          return sendError(reply, 404, "PRODUCT_NOT_FOUND");
        }
        fastify.log.error(error);
        return sendError(reply, 500, "INTERNAL_SERVER_ERROR");
      }
    }
  );

  // Orders status update
  fastify.patch(
    "/admin/orders/:id/status",
    { preHandler: [authGuard, adminGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const params = request.params as { id: string };
        const body = updateOrderStatusSchema.parse(request.body);
        const order = await updateOrderStatus(params.id, body.status);
        return reply.send(order);
      } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
          return handleZodError(reply, error as any);
        }
        if (error instanceof Error && error.message.includes("Record to update not found")) {
          return sendError(reply, 404, "ORDER_NOT_FOUND");
        }
        fastify.log.error(error);
        return sendError(reply, 500, "INTERNAL_SERVER_ERROR");
      }
    }
  );
}
