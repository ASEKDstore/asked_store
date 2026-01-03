import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ASKED Mini App",
  description: "Telegram Mini App for ASKED shop",
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




