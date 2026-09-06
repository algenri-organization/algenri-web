import ProjectDetailAdmin from "@/components/client-flow/project-detail-admin";
import ProjectProposalsPanel from "@/components/proposals/project-proposals-panel";

export const metadata = {
  title: "Projeto | ALGENRI",
  robots: { index: false, follow: false },
};

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <><ProjectDetailAdmin id={id} /><ProjectProposalsPanel projectId={id} /></>;
}
