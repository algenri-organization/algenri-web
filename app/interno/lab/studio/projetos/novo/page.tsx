import { ArrowLeft, CheckCircle2, Coins, Film, Gauge, Target, Users } from "lucide-react";
import { studioProjectFormats } from "@/lib/studio/projects";

const fields = [
  { label: "Nome do projeto", placeholder: "Ex.: Vídeo institucional ALGENRI Studio" },
  { label: "Objetivo", placeholder: "O que esta produção precisa comunicar ou gerar?" },
  { label: "Público", placeholder: "Quem precisa assistir, ouvir ou receber este conteúdo?" },
  { label: "Destino", placeholder: "Ex.: site, apresentação, Instagram, proposta, anúncio" },
];

export default function NewStudioProjectPage() {
  return <main className="min-h-screen bg-[#040c17] px-6 pb-20 pt-28 text-white">
    <div className="mx-auto max-w-5xl">
      <a href="/interno/lab/studio/projetos" className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-white"><ArrowLeft className="h-4 w-4"/> Voltar aos projetos</a>

      <div className="mt-5 border-b border-white/10 pb-7">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-cyan-200"><Film className="h-4 w-4"/> Novo projeto</div>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Abrir projeto no ALGENRI Studio</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">Primeiro definimos contexto e limites. Só depois o Studio entra em roteiro, storyboard e geração. Esta tela ainda é a fundação visual; a persistência será conectada na próxima etapa.</p>
      </div>

      <section className="mt-7 grid gap-4 md:grid-cols-2">
        {fields.map(({label,placeholder},index)=><label key={label} className={`${index===1?"md:col-span-2":""} rounded-[20px] border border-white/10 bg-white/[.02] p-4`}><span className="text-xs font-semibold text-white/70">{label}</span>{index===1?<textarea rows={4} placeholder={placeholder} className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-cyan-300/25"/>:<input placeholder={placeholder} className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-cyan-300/25"/>}</label>)}
      </section>

      <section className="mt-7">
        <div className="flex items-center gap-2"><Target className="h-4 w-4 text-violet-200"/><h2 className="font-semibold">Formato principal</h2></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">{studioProjectFormats.map((item,index)=><label key={item.value} className="cursor-pointer rounded-[20px] border border-white/10 bg-white/[.02] p-4 transition hover:border-violet-300/20"><div className="flex items-center justify-between"><input type="radio" name="format" defaultChecked={index===0} className="accent-cyan-300"/><span className="text-[9px] uppercase tracking-[.12em] text-white/25">{item.value}</span></div><p className="mt-4 text-sm font-semibold">{item.label}</p><p className="mt-2 text-xs leading-5 text-white/35">{item.detail}</p></label>)}</div>
      </section>

      <section className="mt-7 grid gap-4 lg:grid-cols-3">
        <label className="rounded-[20px] border border-white/10 bg-white/[.02] p-4"><span className="flex items-center gap-2 text-xs font-semibold text-white/70"><Gauge className="h-4 w-4"/> Duração estimada</span><input type="number" min="1" placeholder="segundos" className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-cyan-300/25"/></label>
        <label className="rounded-[20px] border border-white/10 bg-white/[.02] p-4"><span className="flex items-center gap-2 text-xs font-semibold text-white/70"><Coins className="h-4 w-4"/> Teto de orçamento</span><input type="number" min="0" step="0.01" placeholder="R$" className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-cyan-300/25"/></label>
        <div className="rounded-[20px] border border-emerald-300/15 bg-emerald-300/[.025] p-4"><span className="flex items-center gap-2 text-xs font-semibold text-emerald-100"><Users className="h-4 w-4"/> Governança</span><p className="mt-3 text-xs leading-5 text-white/40">Nenhuma API paga será executada nesta etapa. O orçamento servirá como guardrail quando conectarmos os provedores.</p></div>
      </section>

      <section className="mt-7 rounded-[24px] border border-cyan-300/15 bg-cyan-300/[.025] p-5">
        <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-cyan-200"/><div><h2 className="font-semibold">Próxima etapa após salvar</h2><p className="mt-2 text-sm leading-6 text-white/45">O projeto abrirá seu workspace próprio com briefing, roteiro, storyboard, assets, voz, custos, provedores, gerações e revisão por cena. A persistência e esse workspace serão implementados na sequência.</p></div></div>
      </section>

      <div className="mt-7 flex justify-end"><button disabled className="rounded-xl border border-white/10 bg-white/[.04] px-5 py-3 text-sm font-semibold text-white/30">Salvar projeto — próxima etapa</button></div>
    </div>
  </main>;
}
