import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HTML to Markdown Converter for Docusaurus",
  description: "Convert HTML content to Docusaurus-compatible Markdown format. Perfect for migrating online documentation to your Docusaurus projects.",
  keywords: ["HTML", "Markdown", "Docusaurus", "converter", "documentation", "migration"],
  authors: [{ name: "HTML to MD Converter" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#2563eb",
  openGraph: {
    title: "HTML to Markdown Converter for Docusaurus",
    description: "Convert HTML content to Docusaurus-compatible Markdown format",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}