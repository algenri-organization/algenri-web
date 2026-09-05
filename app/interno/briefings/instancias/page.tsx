import BriefingInstanceAdmin from "@/components/briefing/briefing-instance-admin";

export const metadata = {
  title: "Instâncias de Briefing | ALGENRI",
  robots: { index: false, follow: false },
};

export default function BriefingInstancesPage() {
  return <BriefingInstanceAdmin />;
}
