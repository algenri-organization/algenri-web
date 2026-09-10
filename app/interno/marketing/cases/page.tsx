import { ArrowRight, FolderKanban, Sparkles, Workflow } from "lucide-react";

const stages = [
  { label: "1", title: "Case nasce da operação", detail: "Resultados reais, protótipos, aprendizados e entregas da ALGENRI entram como matéria-prima." },
  { label: "2", title: "Transformar em conteúdo", detail: "O aprendizado é convertido em bastidor, demonstração, antes/depois, reel, carrossel ou artigo." },
  { label: "3", title: "Publicar e distribuir", detail: "O conteúdo alimenta os canais da ALGENRI e fortalece autoridade, prova social e descoberta." },
  { label: "4", title: "Gerar nova demanda", detail: "A audiência segue para diagnóstico, conversa comercial, protótipo e novos projetos." },
];

export default function CasesPage() {
  return <main className="min-h-screen bg-[#040c17] px-6 pb-20 pt-28 text-white">
    <div className="mx-auto max-w-6xl">
      <div className="border-b border-white/10 pb-7">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-violet-200"><FolderKanban className="h-4 w-4"/> Marketing · Cases & Build in Public</div>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Transformar execução em autoridade</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">Esta área organiza a ponte entre o que a ALGENRI constrói e o que o mercado vê. O objetivo é documentar resultados, aprendizados e bastidores com critério, gerando conteúdo, prova social e novas oportunidades comerciais.</p>
      </div>

      <section className="mt-7 grid gap-4 lg:grid-cols-4">
        {stages.map((stage, index) => <article key={stage.label} className="relative rounded-[22px] border border-white/10 bg-white/[.025] p-5"><div className="grid h-9 w-9 place-items-center rounded-full border border-violet-300/15 bg-violet-300/[.06] text-xs font-semibold text-violet-100">{stage.label}</div><h2 className="mt-4 font-semibold">{stage.title}</h2><p className="mt-2 text-xs leading-5 text-white/40">{stage.detail}</p>{index < stages.length-1 && <ArrowRight className="absolute -right-3 top-8 hidden h-5 w-5 text-white/20 lg:block"/>}</article>)}
      </section>

      <section className="mt-6 rounded-[28px] border border-cyan-300/15 bg-cyan-300/[.025] p-6">
        <div className="flex items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[.06]"><Workflow className="h-5 w-5 text-cyan-200"/></div><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-cyan-200">Fluxo estratégico</p><h2 className="mt-2 text-xl font-semibold">LAB / CASE → Conteúdo → Audiência → Diagnóstico → Lead → Projeto → Resultado → Novo case</h2><p className="mt-2 max-w-4xl text-sm leading-6 text-white/45">O Build in Public entra como método de distribuição e construção de confiança, sem expor informações de clientes ou projetos que não estejam autorizados para divulgação.</p></div></div>
      </section>

      <div className="mt-5 flex items-center gap-2 text-xs text-white/35"><Sparkles className="h-4 w-4"/> Próxima fase: cadastro de cases, autorização de uso, ativos do case e transformação em pautas de conteúdo.</div>
    </div>
  </main>;
}
