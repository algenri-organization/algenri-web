import ProposalPreview from "@/components/proposals/proposal-preview";

export const metadata = { title: "Visualizar Proposta | ALGENRI", robots: { index: false, follow: false } };

export default async function ProposalPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProposalPreview id={id} />;
}
