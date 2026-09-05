import BriefingImportUx from "@/components/briefing/briefing-import-ux";
import BriefingImportAutofill from "@/components/briefing/briefing-import-autofill";
import BriefingTemplateAdmin from "@/components/briefing/briefing-template-admin";

export const metadata = {
  title: "Modelos de Briefing | ALGENRI",
  robots: { index: false, follow: false },
};

export default function BriefingModelsPage() {
  return (
    <>
      <BriefingTemplateAdmin />
      <BriefingImportUx />
      <BriefingImportAutofill />
    </>
  );
}
