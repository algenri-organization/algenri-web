import type { Metadata } from "next";
import { ArrowRight, CalendarDays, Check, ClipboardList, HeartPulse, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Psico ALGENRI | Gestão clínica simples para psicólogos",
  description: "Conheça o Psico ALGENRI: pacientes, anamnese, agenda, prontuário, tarefas e financeiro em um único app para psicólogos.",
};

const benefits = [
  { icon: ClipboardList, title: "Gestão clínica", text: "Prontuário, evolução e histórico organizados em um só lugar." },
  { icon: HeartPulse, title: "Acompanhamento terapêutico", text: "Mais continuidade entre sessões, tarefas e evolução dos pacientes." },
  { icon: CalendarDays, title: "Organização da rotina", text: "Agenda, pacientes e tarefas para simplificar o dia a dia profissional." },
  { icon: ShieldCheck, title: "Segurança dos dados", text: "Acesso individual e estrutura preparada para proteger informações sensíveis." },
];

const included = ["Até 20 pacientes", "+17 vagas em relação ao plano gratuito", "Pagamento único", "Sem mensalidade", "Capacidade vinculada à conta", "Programa de indicação para ampliar capacidade"];

export default function PsicoAlgenriPage() {
  return (
    <main className="page-shell min-h-screen overflow-hidden">
      <section className="relative overflow-hidden border-b border-white/[0.06] bg-[#03101d]">
        <img
          src="/psico-algenri/hero-background.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 hidden h-full w-[58%] object-cover object-center opacity-55 lg:block"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(3,16,29,.24)_0%,rgba(3,16,29,.58)_34%,#03101d_66%,#03101d_100%)]" />
        <div className="pointer-events-none absolute -right-24 top-16 h-[520px] w-[520px] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 top-56 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-28 lg:px-8 lg:pb-24 lg:pt-36">
          <div className="grid gap-14 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <span className="eyebrow"><Sparkles className="h-4 w-4" /> Produto ALGENRI</span>
              <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                Psico <span className="gradient-text">ALGENRI</span>
              </h1>
              <h2 className="mt-6 max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">
                Tecnologia que acolhe, <span className="text-cyan-300">relações que transformam.</span>
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/62">
                Um app criado para psicólogos organizarem pacientes, agenda, sessões, tarefas e financeiro sem transformar a rotina clínica em uma sequência de ferramentas soltas.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#recursos" className="button-primary">Conheça o app <ArrowRight className="h-4 w-4" /></a>
                <a href="#planos" className="button-secondary">Ativar Essencial <ArrowRight className="h-4 w-4" /></a>
              </div>

              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/48">
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-300" /> Dados protegidos</span>
                <span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-cyan-300" /> Acesso individual</span>
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-cyan-300" /> Versão gratuita</span>
              </div>
            </div>

            <div className="relative mx-auto min-h-[590px] w-full max-w-[680px]">
              <div className="absolute left-[5%] top-[7%] z-20 w-[46%] rotate-[-2deg] overflow-hidden rounded-[42px] border border-cyan-300/25 bg-[#06111f] p-2 shadow-[0_30px_100px_rgba(0,0,0,.5)]">
                <img src="/psico-algenri/tela-entrada.png" alt="Tela inicial do Psico ALGENRI" className="block h-auto w-full rounded-[34px]" />
              </div>

              <div className="absolute right-[1%] top-[1%] z-10 w-[51%] rotate-[3deg] overflow-hidden rounded-[42px] border border-cyan-300/20 bg-[#06111f] p-2 shadow-[0_30px_100px_rgba(0,0,0,.5)]">
                <img src="/psico-algenri/dashboard.png" alt="Dashboard do Psico ALGENRI" className="block h-auto w-full rounded-[34px]" />
              </div>

              <div className="pointer-events-none absolute bottom-8 left-1/2 h-28 w-[70%] -translate-x-1/2 rounded-full bg-cyan-300/12 blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
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

      <section id="planos" className="mx-auto max-w-7xl px-6 pb-24 lg:px-8 lg:pb-28">
        <div className="relative overflow-hidden rounded-[36px] border border-cyan-300/20 bg-[#071f34] p-8 shadow-[0_28px_90px_rgba(0,190,255,.08)] sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/12 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/[.05] px-3 py-1 text-xs font-medium uppercase tracking-[.16em] text-cyan-200">Psico ALGENRI Essencial</span>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">De 3 para 20 pacientes.</h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/58">Amplie a capacidade do app quando sua carteira crescer, mantendo o mesmo fluxo clínico.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {included.map((item) => <div key={item} className="flex items-start gap-2 text-sm text-white/68"><Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" /><span>{item}</span></div>)}
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
