import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { Product } from "@/types/product";

async function getProducts(): Promise<Product[]> {
  try {
    return await apiFetch<Product[]>("/admin/products");
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1>Products</h1>
        <Link
          href="/products/new"
          style={{
            display: "inline-block",
            padding: "0.5rem 1rem",
            backgroundColor: "#0070f3",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
          }}
        >
          Create New Product
        </Link>
      </div>

      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid #ddd",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid #ddd" }}>
                Title
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid #ddd" }}>
                Slug
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid #ddd" }}>
                Active
              </th>
              <th style={{ padding: "0.75rem", textAlign: "left", border: "1px solid #ddd" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td style={{ padding: "0.75rem", border: "1px solid #ddd" }}>
                  {product.title}
                </td>
                <td style={{ padding: "0.75rem", border: "1px solid #ddd" }}>
                  {product.slug}
                </td>
                <td style={{ padding: "0.75rem", border: "1px solid #ddd" }}>
                  {product.isActive ? "Yes" : "No"}
                </td>
                <td style={{ padding: "0.75rem", border: "1px solid #ddd" }}>
                  <Link
                    href={`/products/${product.id}`}
                    style={{
                      display: "inline-block",
                      padding: "0.25rem 0.75rem",
                      backgroundColor: "#0070f3",
                      color: "white",
                      textDecoration: "none",
                      borderRadius: "4px",
                      fontSize: "0.875rem",
                    }}
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

