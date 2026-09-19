"use client";

import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UsersRound,
  Workflow,
} from "lucide-react";
import { useEffect, useState } from "react";

type ConfirmationState = "success" | "error";

const modules = [
  {
    icon: UsersRound,
    title: "Pacientes+",
    text: "Mais liberdade para ampliar sua carteira e acompanhar sua base de pacientes.",
  },
  {
    icon: CircleDollarSign,
    title: "Financeiro+",
    text: "Indicadores, projeções e uma visão financeira mais completa da sua prática.",
  },
  {
    icon: ClipboardList,
    title: "Clínico+",
    text: "Plano terapêutico, objetivos e acompanhamento clínico em uma experiência ampliada.",
  },
  {
    icon: Workflow,
    title: "Gestão+",
    text: "Recursos para documentos, modelos, automações e organização da operação.",
  },
  {
    icon: BrainCircuit,
    title: "IA+",
    text: "Inteligência aplicada para apoiar tarefas profissionais e ganhar produtividade.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp+",
    text: "Uma estrutura integrada para comunicação organizada com seus pacientes.",
  },
];

const steps = [
  {
    number: "01",
    title: "Abra o Psico ALGENRI",
    text: "Retorne ao aplicativo no seu celular.",
  },
  {
    number: "02",
    title: "Faça seu login",
    text: "Use o mesmo e-mail e senha que você cadastrou.",
  },
  {
    number: "03",
    title: "Comece sua experiência",
    text: "Configure sua rotina e conheça os recursos disponíveis.",
  },
];

function getConfirmationError() {
  if (typeof window === "undefined") return null;

  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return (
    query.get("error") ||
    query.get("error_code") ||
    hash.get("error") ||
    hash.get("error_code")
  );
}

export default function EmailConfirmedClient() {
  const [state, setState] = useState<ConfirmationState>("success");

  useEffect(() => {
    if (getConfirmationError()) setState("error");
  }, []);

  if (state === "error") {
    return (
      <main className="page-shell min-h-screen overflow-hidden">
        <section className="mx-auto flex min-h-[72vh] max-w-5xl items-center px-6 py-20 lg:px-8">
          <div className="glass relative w-full overflow-hidden rounded-[36px] p-8 text-center sm:p-12 lg:p-16">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
            <div className="relative">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/[.06]">
                <TriangleAlert className="h-8 w-8 text-amber-200" />
              </div>
              <span className="eyebrow mt-7 justify-center">Psico ALGENRI</span>
              <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-[-.045em] sm:text-5xl">
                Não foi possível confirmar seu e-mail
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/58 sm:text-lg">
                O link pode ter expirado ou já ter sido utilizado. Volte ao app e solicite um novo e-mail de confirmação.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a href="psicoalgenri://sign-in" className="button-primary">
                  Voltar ao app <ArrowRight className="h-4 w-4" />
                </a>
                <a href="mailto:suporte@algenri.com.br?subject=Ajuda%20com%20confirma%C3%A7%C3%A3o%20de%20e-mail%20-%20Psico%20ALGENRI" className="button-secondary">
                  Falar com suporte
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell min-h-screen overflow-hidden">
      <section className="relative overflow-hidden border-b border-white/[0.06] bg-[#03101d]">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-55" />
        <div className="pointer-events-none absolute -right-24 top-8 h-[440px] w-[440px] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center lg:px-8 lg:py-24">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] border border-emerald-300/20 bg-emerald-300/[.06] shadow-[0_22px_80px_rgba(0,229,255,.08)]">
            <CheckCircle2 className="h-10 w-10 text-emerald-300" />
          </div>

          <span className="eyebrow mt-8 justify-center">
            <Sparkles className="h-4 w-4" /> Psico ALGENRI
          </span>

          <h1 className="mx-auto mt-5 max-w-4xl text-5xl font-semibold leading-[.98] tracking-[-.055em] sm:text-6xl lg:text-[70px]">
            E-mail confirmado <span className="gradient-text">com sucesso.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-white/62 sm:text-lg">
            Seu cadastro está confirmado. Agora volte ao Psico ALGENRI e faça login para começar a usar sua plataforma.
          </p>

          <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-white/42 sm:text-base">
            Organize pacientes, agenda, finanças e rotinas clínicas em um só lugar, com recursos inteligentes para apoiar sua prática profissional.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href="psicoalgenri://sign-in" className="button-primary">
              Voltar ao app <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#algenri-plus" className="button-secondary">
              Conhecer o ALGENRI+
            </a>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/42">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-300" /> Conta confirmada
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-cyan-300" /> Sua rotina em um só lugar
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="text-center">
          <span className="eyebrow justify-center">Próximo passo</span>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
            Sua conta está pronta. Agora é só começar.
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.number} className="glass rounded-[28px] p-7">
              <span className="text-sm font-semibold tracking-[.16em] text-cyan-300/80">
                {step.number}
              </span>
              <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 leading-7 text-white/52">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="algenri-plus" className="mx-auto max-w-7xl px-6 pb-20 lg:px-8 lg:pb-24">
        <div className="relative overflow-hidden rounded-[36px] border border-cyan-300/15 bg-[#071f34] p-8 sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative">
            <span className="eyebrow">Evolua no seu ritmo</span>
            <h2 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-.045em] sm:text-5xl">
              Leve sua experiência para outro nível com o <span className="gradient-text">ALGENRI+</span>
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/55 sm:text-lg">
              Ative módulos avançados conforme sua necessidade e amplie os recursos da plataforma junto com sua prática profissional.
            </p>

            <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {modules.map(({ icon: Icon, title, text }) => (
                <article key={title} className="glass-soft rounded-[24px] p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[.04]">
                    <Icon className="h-5 w-5 text-cyan-300" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">{text}</p>
                </article>
              ))}
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="/psico-algenri#planos" className="button-primary">
                Conhecer planos e recursos <ArrowRight className="h-4 w-4" />
              </a>
              <a href="mailto:suporte@algenri.com.br?subject=Psico%20ALGENRI" className="button-secondary">
                Falar com a ALGENRI
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
