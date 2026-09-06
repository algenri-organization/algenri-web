import DossierAdmin from "@/components/dossiers/dossier-admin";

export const metadata = {
  title: "Dossiês de Projeto | ALGENRI",
  robots: { index: false, follow: false },
};

export default function DossiersPage() {
  return <DossierAdmin />;
}
