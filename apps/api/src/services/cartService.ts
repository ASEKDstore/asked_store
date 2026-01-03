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
        size: size ?? null,
        color: color ?? null,
      },
    });
  } else {
    // Check stock
    if (quantity > product.stock) {
      throw new Error("INSUFFICIENT_STOCK");
    }

    // Prepare values - use undefined instead of null for Prisma unique constraint
    const sizeValue = size ?? undefined;
    const colorValue = color ?? undefined;

    // Check if item exists using findFirst instead of findUnique
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId,
        productId,
        size: sizeValue ?? null,
        color: colorValue ?? null,
      },
    });

    if (existingItem) {
      // Update existing item
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity },
      });
    } else {
      // Create new item
      await prisma.cartItem.create({
        data: {
          userId,
          productId,
          quantity,
          size: sizeValue ?? null,
          color: colorValue ?? null,
        },
      });
    }
  }

  return getCart(userId);
}
