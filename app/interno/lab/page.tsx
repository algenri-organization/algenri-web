import { Boxes, FlaskConical, FolderKanban, Gauge, Library, PlugZap, Sparkles } from "lucide-react";

const cards = [
  { title: "ALGENRI Studio", detail: "Produção multimodal com IA para vídeos, imagens, avatares, voz e roteiros.", href: "/interno/lab/studio", icon: Sparkles, ready: true },
  { title: "Projetos experimentais", detail: "Provas de conceito, protótipos e testes que podem evoluir para produtos ou serviços.", icon: FolderKanban },
  { title: "Apps & Toys", detail: "Microapps, experiências interativas e ideias rápidas para validar novos formatos.", icon: Boxes },
  { title: "Biblioteca", detail: "Assets, referências, prompts, personagens, marcas e materiais reutilizáveis.", icon: Library },
  { title: "Benchmarks de IA", detail: "Comparação de qualidade, custo, velocidade e aderência entre modelos e provedores.", icon: Gauge },
  { title: "Integrações criativas", detail: "Conexões com HeyGen, Runway, Kie.ai e outros motores criativos.", icon: PlugZap },
];

export default function AlgenriLabPage() {
  return <main className="min-h-screen bg-[#040c17] px-6 pb-20 pt-28 text-white">
    <div className="mx-auto max-w-6xl">
      <div className="border-b border-white/10 pb-7">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-violet-200"><FlaskConical className="h-4 w-4"/> ALGENRI Lab</div>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Laboratório de criação e experimentação</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">Ambiente para transformar ideias em protótipos, conteúdo, produtos e novos serviços. O Lab concentra as ferramentas criativas da ALGENRI sem misturar produção com a operação de Marketing.</p>
      </div>

      <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(({title,detail,href,icon:Icon,ready}) => {
          const content = <><div className="flex items-center justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl border border-violet-300/15 bg-violet-300/[.06]"><Icon className="h-5 w-5 text-violet-200"/></div><span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[.12em] ${ready?"border-emerald-300/15 bg-emerald-300/[.05] text-emerald-200":"border-white/10 text-white/30"}`}>{ready?"iniciar":"em breve"}</span></div><h2 className="mt-5 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-white/45">{detail}</p></>;
          return href ? <a key={title} href={href} className="rounded-[24px] border border-white/10 bg-white/[.025] p-5 transition hover:border-violet-300/20 hover:bg-violet-300/[.035]">{content}</a> : <article key={title} className="rounded-[24px] border border-white/10 bg-white/[.02] p-5">{content}</article>;
        })}
      </section>
    </div>
  </main>;
}
