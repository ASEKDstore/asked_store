import { notFound } from "next/navigation";
import Layout from "@/components/Layout";
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
    <Layout>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Редактировать товар</h1>
        <p className="text-gray-600 mb-8">Изменение данных товара</p>
        <ProductEditForm product={product} />
      </div>
    </Layout>
  );
}
