import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { authGuard } from "../middleware/auth";
import { roleGuard } from "../middleware/roleGuard";
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
} from "../schemas/products";
import { updateOrderStatusSchema } from "../schemas/orders";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant,
  deleteVariant,
} from "../services/productsService";
import { updateOrderStatus } from "../services/ordersService";
import { handleZodError, sendError } from "../utils/errors";
import { prisma } from "../lib/prisma";

const adminGuard = roleGuard(["ADMIN"]);

export async function adminRoutes(fastify: FastifyInstance) {
  // Products CRUD
  fastify.post(
    "/admin/products",
    { preHandler: [authGuard, adminGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createProductSchema.parse(request.body);
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
            images: true,
            variants: true,
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
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const product = await prisma.product.findUnique({
          where: { id: request.params.id },
          include: {
            category: true,
            images: true,
            variants: true,
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
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const body = updateProductSchema.parse(request.body);
        const product = await updateProduct(request.params.id, body);
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
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        await deleteProduct(request.params.id);
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

  // Variants CRUD
  fastify.post(
    "/admin/variants",
    { preHandler: [authGuard, adminGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = createVariantSchema.parse(request.body);
        const variant = await createVariant(body);
        return reply.code(201).send(variant);
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
    "/admin/variants",
    { preHandler: [authGuard, adminGuard] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const variants = await prisma.productVariant.findMany({
          include: {
            product: true,
          },
          orderBy: { createdAt: "desc" },
        });
        return reply.send(variants);
      } catch (error) {
        fastify.log.error(error);
        return sendError(reply, 500, "INTERNAL_SERVER_ERROR");
      }
    }
  );

  fastify.get(
    "/admin/variants/:id",
    { preHandler: [authGuard, adminGuard] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const variant = await prisma.productVariant.findUnique({
          where: { id: request.params.id },
          include: {
            product: true,
          },
        });

        if (!variant) {
          return sendError(reply, 404, "VARIANT_NOT_FOUND");
        }

        return reply.send(variant);
      } catch (error) {
        fastify.log.error(error);
        return sendError(reply, 500, "INTERNAL_SERVER_ERROR");
      }
    }
  );

  fastify.put(
    "/admin/variants/:id",
    { preHandler: [authGuard, adminGuard] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const body = updateVariantSchema.parse(request.body);
        const variant = await updateVariant(request.params.id, body);
        return reply.send(variant);
      } catch (error) {
        if (error instanceof Error && error.name === "ZodError") {
          return handleZodError(reply, error as any);
        }
        if (error instanceof Error && error.message.includes("Record to update not found")) {
          return sendError(reply, 404, "VARIANT_NOT_FOUND");
        }
        fastify.log.error(error);
        return sendError(reply, 500, "INTERNAL_SERVER_ERROR");
      }
    }
  );

  fastify.delete(
    "/admin/variants/:id",
    { preHandler: [authGuard, adminGuard] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        await deleteVariant(request.params.id);
        return reply.code(204).send();
      } catch (error) {
        if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
          return sendError(reply, 404, "VARIANT_NOT_FOUND");
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
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const body = updateOrderStatusSchema.parse(request.body);
        const order = await updateOrderStatus(request.params.id, body.status);
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
