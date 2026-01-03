export type Category = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  oldPrice: number | null;
  images: string[];
  categoryId: string | null;
  category: Category | null;
  sku: string | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  sizes: string[];
  colors: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateProductInput = {
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  oldPrice?: number | null;
  images?: string[];
  categoryId?: string | null;
  sku?: string | null;
  stock?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  sizes?: string[];
  colors?: string[];
};

export type UpdateProductInput = {
  slug?: string;
  name?: string;
  description?: string | null;
  price?: number;
  oldPrice?: number | null;
  images?: string[];
  categoryId?: string | null;
  sku?: string | null;
  stock?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  sizes?: string[];
  colors?: string[];
};
