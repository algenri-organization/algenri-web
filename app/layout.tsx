import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://algenri.com.br"),
  title: {
    default: "ALGENRI — Soluções Digitais, IA e Automação",
    template: "%s | ALGENRI",
  },
  description:
    "Sites, inteligência artificial, automações, vídeos e sistemas para empresas que querem evoluir no digital.",
  openGraph: {
    title: "ALGENRI — Soluções Digitais, IA e Automação",
    description:
      "Tecnologia, presença digital e automação para transformar ideias em negócios mais eficientes.",
    url: "https://algenri.com.br",
    siteName: "ALGENRI",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
