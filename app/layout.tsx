import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Markwise — A clearer view of every result",
  description:
    "Private, browser-local examination result analysis. Extract student marks from PDFs, review records, and understand class performance.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
