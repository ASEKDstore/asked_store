import { notFound } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Product } from "@/types/product";
import { ProductEditForm } from "./ProductEditForm";

async function getProduct(id: string): Promise<Product | null> {
  try {
    return await apiFetch<Product>(`/admin/products/${id}`);
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return null;
  }
}

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await getProduct(params.id);

  if (!product) {
    notFound();
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <h1 style={{ marginBottom: "2rem" }}>Edit Product</h1>
      <ProductEditForm product={product} />
    </div>
  );
}

