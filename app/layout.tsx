import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShelfCast – Stock the right products",
  description: "AI-powered inventory analytics for retailers, manufacturers & importers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body>{children}</body>
    </html>
  );
}
