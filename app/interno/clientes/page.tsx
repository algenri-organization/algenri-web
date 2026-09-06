import ClientsProjectsAdmin from "@/components/client-flow/clients-projects-admin";

export const metadata = {
  title: "Clientes e Projetos | ALGENRI",
  robots: { index: false, follow: false },
};

export default function ClientsPage() {
  return <ClientsProjectsAdmin />;
}
