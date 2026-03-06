import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Local Signal — Find Trusted Local Spots",
  description: "Discover trusted local spots powered by Nostr reputation signals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
