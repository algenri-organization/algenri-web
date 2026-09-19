import type { Metadata } from "next";
import EmailConfirmedClient from "./email-confirmed-client";

export const metadata: Metadata = {
  title: "E-mail confirmado | Psico ALGENRI",
  description:
    "Seu e-mail foi confirmado com sucesso. Volte ao app Psico ALGENRI e conheça os recursos da plataforma.",
  alternates: {
    canonical: "/psico/email-confirmado",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function EmailConfirmedPage() {
  return <EmailConfirmedClient />;
}
