import { BadgeCheck, Bell, Building2, CircleDollarSign, FileText, Mail, PlugZap, Settings2, ShieldCheck, Smartphone, Users } from "lucide-react";

export const metadata = {
  title: "Configurações | ALGENRI",
  robots: { index: false, follow: false },
};

const sections = [
  {
    icon: Building2,
    title: "Empresa e identidade",
    text: "Central para dados institucionais, identidade da ALGENRI e informações utilizadas em documentos comerciais.",
    status: "Disponível",
    tone: "emerald",
    items: [
      { label: "Identidade ALGENRI", detail: "Marca, domínio, slogan e posicionamento institucional." },
      { label: "Empresa faturadora", detail: "JM MIND E PERFORMANCE LTDA definida para o lançamento." },
      { label: "Dados jurídicos", detail: "CNPJ, endereço e representante podem ser preenchidos com os dados oficiais quando confirmados." },
    ],
    action: { href: "/interno/configuracoes/empresa", label: "Editar dados da empresa" },
  },
  {
    icon: Smartphone,
    title: "Canais comerciais",
    text: "Pontos de contato usados para receber, responder e acompanhar oportunidades comerciais.",
    status: "Operacional",
    tone: "emerald",
    items: [
      { label: "E-mail comercial", detail: "contato@algenri.com.br — envio e recebimento validados." },
      { label: "WhatsApp comercial", detail: "Canal público e alerta interno de novos leads já validados em produção." },
      { label: "Prontidão dos canais", detail: "SPF, DKIM, DMARC, domínio e SSL validados." },
    ],
    action: { href: "/interno/prontidao", label: "Abrir prontidão" },
  },
  {
    icon: CircleDollarSign,
    title: "Financeiro",
    text: "Cobranças, parcelamentos, recorrência, previsão de recebimentos e preparação para integração bancária.",
    status: "Operacional",
    tone: "emerald",
    items: [
      { label: "Controle financeiro", detail: "Cobranças únicas, parceladas e recorrentes disponíveis na Área Interna." },
      { label: "C6 Bank", detail: "Integração solicitada; API, homologação e credenciais aguardam confirmação do banco." },
      { label: "Cora", detail: "Alternativa mantida para o futuro e adiada nesta fase." },
    ],
    action: { href: "/interno/financeiro", label: "Abrir financeiro" },
  },
  {
    icon: PlugZap,
    title: "Integrações",
    text: "Visão central das conexões técnicas utilizadas pela operação digital da ALGENRI.",
    status: "Disponível",
    tone: "violet",
    items: [
      { label: "Infraestrutura", detail: "Vercel, Firebase e GitHub consolidados na operação." },
      { label: "WhatsApp / Meta", detail: "Template, envio, webhook e monitoramento de eventos operacionais." },
      { label: "Bancos", detail: "C6 aguardando retorno oficial; Cora adiada nesta fase." },
    ],
    action: { href: "/interno/configuracoes/integracoes", label: "Abrir integrações" },
  },
  {
    icon: Bell,
    title: "Notificações",
    text: "Preferências pessoais de alertas da Área Interna e preparação dos próximos canais automáticos.",
    status: "Disponível",
    tone: "cyan",
    items: [
      { label: "Área Interna", detail: "Preferências para Financeiro, Comercial e Operação." },
      { label: "E-mail", detail: "Preferências persistidas; motor de disparo ainda será conectado." },
      { label: "WhatsApp", detail: "Preferência para futuros alertas críticos, separada do alerta de novos leads já operacional." },
    ],
    action: { href: "/interno/configuracoes/notificacoes", label: "Configurar notificações" },
  },
  {
    icon: FileText,
    title: "Modelos e documentos",
    text: "Atalhos para materiais reutilizáveis que padronizam o ciclo comercial e operacional.",
    status: "Parcialmente disponível",
    tone: "cyan",
    items: [
      { label: "Modelos de briefing", detail: "Importação, revisão, versionamento e publicação disponíveis." },
      { label: "Modelos de proposta", detail: "Refinamentos e padronização adicional podem ser incorporados depois." },
      { label: "Modelos de contrato", detail: "Modelo operacional ativo; melhoria visual e jurídica está no backlog." },
    ],
    action: { href: "/interno/briefings/modelos", label: "Abrir modelos de briefing" },
  },
  {
    icon: Users,
    title: "Usuários e acesso",
    text: "Controle de quem pode acessar a Área Interna e quais permissões cada perfil possui.",
    status: "Operacional",
    tone: "emerald",
    items: [
      { label: "Autenticação", detail: "Área interna protegida por Firebase Authentication." },
      { label: "Equipe", detail: "Cadastro, ativação e desativação de contas internas disponíveis." },
      { label: "Perfis e permissões", detail: "Administrador e Colaborador com permissões por módulo." },
    ],
    action: { href: "/interno/configuracoes/usuarios", label: "Gerenciar usuários" },
  },
];

