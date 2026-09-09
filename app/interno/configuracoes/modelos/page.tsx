import { FileText } from "lucide-react";
import DocumentModelsAdmin from "@/components/internal/document-models-admin";

export const metadata = {
  title: "Modelos de documentos | ALGENRI",
  robots: { index: false, follow: false },
};

export default function DocumentModelsPage() {
  return (
    <main className="min-h-screen bg-[#040c17] px-5 pb-20 pt-28 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="border-b border-white/10 pb-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.25em] text-cyan-300"><FileText className="h-4 w-4" /> Modelos e documentos</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Biblioteca de documentos</h1>
          <p className="mt-3 max-w-3xl leading-7 text-white/55">Crie, versione, publique e arquive textos-base para propostas, contratos e documentos internos. Nenhum conteúdo é excluído de forma destrutiva.</p>
          <div className="mt-4 flex flex-wrap gap-2"><a href="/interno/briefings/modelos" className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/55 transition hover:border-white/20 hover:text-white">Modelos de briefing</a><a href="/interno/configuracoes" className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/55 transition hover:border-white/20 hover:text-white">Voltar às configurações</a></div>
        </div>
        <div className="mt-8"><DocumentModelsAdmin /></div>
      </div>
    </main>
  );
}
