import { prisma } from "../lib/prisma";

export async function getCart(userId: string) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
  });

  const cartItems = items.map((item) => ({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    size: item.size,
    color: item.color,
    product: {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      price: item.product.price,
      images: item.product.images,
      category: item.product.category,
    },
    lineTotal: item.product.price * item.quantity,
  }));

  const total = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    items: cartItems,
    total,
    itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export async function updateCartItem(
  userId: string,
  productId: string,
  quantity: number,
  size?: string | null,
  color?: string | null
) {
  // Check product exists and is active
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  if (!product.isActive) {
    throw new Error("PRODUCT_NOT_ACTIVE");
  }

  if (quantity === 0) {
    // Remove item
    await prisma.cartItem.deleteMany({
      where: {
        userId,
        productId,
        size: size || null,
        color: color || null,
      },
    });
  } else {
    // Check stock
    if (quantity > product.stock) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    // Upsert item
    await prisma.cartItem.upsert({
      where: {
        userId_productId_size_color: {
          userId,
          productId,
          size: size ?? null,
          color: color ?? null,
        },
      },
      update: {
        quantity,
      },
      create: {
        userId,
        productId,
        quantity,
        size: size ?? null,
        color: color ?? null,
      },
    });
  }

  return getCart(userId);
}
