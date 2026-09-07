import { ArrowRight, BadgeCheck, BriefcaseBusiness, FileSignature, FileText, FolderKanban, Inbox, LayoutDashboard, MessageSquareText, Sparkles, Users } from "lucide-react";

export const metadata = {
  title: "Área Interna | ALGENRI",
  robots: { index: false, follow: false },
};

const controlCards = [
  { href: "/interno/leads", icon: Users, label: "Interessados", helper: "Acompanhar novos contatos e retornos comerciais." },
  { href: "/interno/propostas", icon: FileText, label: "Propostas abertas", helper: "Revisar propostas em andamento e próximas decisões." },
  { href: "/interno/contratos", icon: FileSignature, label: "Contratos", helper: "Verificar contratos preparados, enviados e assinados." },
  { href: "/interno/projetos", icon: FolderKanban, label: "Projetos", helper: "Acompanhar projetos em briefing, desenvolvimento e conclusão." },
];

const pipeline = [
  { label: "Interessado", href: "/interno/leads", icon: Users },
  { label: "Briefing", href: "/interno/briefings/instancias", icon: Inbox },
  { label: "Dossiê", href: "/interno/dossies", icon: MessageSquareText },
  { label: "Proposta", href: "/interno/propostas", icon: FileText },
  { label: "Contrato", href: "/interno/contratos", icon: FileSignature },
  { label: "Projeto", href: "/interno/projetos", icon: FolderKanban },
];

const attentionItems = [
  { title: "Novos interessados", text: "Confira se existem contatos recentes aguardando primeiro atendimento.", href: "/interno/leads" },
  { title: "Propostas sem decisão", text: "Revise propostas em negociação e próximos retornos comerciais.", href: "/interno/propostas" },
  { title: "Contratos pendentes", text: "Acompanhe contratos aguardando assinatura ou upload do documento assinado.", href: "/interno/contratos" },
];

const quickActions = [
  { href: "/interno/leads", label: "Abrir interessados", icon: Users },
  { href: "/interno/clientes", label: "Abrir clientes", icon: BriefcaseBusiness },
  { href: "/interno/briefings/instancias", label: "Criar briefing", icon: Inbox },
  { href: "/interno/propostas", label: "Criar proposta", icon: FileText },
];

export default function InternalDashboardPage() {
  return (
    <main className="min-h-screen bg-[#040c17] px-5 pb-20 pt-28 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-8 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.25em] text-cyan-300"><LayoutDashboard className="h-4 w-4" /> Área interna</div>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Dashboard ALGENRI</h1>
            <p className="mt-3 max-w-3xl leading-7 text-white/55">Visão de comando para acompanhar comercial, operação e próximos passos sem depender de links técnicos diretos.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/interno/prontidao" className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[.06] px-4 py-2 text-xs text-emerald-200"><BadgeCheck className="h-4 w-4" /> Operação liberada para vendas</a>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {controlCards.map(({ href, icon: Icon, label, helper }) => (
            <a key={href} href={href} className="group rounded-[24px] border border-white/10 bg-white/[.035] p-5 transition hover:-translate-y-1 hover:border-cyan-300/25 hover:bg-white/[.05]">
              <div className="flex items-start justify-between gap-4"><div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[.04]"><Icon className="h-5 w-5 text-cyan-300" /></div><ArrowRight className="h-4 w-4 text-white/25 transition group-hover:translate-x-1 group-hover:text-cyan-300" /></div>
              <p className="mt-5 text-sm font-semibold text-white/85">{label}</p>
              <p className="mt-2 text-sm leading-6 text-white/42">{helper}</p>
            </a>
          ))}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.65fr_.85fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[.025] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold">Pipeline comercial</p><p className="mt-1 text-xs text-white/35">Acesse rapidamente cada etapa do fluxo.</p></div><Sparkles className="h-5 w-5 text-cyan-300/70" /></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pipeline.map(({ label, href, icon: Icon }, index) => (
                <a key={label} href={href} className="group relative rounded-2xl border border-white/[.08] bg-black/15 p-4 transition hover:border-cyan-300/20 hover:bg-white/[.04]">
                  <div className="flex items-center justify-between"><Icon className="h-4 w-4 text-cyan-200" /><span className="text-[10px] text-white/20">0{index + 1}</span></div>
                  <p className="mt-5 font-medium">{label}</p>
                  <p className="mt-1 text-xs text-white/32">Abrir etapa</p>
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-amber-300/10 bg-amber-300/[.025] p-5 sm:p-6">
            <p className="text-sm font-semibold">Atenção necessária</p>
            <p className="mt-1 text-xs leading-5 text-white/35">Checklist operacional para começar o dia.</p>
            <div className="mt-5 space-y-3">
              {attentionItems.map((item) => (
                <a key={item.title} href={item.href} className="block rounded-2xl border border-white/[.07] bg-black/15 p-4 transition hover:border-amber-200/20 hover:bg-white/[.035]">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-white/82">{item.title}</p><p className="mt-1 text-xs leading-5 text-white/38">{item.text}</p></div><ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-white/20" /></div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[.025] p-5 sm:p-6">
            <p className="text-sm font-semibold">Ações rápidas</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {quickActions.map(({ href, label, icon: Icon }) => <a key={label} href={href} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[.08] bg-black/15 px-4 py-4 text-sm text-white/60 transition hover:border-cyan-300/20 hover:text-white"><span className="flex items-center gap-3"><Icon className="h-4 w-4 text-cyan-200" />{label}</span><ArrowRight className="h-4 w-4 text-white/20" /></a>)}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[.025] p-5 sm:p-6">
            <p className="text-sm font-semibold">Agenda operacional</p>
            <p className="mt-2 text-sm leading-6 text-white/38">Espaço preparado para tarefas, prazos e compromissos vinculados aos clientes e projetos.</p>
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/10 p-5 text-sm text-white/30">Nenhum compromisso operacional exibido nesta versão. A integração com tarefas e calendário pode ser adicionada depois sem alterar o fluxo atual.</div>
          </div>
        </section>
      </div>
    </main>
  );
}
