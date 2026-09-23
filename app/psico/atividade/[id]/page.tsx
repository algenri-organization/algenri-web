import type { Metadata } from "next";
import AppLinkRedirect from "../../_components/app-link-redirect";

export const metadata: Metadata = {
  title: "Abrir atividade | Psico ALGENRI",
  description: "Abra a atividade diretamente no app Psico ALGENRI.",
  robots: { index: false, follow: false },
};

export default async function PsicoActivityLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const safeId = encodeURIComponent(id);
  const deepLink = `psicoalgenri://patient-tasks?taskId=${safeId}`;

  return (
    <AppLinkRedirect
      title="Abrindo sua atividade"
      description="Estamos direcionando você para a área de atividades do Psico ALGENRI."
      deepLink={deepLink}
    />
  );
}
