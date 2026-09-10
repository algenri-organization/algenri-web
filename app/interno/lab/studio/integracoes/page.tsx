import { Cable, CheckCircle2, CircleDashed, Layers3, ShieldCheck } from "lucide-react";
import { providerLayerLabels, studioProviders, type StudioProviderLayer } from "@/lib/studio/providers";

const layerOrder: StudioProviderLayer[] = ["generation", "avatar-voice", "composition", "design-finish", "gateway", "intelligence"];

export default function StudioIntegrationsPage() {
  return <main className="min-h-screen bg-[#040c17] px-6 pb-20 pt-28 text-white">
    <div className="mx-auto max-w-6xl">
      <div className="border-b border-white/10 pb-7">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-cyan-200"><Cable className="h-4 w-4"/> ALGENRI Studio · Integrações</div>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Provedores, APIs e motores criativos</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">Catálogo técnico do Studio. Cada plataforma entra em uma camada específica para que geração, avatar, montagem, acabamento e inteligência não fiquem misturados em um único fornecedor.</p>
      </div>

      <section className="mt-7 rounded-[26px] border border-emerald-300/15 bg-emerald-300/[.025] p-5">
        <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-200"/><div><h2 className="font-semibold">Integração segura por padrão</h2><p className="mt-2 text-sm leading-6 text-white/45">Segredos e chaves de API serão mantidos somente no servidor por variáveis de ambiente. A interface nunca deve expor credenciais. Antes de cada geração paga, o Studio deverá estimar custo quando o provedor permitir.</p></div></div>
      </section>

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

      <section className="mt-8 rounded-[28px] border border-cyan-300/15 bg-cyan-300/[.025] p-6">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-cyan-200">Ordem de integração</p>
        <h2 className="mt-2 text-xl font-semibold">Primeiro conectar, depois sofisticar</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-white/45">A primeira conexão real deve provar o ciclo completo: autenticar → estimar → gerar um preview ou clipe curto → acompanhar o job → receber o resultado → registrar custo. Depois replicamos o mesmo contrato para os demais provedores.</p>
      </section>
    </div>
  </main>;
}
