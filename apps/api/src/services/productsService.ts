import { prisma } from "../lib/prisma";
import { z } from "zod";

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
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  if (minPrice !== undefined) {
    where.price = { ...where.price, gte: minPrice };
  }
  if (maxPrice !== undefined) {
    where.price = { ...where.price, lte: maxPrice };
  }

  if (size) {
    where.sizes = { has: size };
  }

  if (color) {
    where.colors = { has: color };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  const data = products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    oldPrice: product.oldPrice,
    images: product.images,
    category: product.category,
  }));

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
      category: true,
    },
  });

  if (!product) {
    return null;
  }

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    price: product.price,
    oldPrice: product.oldPrice,
    images: product.images,
    sizes: product.sizes,
    colors: product.colors,
    stock: product.stock,
    category: product.category,
  };
}

// Simplified create/update for admin - will need to match schema
export async function createProduct(data: any) {
  const product = await prisma.product.create({
    data: {
      name: data.name || data.title,
      slug: data.slug,
      description: data.description,
      price: data.price || 0,
      oldPrice: data.oldPrice,
      images: data.images || [],
      sizes: data.sizes || [],
      colors: data.colors || [],
      categoryId: data.categoryId,
      isActive: data.isActive !== false,
      stock: data.stock || 0,
    },
    include: {
      category: true,
    },
  });

  return product;
}

export async function updateProduct(id: string, data: any) {
  const product = await prisma.product.update({
    where: { id },
    data: {
      name: data.name || data.title,
      slug: data.slug,
      description: data.description,
      price: data.price,
      oldPrice: data.oldPrice,
      images: data.images,
      sizes: data.sizes,
      colors: data.colors,
      categoryId: data.categoryId,
      isActive: data.isActive,
      stock: data.stock,
    },
    include: {
      category: true,
    },
  });

  return product;
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({
    where: { id },
  });
}
