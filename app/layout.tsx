import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ALGENRI — Soluções Digitais & IA",
  description:
    "Sites, inteligência artificial, automações e sistemas para transformar ideias em negócios digitais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
