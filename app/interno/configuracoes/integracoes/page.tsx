import { BadgeCheck, Banknote, Cloud, Database, GitBranch, Mail, MessageCircle, PlugZap, ShieldCheck, Webhook } from "lucide-react";
import { getBankingStatus } from "@/lib/finance/banking";
import { listWhatsAppWebhookEvents } from "@/lib/whatsapp/webhook-log";

export const metadata = {
  title: "Integrações | ALGENRI",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type IntegrationStatus = "operational" | "pending" | "deferred";

type IntegrationCard = {
  title: string;
  category: string;
  status: IntegrationStatus;
  statusLabel: string;
  detail: string;
  icon: typeof Cloud;
  items: string[];
};

const statusClass: Record<IntegrationStatus, string> = {
  operational: "border-emerald-300/15 bg-emerald-300/[.06] text-emerald-100",
  pending: "border-amber-300/15 bg-amber-300/[.06] text-amber-100",
  deferred: "border-white/10 bg-white/[.04] text-white/50",
};

const eventClass: Record<string, string> = {
  delivered: "border-emerald-300/15 bg-emerald-300/[.05] text-emerald-100",
  read: "border-cyan-300/15 bg-cyan-300/[.05] text-cyan-100",
  sent: "border-blue-300/15 bg-blue-300/[.05] text-blue-100",
  failed: "border-red-300/15 bg-red-300/[.05] text-red-100",
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium", timeZone: "America/Sao_Paulo" }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function IntegracoesPage() {
  const banking = getBankingStatus();
  const c6 = banking.find((provider) => provider.provider === "c6");
  const cora = banking.find((provider) => provider.provider === "cora");
  const webhookEvents = await listWhatsAppWebhookEvents(25).catch(() => []);

  const integrations: IntegrationCard[] = [
    { title: "Vercel", category: "Aplicação e deploy", status: "operational", statusLabel: "Operacional", detail: "Hospedagem e pipeline de deploy da aplicação ALGENRI.", icon: Cloud, items: ["Deploy integrado ao GitHub", "Ambientes de preview e produção", "Domínio da aplicação configurado"] },
    { title: "Firebase", category: "Dados e autenticação", status: "operational", statusLabel: "Operacional", detail: "Base da autenticação interna, Firestore e armazenamento de arquivos da plataforma.", icon: Database, items: ["Firebase Authentication", "Firestore", "Storage via backend autenticado"] },
    { title: "GitHub", category: "Código e governança", status: "operational", statusLabel: "Operacional", detail: "Repositório, branches, pull requests e validação contínua do projeto.", icon: GitBranch, items: ["Repositório principal conectado", "Fluxo por pull request", "CI antes de merge"] },
    { title: "Google Workspace", category: "Comunicação", status: "operational", statusLabel: "Operacional", detail: "E-mail corporativo da ALGENRI validado para envio e recebimento.", icon: Mail, items: ["contato@algenri.com.br", "SPF, DKIM e DMARC validados", "Canal comercial ativo"] },
    { title: "WhatsApp / Meta", category: "Comunicação", status: "pending", statusLabel: "Diagnóstico em andamento", detail: "Envio de templates já é aceito pela Meta; o retorno assíncrono de status está em validação via webhook.", icon: MessageCircle, items: ["Template aprovado e envio aceito pela Meta", "Webhook verificado e campo messages assinado", "Aguardando confirmação de eventos reais de entrega"] },
    { title: "C6 Bank", category: "Financeiro", status: "pending", statusLabel: "Aguardando banco", detail: c6?.detail ?? "Integração solicitada; API, homologação e credenciais ainda precisam ser confirmadas pelo banco.", icon: Banknote, items: ["Controle financeiro permanece manual", "Nenhuma credencial C6 é presumida", "Integração real só após retorno oficial"] },
    { title: "Cora", category: "Financeiro", status: "deferred", statusLabel: "Adiada", detail: cora?.detail ?? "Alternativa futura, sem ativação nesta fase.", icon: Banknote, items: ["Sem custo adicional nesta fase", "Não participa do fluxo atual", "Pode ser retomada futuramente"] },
  ];

  const operational = integrations.filter((item) => item.status === "operational").length;
  const pending = integrations.filter((item) => item.status === "pending").length;

  return (
    <main className="min-h-screen bg-[#040c17] px-5 pb-20 pt-28 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="border-b border-white/10 pb-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.25em] text-cyan-300"><PlugZap className="h-4 w-4" /> Configurações</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Central de integrações</h1>
          <p className="mt-3 max-w-3xl leading-7 text-white/55">Acompanhe o que já sustenta a operação, o que ainda depende de terceiros e o que foi conscientemente adiado.</p>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[.04] p-5"><BadgeCheck className="h-5 w-5 text-emerald-200"/><p className="mt-3 text-2xl font-semibold">{operational}</p><p className="mt-1 text-sm text-white/45">Integrações operacionais</p></div>
          <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.04] p-5"><PlugZap className="h-5 w-5 text-amber-200"/><p className="mt-3 text-2xl font-semibold">{pending}</p><p className="mt-1 text-sm text-white/45">Dependências pendentes</p></div>
          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[.04] p-5"><ShieldCheck className="h-5 w-5 text-cyan-200"/><p className="mt-3 text-lg font-semibold">Sem segredos na interface</p><p className="mt-1 text-sm text-white/45">Credenciais e chaves não são exibidas nem solicitadas nesta área.</p></div>
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          {integrations.map((integration) => {
            const Icon = integration.icon;
            return <article key={integration.title} className="rounded-[28px] border border-white/10 bg-white/[.025] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[.04]"><Icon className="h-5 w-5 text-cyan-200"/></div><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/30">{integration.category}</p><h2 className="mt-1 text-lg font-semibold">{integration.title}</h2></div></div>
                <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[.12em] ${statusClass[integration.status]}`}>{integration.statusLabel}</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/48">{integration.detail}</p>
              <div className="mt-5 space-y-2">{integration.items.map((item) => <div key={item} className="rounded-xl border border-white/[.07] bg-black/15 px-3.5 py-3 text-xs leading-5 text-white/42">{item}</div>)}</div>
            </article>;
          })}
        </section>

        <section className="mt-6 rounded-[28px] border border-cyan-300/15 bg-cyan-300/[.025] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-cyan-300"><Webhook className="h-4 w-4" /> WhatsApp / Meta</div>
              <h2 className="mt-2 text-xl font-semibold">Eventos recebidos pelo webhook</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">Registro técnico dos últimos eventos enviados pela Meta. Um evento sem correspondência pode ser apenas um teste com ID fictício.</p>
            </div>
            <div className="text-xs text-white/35">Últimos {webhookEvents.length} eventos</div>
          </div>

          <div className="mt-5 space-y-3">
            {webhookEvents.length === 0 ? (
              <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[.04] p-5 text-sm text-amber-100">Nenhum evento registrado ainda. Após o deploy, envie novamente um teste pelo campo <strong>messages</strong> da Meta e atualize esta página.</div>
            ) : webhookEvents.map((event) => (
              <article key={event.id} className="rounded-2xl border border-white/[.08] bg-black/15 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-[10px] uppercase tracking-[.12em] text-white/55">{event.eventKind}</span>
                  {event.status && <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[.12em] ${eventClass[event.status] ?? "border-white/10 bg-white/[.04] text-white/55"}`}>{event.status}</span>}
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[.12em] ${event.matchedLead ? "border-emerald-300/15 bg-emerald-300/[.05] text-emerald-100" : "border-amber-300/15 bg-amber-300/[.05] text-amber-100"}`}>{event.matchedLead ? "lead localizado" : "sem correspondência"}</span>
                  <span className="ml-auto text-[11px] text-white/30">{formatDate(event.receivedAt)}</span>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-white/45 md:grid-cols-2">
                  <div><span className="text-white/25">Campo:</span> {event.field}</div>
                  <div><span className="text-white/25">Número Meta:</span> {event.displayPhoneNumber || "—"}</div>
                  <div className="md:col-span-2 break-all"><span className="text-white/25">Message ID:</span> {event.messageId || "—"}</div>
                  {event.error && <div className="md:col-span-2 rounded-xl border border-red-300/15 bg-red-300/[.04] p-3 text-red-100/80"><span className="font-medium">Erro:</span> {event.error}</div>}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[.025] p-5 sm:p-6">
          <h2 className="font-semibold">Regra operacional</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-white/45">Esta tela registra o estado real das integrações. Um provedor só deve passar para “Operacional” depois de credenciais, homologação, conectividade e fluxo real terem sido confirmados. Isso evita que preparação técnica seja confundida com integração ativa.</p>
        </section>
      </div>
    </main>
  );
}
