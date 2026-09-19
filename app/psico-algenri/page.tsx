import type { Metadata } from "next";
import {
  ArrowRight,
  BadgePercent,
  BrainCircuit,
  CalendarDays,
  Check,
  CircleDollarSign,
  ClipboardList,
  HeartPulse,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Psico ALGENRI | Gestão clínica simples para psicólogos",
  description:
    "Conheça o Psico ALGENRI: pacientes, anamnese, agenda, prontuário, tarefas, financeiro e módulos ALGENRI+ em um único app para psicólogos.",
};

const benefits = [
  { icon: ClipboardList, title: "Gestão clínica", text: "Prontuário, evolução e histórico organizados em um só lugar." },
  { icon: HeartPulse, title: "Acompanhamento terapêutico", text: "Mais continuidade entre sessões, tarefas e evolução dos pacientes." },
  { icon: CalendarDays, title: "Organização da rotina", text: "Agenda, pacientes e tarefas para simplificar o dia a dia profissional." },
  { icon: ShieldCheck, title: "Segurança dos dados", text: "Acesso individual e estrutura preparada para proteger informações sensíveis." },
];

const essentialIncluded = [
  "Até 20 pacientes",
  "+17 vagas em relação ao plano gratuito",
  "Pagamento único",
  "Sem mensalidade",
  "Capacidade vinculada à conta",
  "Programa de indicação para ampliar capacidade",
];

const plusModules = [
  {
    icon: BrainCircuit,
    title: "IA+",
    price: "R$ 24,90/mês",
    text: "IA clínica assistiva para apoiar atividades, plano terapêutico, relatórios e transcrição.",
    bullets: ["75 operações de IA por mês", "300 minutos de transcrição por mês", "Uso controlado por cota mensal"],
  },
  {
    icon: MessageCircle,
    title: "WhatsApp+",
    price: "R$ 19,90/mês",
    text: "Comunicação integrada com lembretes, confirmações, cobranças e automações.",
    bullets: ["200 mensagens por mês", "Lembretes e confirmações", "Preferências e automações de envio"],
  },
  {
    icon: ClipboardList,
    title: "Clínico+",
    price: "R$ 14,90/mês",
    text: "Recursos clínicos avançados para acompanhamento terapêutico estruturado e longitudinal.",
    bullets: ["Plano terapêutico estruturado", "Objetivos e metas", "Escalas, medições e acompanhamento longitudinal"],
  },
  {
    icon: CircleDollarSign,
    title: "Financeiro+",
    price: "R$ 12,90/mês",
    text: "Uma camada adicional de inteligência para acompanhar a saúde financeira da prática.",
    bullets: ["Indicadores financeiros", "Inadimplência e projeções", "Relatórios e automações financeiras"],
  },
  {
    icon: Workflow,
    title: "Gestão+",
    price: "R$ 12,90/mês",
    text: "Mais organização administrativa com recursos pensados para a rotina profissional.",
    bullets: ["Documentos e modelos", "Integrações e relatórios administrativos", "Automações e armazenamento ampliado"],
  },
  {
    icon: UsersRound,
    title: "Pacientes+",
    price: "R$ 9,90/mês",
    text: "Capacidade ampliada para quem precisa crescer além dos limites tradicionais do app.",
    bullets: ["Pacientes ilimitados enquanto a assinatura estiver ativa", "Integrado aos demais recursos do app", "Ideal para carteiras em expansão"],
  },
];

const plusPricing = [
  { label: "1 ou 2 módulos", detail: "Preço individual de cada módulo" },
  { label: "3 módulos", detail: "10% de desconto sobre o subtotal" },
  { label: "4 ou 5 módulos", detail: "20% de desconto sobre o subtotal" },
  { label: "ALGENRI+ Completo", detail: "Todos os 6 módulos por R$ 59,90/mês" },
];

