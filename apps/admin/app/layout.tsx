import type { Metadata } from "next";

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
      <body>{children}</body>
    </html>
  );
}

