import type { Metadata } from "next";
import AppLinkRedirect from "../../_components/app-link-redirect";

export const metadata: Metadata = {
  title: "Ver atualização | Psico ALGENRI",
  description: "Abra a atualização diretamente no app Psico ALGENRI.",
  robots: { index: false, follow: false },
};

export default async function PsicoUpdateLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const safeId = encodeURIComponent(id);
  const deepLink = `psicoalgenri://patient-home?updateId=${safeId}`;

  return (
    <AppLinkRedirect
      title="Abrindo sua atualização"
      description="Estamos direcionando você para o Psico ALGENRI para conferir os detalhes."
      deepLink={deepLink}
    />
  );
}
