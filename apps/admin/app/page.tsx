import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: "2rem" }}>ASKED Admin</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Link
          href="/products"
          style={{
            display: "inline-block",
            padding: "1rem",
            backgroundColor: "#0070f3",
            color: "white",
            textDecoration: "none",
            borderRadius: "4px",
            width: "fit-content",
          }}
        >
          Manage Products
        </Link>
        <Link
          href="/products/new"
          style={{
            display: "inline-block",
            padding: "1rem",
            backgroundColor: "#f5f5f5",
            color: "#333",
            textDecoration: "none",
            borderRadius: "4px",
            width: "fit-content",
            border: "1px solid #ddd",
          }}
        >
          Create New Product
        </Link>
      </div>
    </main>
  );
}



