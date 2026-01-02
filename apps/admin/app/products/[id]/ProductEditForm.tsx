"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/src/lib/api";
import { Product, UpdateProductInput } from "@/src/types/product";

type ProductEditFormProps = {
  product: Product;
};

export function ProductEditForm({ product }: ProductEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: UpdateProductInput = {
      slug: formData.get("slug") as string,
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      isActive: formData.get("isActive") === "on",
    };

    try {
      await apiFetch(`/admin/products/${product.id}`, {
        method: "PUT",
        body: data,
      });

      router.push("/products");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {error && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#fee",
            border: "1px solid #fcc",
            borderRadius: "4px",
            marginBottom: "1rem",
            color: "#c00",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="title"
            style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}
          >
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            defaultValue={product.title}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem",
            }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="slug"
            style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}
          >
            Slug *
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            required
            defaultValue={product.slug}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem",
            }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="description"
            style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={product.description || ""}
            style={{
              width: "100%",
              padding: "0.5rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem",
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              defaultChecked={product.isActive}
              style={{ width: "18px", height: "18px" }}
            />
            <span>Active</span>
          </label>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "0.5rem 1.5rem",
              backgroundColor: isSubmitting ? "#ccc" : "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "1rem",
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            style={{
              padding: "0.5rem 1.5rem",
              backgroundColor: "#f5f5f5",
              color: "#333",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}

