import ProjectDetailAdmin from "@/components/client-flow/project-detail-admin";

export const metadata = {
  title: "Projeto | ALGENRI",
  robots: { index: false, follow: false },
};

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetailAdmin id={id} />;
}
