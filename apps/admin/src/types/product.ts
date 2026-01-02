export type Category = {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
};

export type ProductImage = {
  id: string;
  productId: string;
  url: string;
  sortOrder: number;
};

export type ProductVariant = {
  id: string;
  productId: string;
  sku: string;
  size: string | null;
  color: string | null;
  price: number;
  stock: number;
  isActive: boolean;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  isActive: boolean;
  categoryId: string | null;
  createdAt: string;
  category: Category | null;
  images: ProductImage[];
  variants: ProductVariant[];
};

export type CreateProductInput = {
  slug: string;
  title: string;
  description?: string | null;
  isActive?: boolean;
  categoryId?: string | null;
  images?: Array<{
    url: string;
    sortOrder?: number;
  }>;
};

export type UpdateProductInput = {
  slug?: string;
  title?: string;
  description?: string | null;
  isActive?: boolean;
  categoryId?: string | null;
};

