import type { Metadata } from "next";
import { ArrowRight, CalendarDays, Check, ClipboardList, CreditCard, FileText, HeartPulse, LockKeyhole, ShieldCheck, Sparkles, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Psico ALGENRI | Gestão clínica simples para psicólogos",
  description: "Conheça o Psico ALGENRI: pacientes, anamnese, agenda, prontuário, tarefas e financeiro em um único app para psicólogos.",
};

const features = [
  { icon: Users, title: "Pacientes", text: "Cadastro e acompanhamento dos pacientes em uma visão organizada e direta." },
  { icon: ClipboardList, title: "Anamnese", text: "Registre informações iniciais e mantenha o histórico clínico acessível durante o acompanhamento." },
  { icon: CalendarDays, title: "Agenda", text: "Organize atendimentos, horários e a continuidade das sessões em um só lugar." },
  { icon: FileText, title: "Sessões e prontuário", text: "Registre sessões, salve rascunhos e acompanhe o histórico de cada paciente." },
  { icon: HeartPulse, title: "Tarefas e exercícios", text: "Crie atividades para acompanhamento terapêutico e utilize uma biblioteca de exercícios." },
  { icon: CreditCard, title: "Financeiro", text: "Controle lançamentos, valores a receber, recebidos e vencidos de forma simples." },
];

const included = ["Até 20 pacientes", "+17 vagas em relação ao plano gratuito", "Pagamento único", "Sem mensalidade", "Capacidade vinculada à conta", "Programa de indicação para ampliar capacidade"];

export default function PsicoAlgenriPage() {
  return (
    <main className="page-shell min-h-screen overflow-hidden">
      <section className="relative mx-auto max-w-7xl px-6 pb-20 pt-28 lg:px-8 lg:pt-36">
        <div className="pointer-events-none absolute -right-20 top-10 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-48 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative grid gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <span className="eyebrow"><Sparkles className="h-4 w-4" /> Produto ALGENRI</span>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.01] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Seu consultório mais organizado. <span className="gradient-text">Sua rotina mais leve.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/62">
              O Psico ALGENRI reúne pacientes, anamnese, agenda, sessões, tarefas e financeiro em uma experiência criada para psicólogos que querem simplicidade sem perder organização.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#planos" className="button-primary">Conhecer o Essencial <ArrowRight className="h-4 w-4" /></a>
              <a href="mailto:suporte@algenri.com.br?subject=Psico%20ALGENRI" className="button-secondary">Falar com a ALGENRI</a>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/48">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-300" /> Dados protegidos</span>
              <span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-cyan-300" /> Acesso por conta individual</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-cyan-300" /> Versão gratuita disponível</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[430px]">
            <div className="absolute inset-6 rounded-[44px] bg-cyan-400/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[42px] border border-cyan-300/20 bg-[#07192b] p-3 shadow-[0_30px_100px_rgba(0,0,0,.45)]">
              <div className="rounded-[34px] border border-white/8 bg-[#06111f] p-5">
                <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[.18em] text-cyan-300">Psico ALGENRI</p><h2 className="mt-1 text-2xl font-semibold">Olá, Psicólogo(a)</h2></div><div className="h-11 w-11 rounded-full border border-cyan-300/20 bg-cyan-300/10" /></div>
                <div className="mt-6 rounded-[24px] border border-cyan-300/15 bg-[#0a2740] p-5"><p className="text-xs text-white/40">PRÓXIMO ATENDIMENTO</p><p className="mt-2 text-lg font-semibold">14:00 • Atendimento agendado</p><p className="mt-1 text-sm text-white/45">Agenda organizada e integrada ao histórico.</p></div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {["Pacientes", "Agenda", "Sessões", "Financeiro"].map((item, index) => <div key={item} className="rounded-2xl border border-white/8 bg-white/[.035] p-4"><span className="text-xs text-cyan-200/60">0{index + 1}</span><p className="mt-5 font-medium">{item}</p></div>)}
                </div>
                <div className="mt-4 rounded-2xl border border-violet-300/15 bg-violet-400/[.06] p-4"><p className="text-xs uppercase tracking-[.16em] text-violet-200">Essencial</p><p className="mt-2 text-xl font-semibold">3 → 20 pacientes</p><p className="mt-1 text-sm text-white/45">R$ 14,90 • pagamento único • sem mensalidade</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <span className="eyebrow">Tudo em um só lugar</span>
          <h2 className="section-title mt-4 max-w-4xl">Menos ferramentas soltas. Mais continuidade no atendimento.</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <article key={title} className="glass rounded-[28px] p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[.04]"><Icon className="h-5 w-5 text-cyan-300" /></div>
                <h3 className="mt-6 text-xl font-semibold">{title}</h3>
                <p className="mt-3 leading-7 text-white/55">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[32px] border border-white/10 bg-white/[.025] p-8 sm:p-10">
            <span className="text-xs font-medium uppercase tracking-[.18em] text-white/35">Comece sem custo</span>
            <h2 className="mt-4 text-3xl font-semibold">Psico ALGENRI Free</h2>
            <p className="mt-4 leading-7 text-white/55">Use o fluxo principal do app e acompanhe até 3 pacientes antes de decidir ampliar sua capacidade.</p>
            <div className="mt-8 text-4xl font-semibold">R$ 0</div>
            <p className="mt-2 text-sm text-white/38">até 3 pacientes</p>
          </div>

          <div className="relative overflow-hidden rounded-[32px] border border-cyan-300/25 bg-[#08263d] p-8 shadow-[0_28px_90px_rgba(0,190,255,.10)] sm:p-10">
            <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-cyan-300/15 blur-3xl" />
            <div className="relative">
              <span className="text-xs font-medium uppercase tracking-[.18em] text-cyan-200">Psico ALGENRI Essencial</span>
              <h2 className="mt-4 text-3xl font-semibold">Amplie de 3 para 20 pacientes</h2>
              <p className="mt-4 leading-7 text-white/62">Mais capacidade para continuar usando o mesmo fluxo clínico conforme sua carteira de pacientes cresce.</p>
              <div className="mt-7 flex items-baseline gap-3"><span className="text-4xl font-semibold">R$ 14,90</span><span className="text-sm text-white/45">pagamento único</span></div>
              <p className="mt-2 text-sm text-cyan-100/70">Sem mensalidade.</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {included.map((item) => <div key={item} className="flex items-start gap-2 text-sm text-white/65"><Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" /><span>{item}</span></div>)}
              </div>
            </div>
          </div>
        </div>
        <p className="mt-6 text-sm leading-6 text-white/35">O Psico ALGENRI está em preparação para lançamento nas lojas de aplicativos. A disponibilidade e as condições finais podem variar conforme a loja e a região.</p>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-28 lg:px-8">
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