export default function PsicoAlgenriPage() {
  return (
    <main className="page-shell min-h-screen overflow-hidden">
      <section className="relative z-0 overflow-hidden border-b border-white/[0.06] bg-[#03101d]">
        <img
          src="/psico-algenri/hero-background.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 hidden h-full w-[56%] object-cover object-center opacity-50 lg:block"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,16,29,.30)_0%,rgba(3,16,29,.60)_34%,#03101d_65%,#03101d_100%)]" />
        <div className="pointer-events-none absolute -right-24 top-8 h-[460px] w-[460px] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-36 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-[1380px] px-6 pb-8 pt-5 lg:px-8 lg:pb-8 lg:pt-5">
          <div className="grid gap-5 lg:grid-cols-[.78fr_1.22fr] lg:items-start">
            <div className="lg:pt-0">
              <span className="eyebrow"><Sparkles className="h-4 w-4" /> Produto ALGENRI</span>
              <h1 className="mt-3 max-w-3xl text-5xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl lg:text-[68px]">
                Psico <span className="gradient-text">ALGENRI</span>
              </h1>
              <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">
                Tecnologia que acolhe, <span className="text-cyan-300">relações que transformam.</span>
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/62 sm:text-lg sm:leading-8">
                Um app criado para psicólogos organizarem pacientes, agenda, sessões, tarefas e financeiro sem transformar a rotina clínica em uma sequência de ferramentas soltas.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a href="#recursos" className="button-primary">Conheça o app <ArrowRight className="h-4 w-4" /></a>
                <a href="#planos" className="button-secondary">Conheça os planos <ArrowRight className="h-4 w-4" /></a>
              </div>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2.5 text-sm text-white/48">
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-300" /> Dados protegidos</span>
                <span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-cyan-300" /> Acesso individual</span>
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-cyan-300" /> Versão gratuita</span>
              </div>
            </div>

            <div className="relative mx-auto min-h-[590px] w-full max-w-[850px] lg:-mt-5">
              <div className="absolute left-0 top-[2%] z-20 w-[55%] rotate-[-2deg] overflow-hidden rounded-[42px] border border-cyan-300/20 bg-[#06111f] p-1.5 shadow-[0_28px_90px_rgba(0,0,0,.48)]">
                <img src="/psico-algenri/tela-entrada.png" alt="Tela inicial do Psico ALGENRI" className="block h-auto w-full rounded-[35px]" />
              </div>

              <div className="absolute right-[-1%] top-[-2%] z-10 w-[60%] rotate-[2deg] overflow-hidden rounded-[42px] border border-cyan-300/18 bg-[#06111f] p-1.5 shadow-[0_28px_90px_rgba(0,0,0,.48)]">
                <img src="/psico-algenri/dashboard.png" alt="Dashboard do Psico ALGENRI" className="block h-auto w-full rounded-[35px]" />
              </div>

              <div className="pointer-events-none absolute bottom-1 left-1/2 h-24 w-[76%] -translate-x-1/2 rounded-full bg-cyan-300/12 blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-16">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {benefits.map(({ icon: Icon, title, text }) => (
            <article key={title} className="glass rounded-[28px] p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[.04]"><Icon className="h-5 w-5 text-cyan-300" /></div>
              <h3 className="mt-6 text-xl font-semibold">{title}</h3>
              <p className="mt-3 leading-7 text-white/55">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-7xl px-6 pb-16 lg:px-8 lg:pb-20">
        <div className="mb-8 max-w-4xl">
          <span className="eyebrow"><BadgePercent className="h-4 w-4" /> Planos e expansão</span>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">Comece simples e evolua quando precisar.</h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/55">
            O Psico ALGENRI combina uma base acessível com opções de expansão. Você pode ampliar a capacidade com o Essencial ou montar sua experiência com os módulos ALGENRI+.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[36px] border border-cyan-300/20 bg-[#071f34] p-8 shadow-[0_28px_90px_rgba(0,190,255,.08)] sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/12 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/[.05] px-3 py-1 text-xs font-medium uppercase tracking-[.16em] text-cyan-200">Psico ALGENRI Essencial</span>
              <h3 className="mt-5 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">De 3 para 20 pacientes.</h3>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/58">Amplie a capacidade do app quando sua carteira crescer, mantendo o mesmo fluxo clínico.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {essentialIncluded.map((item) => <div key={item} className="flex items-start gap-2 text-sm text-white/68"><Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" /><span>{item}</span></div>)}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/20 p-7 text-center sm:p-8">
              <p className="text-xs font-medium uppercase tracking-[.18em] text-white/35">Pagamento único</p>
              <div className="mt-4 text-5xl font-semibold">R$ 14,90</div>
              <p className="mt-3 text-sm leading-6 text-white/50">Sem mensalidade. Capacidade vinculada à sua conta.</p>
              <a href="mailto:suporte@algenri.com.br?subject=Psico%20ALGENRI%20Essencial" className="button-primary mt-7 w-full justify-center">Ativar Essencial <ArrowRight className="h-4 w-4" /></a>
              <p className="mt-4 text-xs leading-5 text-white/32">A compra dentro do aplicativo será disponibilizada no lançamento nas lojas.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="algenri-plus" className="mx-auto max-w-7xl px-6 pb-20 lg:px-8 lg:pb-24">
        <div className="relative overflow-hidden rounded-[40px] border border-violet-300/15 bg-[linear-gradient(145deg,rgba(12,30,54,.96),rgba(21,18,49,.92))] p-8 shadow-[0_32px_100px_rgba(76,29,149,.10)] sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet-500/14 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />

          <div className="relative">
            <div className="max-w-4xl">
              <span className="inline-flex rounded-full border border-violet-300/25 bg-violet-300/[.06] px-3 py-1 text-xs font-medium uppercase tracking-[.16em] text-violet-200">ALGENRI+</span>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-.045em] sm:text-5xl">
                Monte o Psico ALGENRI do seu jeito.
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-white/58">
                Escolha apenas os módulos que fazem sentido para sua rotina ou ative o pacote completo. Quanto mais módulos você combina, maior o benefício no preço.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {plusModules.map(({ icon: Icon, title, price, text, bullets }) => (
                <article key={title} className="glass relative overflow-hidden rounded-[28px] p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[.04]">
                      <Icon className="h-5 w-5 text-cyan-300" />
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs font-medium text-white/70">{price}</span>
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold">{title}</h3>
                  <p className="mt-3 min-h-[84px] leading-7 text-white/55">{text}</p>
                  <div className="mt-5 space-y-3">
                    {bullets.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm leading-6 text-white/68">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-cyan-300" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_.82fr]">
              <div className="glass-soft rounded-[30px] p-7 sm:p-8">
                <span className="eyebrow">Combinações inteligentes</span>
                <h3 className="mt-4 text-3xl font-semibold tracking-[-.035em]">Mais módulos, mais vantagem.</h3>
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  {plusPricing.map((item) => (
                    <div key={item.label} className="rounded-[22px] border border-white/8 bg-black/10 p-5">
                      <p className="font-semibold text-white">{item.label}</p>
                      <p className="mt-2 text-sm leading-6 text-white/50">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[30px] border border-cyan-300/20 bg-cyan-300/[.055] p-7 sm:p-8">
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-300/12 blur-3xl" />
                <div className="relative">
                  <span className="text-xs font-medium uppercase tracking-[.18em] text-cyan-200">ALGENRI+ Completo</span>
                  <div className="mt-4 text-5xl font-semibold">R$ 59,90<span className="text-lg font-normal text-white/45">/mês</span></div>
                  <p className="mt-4 text-base leading-7 text-white/58">Todos os 6 módulos em uma única assinatura para quem quer a experiência mais completa.</p>
                  <div className="mt-6 space-y-3">
                    {["IA+", "WhatsApp+", "Clínico+", "Financeiro+", "Gestão+", "Pacientes+"].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-white/70">
                        <Check className="h-4 w-4 text-cyan-300" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <a href="mailto:suporte@algenri.com.br?subject=Psico%20ALGENRI%20Plus" className="button-primary mt-7 w-full justify-center">
                    Quero conhecer o ALGENRI+ <ArrowRight className="h-4 w-4" />
                  </a>
                  <p className="mt-4 text-xs leading-5 text-white/35">A contratação dos módulos ALGENRI+ será liberada no app conforme o lançamento comercial.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-[26px] border border-white/8 bg-black/10 p-6">
              <p className="text-sm leading-7 text-white/48">
                Os módulos IA+ e WhatsApp+ possuem franquias mensais incluídas. Atualmente, IA+ inclui 75 operações de IA e 300 minutos de transcrição por mês; WhatsApp+ inclui 200 mensagens por mês. Os limites e condições podem ser atualizados conforme a evolução comercial do produto.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="glass rounded-[34px] p-8 sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div><span className="eyebrow">Privacidade desde o início</span><h2 className="mt-4 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Informações claras para profissionais e usuários.</h2><p className="mt-4 max-w-3xl leading-7 text-white/55">Consulte como o Psico ALGENRI trata dados, os termos de uso e o procedimento para solicitar exclusão da conta.</p></div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a className="button-secondary justify-center" href="/psico-algenri/privacidade">Política de Privacidade</a>
              <a className="button-secondary justify-center" href="/psico-algenri/termos">Termos de Uso</a>
              <a className="button-secondary justify-center" href="/psico-algenri/excluir-conta">Excluir conta</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