const toneClasses: Record<string, string> = {
  cyan: "border-cyan-300/15 bg-cyan-300/[.05] text-cyan-200",
  emerald: "border-emerald-300/15 bg-emerald-300/[.05] text-emerald-200",
  violet: "border-violet-300/15 bg-violet-300/[.05] text-violet-200",
};

export default function ConfiguracoesPage() {
  return (
    <main className="min-h-screen bg-[#040c17] px-5 pb-20 pt-28 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="border-b border-white/10 pb-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.25em] text-cyan-300"><Settings2 className="h-4 w-4" /> Configurações</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Central de configurações</h1>
          <p className="mt-3 max-w-3xl leading-7 text-white/55">Organize dados institucionais, canais, integrações, notificações, documentos e acessos sem espalhar configurações pela Área Interna.</p>
        </div>

        <div className="mt-8 rounded-[26px] border border-emerald-300/12 bg-emerald-300/[.025] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" /><div><p className="font-semibold">Base operacional validada</p><p className="mt-1 text-sm leading-6 text-white/45">Canais comerciais, domínio, SSL, autenticação do e-mail, WhatsApp/Meta e infraestrutura já foram validados para a operação de lançamento.</p></div></div>
            <a href="/interno/prontidao" className="button-secondary shrink-0 text-sm">Ver prontidão <BadgeCheck className="h-4 w-4" /></a>
          </div>
        </div>

        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <article key={section.title} className="rounded-[28px] border border-white/10 bg-white/[.025] p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[.04]"><Icon className="h-5 w-5 text-cyan-300" /></div>
                    <div><h2 className="text-lg font-semibold">{section.title}</h2><p className="mt-1 max-w-xl text-sm leading-6 text-white/45">{section.text}</p></div>
                  </div>
                  <span className={`w-fit shrink-0 rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[.12em] ${toneClasses[section.tone]}`}>{section.status}</span>
                </div>

                <div className="mt-6 space-y-2.5">
                  {section.items.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/[.07] bg-black/15 px-4 py-3.5">
                      <p className="text-sm font-medium text-white/78">{item.label}</p>
                      <p className="mt-1 text-xs leading-5 text-white/38">{item.detail}</p>
                    </div>
                  ))}
                </div>

                {section.action && <a href={section.action.href} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-cyan-200 transition hover:text-white">{section.action.label}</a>}
              </article>
            );
          })}
        </section>

        <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[.025] p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold"><Mail className="h-4 w-4 text-cyan-300" /> Próximas configurações</div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/42">Com empresa, usuários, integrações e notificações estruturados, a próxima evolução pode concentrar modelos de documentos e automações externas adicionais, além da integração financeira quando o C6 responder.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-white/35"><span className="rounded-full border border-white/10 px-3 py-2">Documentos</span><span className="rounded-full border border-white/10 px-3 py-2">C6 API</span><span className="rounded-full border border-white/10 px-3 py-2">Automações</span></div>
          </div>
        </section>
      </div>
    </main>
  );
}
