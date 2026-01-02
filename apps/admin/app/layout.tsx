import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ASKED Admin",
  description: "Admin panel for ASKED shop",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav
          style={{
            borderBottom: "1px solid #ddd",
            padding: "1rem 2rem",
            backgroundColor: "#f9f9f9",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "2rem",
              alignItems: "center",
            }}
          >
            <Link
              href="/"
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                textDecoration: "none",
                color: "#333",
              }}
            >
              ASKED Admin
            </Link>
            <Link
              href="/products"
              style={{
                textDecoration: "none",
                color: "#0070f3",
              }}
            >
              Products
            </Link>
            <Link
              href="/products/new"
              style={{
                textDecoration: "none",
                color: "#0070f3",
              }}
            >
              New Product
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}



