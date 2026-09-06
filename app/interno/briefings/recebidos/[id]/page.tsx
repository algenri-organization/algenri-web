import BriefingLinkedDetail from "@/components/briefing/briefing-linked-detail";

export const metadata = {
  title: "Briefing | ALGENRI",
  robots: { index: false, follow: false },
};

export default async function BriefingLinkedDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BriefingLinkedDetail id={id} />;
}
