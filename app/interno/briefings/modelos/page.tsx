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
      <section className="bg-[#040c17] px-6 pt-8 text-white">
        <div className="mx-auto max-w-[1500px] rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-cyan-300">MODELO PARA PREPARAÇÃO</p>
              <h2 className="mt-1 text-lg font-semibold">Baixe o arquivo-base de briefing</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">
                Edite o DOCX mantendo os títulos das seções como Título 1 e as perguntas numeradas. Depois, importe o arquivo abaixo em “Importar DOCX”.
              </p>
            </div>
            <a
              href="/api/internal/briefing/template-file"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
            >
              Baixar modelo DOCX
            </a>
          </div>
        </div>
      </section>
      <BriefingTemplateAdmin />
      <BriefingImportUx />
      <BriefingImportAutofill />
    </>
  );
}
