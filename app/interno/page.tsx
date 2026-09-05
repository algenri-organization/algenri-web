import { ArrowRight, FileText, FolderKanban, Inbox, LayoutDashboard, MessageSquareText, Settings2, Users } from "lucide-react";

export const metadata = {
  title: "Área Interna | ALGENRI",
  robots: { index: false, follow: false },
};

const activeCards = [
  { href: "/interno/leads", icon: Users, title: "Interessados", text: "Acompanhe contatos comerciais registrados pelo site e o status das notificações." },
  { href: "/interno/briefings/modelos", icon: FileText, title: "Modelos de Briefing", text: "Importe, revise, versione e publique modelos reutilizáveis." },
  { href: "/interno/briefings/instancias", icon: FolderKanban, title: "Criar / Enviar Briefing", text: "Gere uma instância individual e o link seguro para cada cliente." },
  { href: "/interno/briefings/recebidos", icon: Inbox, title: "Briefings Recebidos", text: "Visualize respostas concluídas ou em andamento e exporte os dados do projeto." },
];

const futureCards = [
  { icon: MessageSquareText, title: "Dossiês de Projeto", text: "Transformar briefings em documento inicial para cliente e entrada estruturada para IA." },
  { icon: FolderKanban, title: "Clientes e Projetos", text: "Centralizar proposta, contrato, desenvolvimento, homologação, entrega e suporte." },
  { icon: Settings2, title: "Configurações", text: "Canais, integrações, notificações, usuários e preferências operacionais." },
];

export default function InternalDashboardPage() {
  return (
    <main className="min-h-screen bg-[#040c17] px-6 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.25em] text-cyan-300"><LayoutDashboard className="h-4 w-4" /> Área interna</div>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-.04em]">Dashboard ALGENRI</h1>
            <p className="mt-3 max-w-2xl leading-7 text-white/55">Ponto central para acompanhar o ciclo comercial e operacional dos projetos, sem depender de links técnicos diretos.</p>
          </div>
          <a href="/" className="text-sm text-white/50 transition hover:text-white">Voltar ao site</a>
        </div>

        <section className="mt-9">
          <div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">Operação disponível</h2><span className="rounded-full border border-emerald-300/20 bg-emerald-300/[.06] px-3 py-1 text-xs text-emerald-200">Client Flow v1</span></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {activeCards.map(({ href, icon: Icon, title, text }) => (
              <a key={href} href={href} className="group rounded-[24px] border border-white/10 bg-white/[.03] p-6 transition hover:-translate-y-1 hover:border-cyan-300/25 hover:bg-white/[.05]">
                <div className="flex items-start justify-between gap-4"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[.04]"><Icon className="h-5 w-5 text-cyan-300" /></div><ArrowRight className="h-4 w-4 text-white/25 transition group-hover:translate-x-1 group-hover:text-cyan-300" /></div>
                <h3 className="mt-5 text-xl font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-white/50">{text}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">Próximas evoluções</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {futureCards.map(({ icon: Icon, title, text }) => <div key={title} className="rounded-[22px] border border-white/[.07] bg-black/15 p-5"><Icon className="h-5 w-5 text-white/35" /><h3 className="mt-4 font-medium text-white/75">{title}</h3><p className="mt-2 text-sm leading-6 text-white/38">{text}</p></div>)}
          </div>
        </section>
      </div>
    </main>
  );
}
