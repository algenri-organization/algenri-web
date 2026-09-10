import { Cable, CheckCircle2, CircleDashed, Coins, KeyRound, Layers3, Route, ShieldCheck } from "lucide-react";
import { providerLayerLabels, studioProviders, type StudioProviderLayer } from "@/lib/studio/providers";
import { getRunwayIntegrationStatus } from "@/lib/studio/runway";
import { getKieCreditBalance, getKieIntegrationStatus } from "@/lib/studio/kie";
import RunwayDryRunTester from "@/components/studio/runway-dry-run-tester";

const layerOrder: StudioProviderLayer[] = ["generation", "avatar-voice", "composition", "design-finish", "gateway", "intelligence"];

export default async function StudioIntegrationsPage() {
  const runwayStatus = getRunwayIntegrationStatus();
  const kieStatus = getKieIntegrationStatus();
  let kieCredits: number | null = null;
  let kieCreditCheckOk = false;
  if (kieStatus.configured) {
    try {
      kieCredits = await getKieCreditBalance();
      kieCreditCheckOk = true;
    } catch {
      kieCreditCheckOk = false;
    }
  }

  return <main className="min-h-screen bg-[#040c17] px-6 pb-20 pt-28 text-white">
    <div className="mx-auto max-w-6xl">
      <div className="border-b border-white/10 pb-7">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-cyan-200"><Cable className="h-4 w-4"/> ALGENRI Studio · Integrações</div>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Provedores, APIs e motores criativos</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">Catálogo técnico do Studio. Cada plataforma entra em uma camada específica para que geração, avatar, montagem, acabamento e inteligência não fiquem misturados em um único fornecedor.</p>
      </div>

      <section className="mt-7 rounded-[26px] border border-emerald-300/15 bg-emerald-300/[.025] p-5">
        <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-200"/><div><h2 className="font-semibold">Integração segura por padrão</h2><p className="mt-2 text-sm leading-6 text-white/45">Segredos e chaves de API são mantidos somente no servidor por variáveis de ambiente. A interface nunca expõe credenciais e nenhuma geração é disparada apenas por abrir esta página.</p></div></div>
      </section>

      <section className={`mt-5 rounded-[26px] border p-5 ${runwayStatus.configured ? "border-cyan-300/20 bg-cyan-300/[.03]" : "border-amber-300/20 bg-amber-300/[.025]"}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-3"><KeyRound className={`mt-0.5 h-5 w-5 shrink-0 ${runwayStatus.configured ? "text-cyan-200" : "text-amber-100"}`}/><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-white/40">Integração ativa</p><h2 className="mt-1 font-semibold">Runway Dev API</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">O adaptador server-side cobre autenticação, geração, consulta de job e Model Router em dry run, permitindo validar escolha automática e custo antes do gasto.</p></div></div>
          <span className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] ${runwayStatus.configured ? "border-emerald-300/20 bg-emerald-300/[.06] text-emerald-200" : "border-amber-300/20 bg-amber-300/[.06] text-amber-100"}`}>{runwayStatus.configured ? "credencial configurada" : "aguardando API secret"}</span>
        </div>
        <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 md:grid-cols-4"><div><p className="text-[10px] uppercase tracking-[.12em] text-white/25">API secret</p><p className="mt-1 text-xs text-white/55">{runwayStatus.environmentVariable}</p></div><div><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Model Router</p><p className="mt-1 text-xs text-white/55">{runwayStatus.routerEnvironmentVariable}</p></div><div><p className="text-[10px] uppercase tracking-[.12em] text-white/25">API version</p><p className="mt-1 text-xs text-white/55">{runwayStatus.apiVersion}</p></div><div><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Execução</p><p className="mt-1 text-xs text-white/55">Somente server-side</p></div></div>
      </section>

      <section className={`mt-5 rounded-[26px] border p-5 ${kieStatus.configured && kieCreditCheckOk ? "border-emerald-300/20 bg-emerald-300/[.025]" : "border-violet-300/15 bg-violet-300/[.02]"}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-3"><Coins className={`mt-0.5 h-5 w-5 shrink-0 ${kieStatus.configured ? "text-emerald-200" : "text-violet-200"}`}/><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-white/40">Gateway multimodelo</p><h2 className="mt-1 font-semibold">Kie.ai</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">A base do adapter já está pronta para consultar saldo e criar jobs na API unificada. O Studio poderá usar o gateway para testar modelos de menor custo ou créditos disponíveis antes de recorrer a opções premium.</p></div></div>
          <span className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] ${kieStatus.configured && kieCreditCheckOk ? "border-emerald-300/20 bg-emerald-300/[.06] text-emerald-200" : kieStatus.configured ? "border-amber-300/20 bg-amber-300/[.06] text-amber-100" : "border-violet-300/20 bg-violet-300/[.06] text-violet-100"}`}>{kieStatus.configured ? kieCreditCheckOk ? "conexão validada" : "credencial configurada · validar" : "aguardando API key"}</span>
        </div>
        <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 md:grid-cols-4"><div><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Variável</p><p className="mt-1 text-xs text-white/55">{kieStatus.environmentVariable}</p></div><div><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Saldo</p><p className="mt-1 text-xs text-white/55">{kieCreditCheckOk ? `${kieCredits ?? 0} créditos` : kieStatus.configured ? "não foi possível consultar" : "—"}</p></div><div><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Jobs</p><p className="mt-1 text-xs text-white/55">API unificada</p></div><div><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Estratégia</p><p className="mt-1 text-xs text-white/55">créditos disponíveis → menor custo → premium</p></div></div>
      </section>

      <section className={`mt-5 rounded-[26px] border p-5 ${runwayStatus.readyForDryRun ? "border-violet-300/20 bg-violet-300/[.025]" : "border-white/10 bg-white/[.015]"}`}>
        <div className="flex gap-3"><Route className={`mt-0.5 h-5 w-5 shrink-0 ${runwayStatus.readyForDryRun ? "text-violet-200" : "text-white/30"}`}/><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-white/35">Modo Automático · Runway</p><h2 className="mt-1 font-semibold">Dry run sem geração</h2><p className="mt-2 max-w-4xl text-sm leading-6 text-white/45">Com o API secret e um Model Router configurados, o Studio consulta qual motor seria escolhido e o custo estimado sem gerar mídia.</p><p className="mt-3 text-xs text-white/35">Status: {runwayStatus.readyForDryRun ? "pronto para teste" : runwayStatus.configured ? "falta configurar RUNWAY_MODEL_ROUTER_ID" : "falta configurar RUNWAYML_API_SECRET e RUNWAY_MODEL_ROUTER_ID"}</p></div></div>
      </section>

      {runwayStatus.readyForDryRun && <RunwayDryRunTester />}

      <div className="mt-8 space-y-8">
        {layerOrder.map(layer => {
          const providers = studioProviders.filter(provider => provider.layer === layer);
          if (!providers.length) return null;
          return <section key={layer}>
            <div className="flex items-center gap-2"><Layers3 className="h-4 w-4 text-violet-200"/><h2 className="text-lg font-semibold">{providerLayerLabels[layer]}</h2></div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {providers.map(provider => <article key={provider.id} className="rounded-[24px] border border-white/10 bg-white/[.02] p-5">
                <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{provider.name}</h3><p className="mt-1 text-[10px] uppercase tracking-[.14em] text-white/30">{provider.integrationMode}</p></div><span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[.1em] ${provider.status === "priority" ? "border-cyan-300/15 bg-cyan-300/[.05] text-cyan-200" : "border-white/10 text-white/30"}`}>{provider.status === "priority" ? <CheckCircle2 className="h-3 w-3"/> : <CircleDashed className="h-3 w-3"/>}{provider.status}</span></div>
                <p className="mt-4 text-xs leading-5 text-white/45">{provider.role}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">{provider.capabilities.map(capability => <span key={capability} className="rounded-full border border-white/10 bg-white/[.025] px-2.5 py-1 text-[10px] text-white/40">{capability}</span>)}</div>
                <div className="mt-4 border-t border-white/10 pt-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/25">Controle de custo</p><p className="mt-2 text-xs leading-5 text-white/40">{provider.costControl}</p></div>
              </article>)}
            </div>
          </section>;
        })}
      </div>

      <section className="mt-8 rounded-[28px] border border-cyan-300/15 bg-cyan-300/[.025] p-6"><p className="text-xs font-semibold uppercase tracking-[.16em] text-cyan-200">Estratégia multimotor</p><h2 className="mt-2 text-xl font-semibold">Validar barato antes de renderizar caro</h2><p className="mt-2 max-w-4xl text-sm leading-6 text-white/45">Runway permanece como motor validado. Kie.ai entra como gateway de cobertura e economia; depois conectamos HeyGen, Higgsfield e Remotion. Plataformas sem API estável podem permanecer como opções assistidas, sem quebrar o fluxo automatizado do Studio.</p></section>
    </div>
  </main>;
}
