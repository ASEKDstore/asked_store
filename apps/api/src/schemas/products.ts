import { z } from "zod";

// Query schema for GET /products
export const getProductsQuerySchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Admin schemas
export const createProductSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  categoryId: z.string().uuid().optional().nullable(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        sortOrder: z.number().int().default(0),
      })
    )
    .optional(),
});

export const updateProductSchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  categoryId: z.string().uuid().optional().nullable(),
});

export const createVariantSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().min(1),
  size: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  price: z.number().int().min(0),
  stock: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateVariantSchema = z.object({
  sku: z.string().min(1).optional(),
  size: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  price: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});



