import { prisma } from "../lib/prisma";
import { z } from "zod";
import {
  createProductSchema,
  updateProductSchema,
  createVariantSchema,
  updateVariantSchema,
} from "../schemas/products";

type GetProductsQuery = {
  category?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  page: number;
  limit: number;
};

export async function getProducts(query: GetProductsQuery) {
  const { category, q, minPrice, maxPrice, size, color, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: any = {
    isActive: true,
  };

  if (category) {
    const categoryRecord = await prisma.category.findUnique({
      where: { slug: category },
    });
    if (categoryRecord) {
      where.categoryId = categoryRecord.id;
    } else {
      return { data: [], total: 0, page, limit };
    }
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  // Build variants filter combining price, size, and color
  const variantFilters: any = {
    isActive: true,
  };

  if (minPrice !== undefined || maxPrice !== undefined) {
    variantFilters.price = {};
    if (minPrice !== undefined) {
      variantFilters.price.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      variantFilters.price.lte = maxPrice;
    }
  }

  if (size) {
    variantFilters.size = size;
  }

  if (color) {
    variantFilters.color = color;
  }

  if (minPrice !== undefined || maxPrice !== undefined || size || color) {
    where.variants = {
      some: variantFilters,
    };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
        variants: {
          where: { isActive: true },
          select: {
            price: true,
          },
          orderBy: { price: "asc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  const data = products.map((product) => {
    const priceFrom = product.variants[0]?.price || 0;
    const image = product.images[0]?.url || null;

    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      priceFrom,
      image,
    };
  });

  return {
    data,
    total,
    page,
    limit,
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: {
        select: {
          id: true,
          slug: true,
          title: true,
        },
      },
      images: {
        orderBy: { sortOrder: "asc" },
      },
      variants: {
        where: { isActive: true },
        select: {
          id: true,
          size: true,
          color: true,
          price: true,
          stock: true,
        },
        orderBy: [{ size: "asc" }, { color: "asc" }],
      },
    },
  });

  if (!product) {
    return null;
  }

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
    category: product.category,
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      sortOrder: img.sortOrder,
    })),
    variants: product.variants,
  };
}

export async function createProduct(data: z.infer<typeof createProductSchema>) {
  const { images, ...productData } = data;

  const product = await prisma.product.create({
    data: {
      ...productData,
      images: images
        ? {
            create: images,
          }
        : undefined,
    },
    include: {
      category: true,
      images: true,
      variants: true,
    },
  });

  return product;
}

export async function updateProduct(id: string, data: z.infer<typeof updateProductSchema>) {
  const product = await prisma.product.update({
    where: { id },
    data,
    include: {
      category: true,
      images: true,
      variants: true,
    },
  });

  return product;
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({
    where: { id },
  });
}

export async function createVariant(data: z.infer<typeof createVariantSchema>) {
  const variant = await prisma.productVariant.create({
    data,
    include: {
      product: true,
    },
  });

  return variant;
}

export async function updateVariant(id: string, data: z.infer<typeof updateVariantSchema>) {
  const variant = await prisma.productVariant.update({
    where: { id },
    data,
    include: {
      product: true,
    },
  });

  return variant;
}

export async function deleteVariant(id: string) {
  await prisma.productVariant.delete({
    where: { id },
  });
}

