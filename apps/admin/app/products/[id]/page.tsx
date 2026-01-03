"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import Layout from "@/components/Layout";
import { apiFetch } from "@/lib/api";
import { Product } from "@/types/product";
import { ProductEditForm } from "./ProductEditForm";

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const data = await apiFetch<Product>(`/admin/products/${id}`);
        setProduct(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setError("Не удалось загрузить товар. Убедитесь, что API сервер запущен.");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Загрузка товара...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <p className="text-yellow-800">{error || "Товар не найден"}</p>
          </div>
        </div>
      </Layout>
    );
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
