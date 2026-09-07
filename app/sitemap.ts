import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://algenri.com.br";
  const now = new Date();

  return [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/solucoes`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/planos`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/diagnostico`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/contato`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/privacidade`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];
}
