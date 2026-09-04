"use client";

import {
  ArrowRight,
  Bot,
  Braces,
  Cpu,
  Film,
  Globe2,
  Monitor,
  Sparkles,
  WandSparkles,
  Workflow,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const solutionCards = [
  {
    icon: Monitor,
    title: "Websites e presença digital",
    text: "Sites institucionais e páginas de alta conversão para fortalecer sua marca e gerar oportunidades.",
  },
  {
    icon: Bot,
    title: "Inteligência artificial",
    text: "IA aplicada ao seu negócio para automatizar tarefas, analisar dados e apoiar decisões estratégicas.",
  },
  {
    icon: Workflow,
    title: "Automações inteligentes",
    text: "Processos mais simples, rápidos e eficientes, com automações sob medida para a sua rotina.",
  },
  {
    icon: Braces,
    title: "Sistemas personalizados",
    text: "Plataformas desenvolvidas para a realidade da sua empresa, com foco em resultados e evolução.",
  },
];

const capabilities = [
  { icon: Monitor, label: "Websites profissionais" },
  { icon: Cpu, label: "Inteligência artificial" },
  { icon: Workflow, label: "Automações inteligentes" },
  { icon: Braces, label: "Sistemas personalizados" },
];

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.58, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="page-shell min-h-screen overflow-hidden">
      <section className="relative isolate overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-[#06111f]" />
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-30" />
        <motion.img
          src="/hero-intelligence.svg"
          alt="Representação artística de inteligência, conexão e evolução digital"
          className="pointer-events-none absolute right-[-7%] top-[-2%] hidden h-[96%] w-[72%] object-contain object-right-top lg:block"
          initial={reduceMotion ? false : { opacity: 0, scale: 1.02 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: [1, 1.015, 1] }}
          transition={{ opacity: { duration: .8 }, scale: { duration: 16, repeat: Infinity, ease: "easeInOut" } }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#06111f_0%,#06111f_39%,rgba(6,17,31,.88)_49%,rgba(6,17,31,.25)_67%,rgba(6,17,31,.08)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#06111f] via-[#06111f]/65 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-6 pb-8 pt-12 lg:px-8 lg:pb-10 lg:pt-16">
          <div className="grid min-h-[560px] items-center lg:grid-cols-[.92fr_1.08fr]">
            <div className="relative z-10 max-w-2xl pb-16 pt-6 lg:pb-24 lg:pt-10">
              <Reveal>
                <div className="mb-6 flex items-center gap-4 text-[11px] font-medium uppercase tracking-[.30em] text-cyan-300 sm:text-xs">
                  <span>Tecnologia que impulsiona o seu amanhã</span>
                  <span className="hidden h-px w-16 bg-cyan-300/70 sm:block" />
                </div>

                <h1 className="max-w-2xl text-5xl font-semibold leading-[.96] tracking-[-0.06em] sm:text-6xl lg:text-[5rem]">
                  Da ideia<br />ao <span className="gradient-text">próximo nível.</span>
                </h1>

                <p className="mt-7 max-w-xl text-lg leading-8 text-white/68">
                  Soluções digitais, inteligência artificial, automações e sistemas personalizados para transformar o seu negócio em resultados reais.
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <a href="/diagnostico" className="button-primary px-6 py-3.5">Solicitar diagnóstico <ArrowRight className="h-4 w-4" /></a>
                  <a href="/solucoes" className="button-secondary px-6 py-3.5">Conhecer soluções</a>
                </div>
              </Reveal>
            </div>

            <div className="relative min-h-[420px] lg:min-h-[560px]">
              <motion.img
                src="/hero-intelligence.svg"
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-contain object-center lg:hidden"
                initial={reduceMotion ? false : { opacity: 0, scale: 1.02 }}
                animate={reduceMotion ? undefined : { opacity: 1, scale: [1, 1.015, 1] }}
                transition={{ opacity: { duration: .8 }, scale: { duration: 16, repeat: Infinity, ease: "easeInOut" } }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06111f] via-transparent to-transparent lg:hidden" />
              <div className="absolute right-1 top-8 hidden max-w-[150px] text-[11px] uppercase leading-6 tracking-[.20em] text-white/55 xl:block">
                Pessoas<br />Ideias<br />Tecnologia<br />Evolução
                <div className="mt-5 h-px w-9 bg-cyan-300" />
              </div>
              <div className="absolute bottom-14 right-1 hidden max-w-[160px] text-[11px] uppercase leading-6 tracking-[.20em] text-white/48 xl:block">
                Soluções para pessoas e empresas que querem ir além.
                <div className="mt-5 h-px w-9 bg-cyan-300" />
              </div>
            </div>
          </div>

          <div className="relative z-20 -mt-10 overflow-hidden rounded-[24px] border border-cyan-300/20 bg-[#0a1b31]/88 shadow-[0_24px_80px_rgba(0,0,0,.35)] backdrop-blur-2xl lg:-mt-14">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4">
              {capabilities.map(({ icon: Icon, label }, index) => (
                <div key={label} className={`flex min-h-[92px] items-center gap-4 px-6 py-5 ${index ? "border-t border-white/[0.07] sm:border-l sm:border-t-0" : ""} ${index === 2 ? "sm:border-l-0 sm:border-t lg:border-l lg:border-t-0" : ""}`}>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/18 bg-cyan-300/[0.04]">
                    <Icon className="h-6 w-6 text-cyan-300" />
                  </div>
                  <span className="text-sm font-medium leading-5 text-white/78">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_.52fr] lg:items-end">
          <Reveal>
            <span className="eyebrow">Como podemos impulsionar o seu negócio</span>
            <h2 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-5xl">
              <span className="text-cyan-300">Soluções completas</span> para cada etapa da sua evolução
            </h2>
          </Reveal>
          <Reveal delay={.08}>
            <p className="max-w-md text-base leading-7 text-white/55">
              Unimos estratégia, design, tecnologia e inteligência artificial para desenvolver soluções que geram eficiência, crescimento e novas oportunidades.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {solutionCards.map(({ icon: Icon, title, text }, index) => (
            <Reveal key={title} delay={index * .05}>
              <motion.article whileHover={reduceMotion ? undefined : { y: -6 }} className="group glass-soft relative h-full overflow-hidden rounded-[24px] p-6">
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-blue-500/12 blur-3xl transition group-hover:bg-cyan-400/14" />
                <Icon className="relative h-7 w-7 text-cyan-300" />
                <h3 className="relative mt-7 text-xl font-semibold tracking-[-.02em]">{title}</h3>
                <p className="relative mt-3 text-sm leading-6 text-white/58">{text}</p>
                <a href="/solucoes" className="relative mt-7 inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition hover:text-white">Saiba mais <ArrowRight className="h-4 w-4" /></a>
              </motion.article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28">
          <Reveal><span className="eyebrow">Modelo ALGENRI</span><h2 className="section-title mt-4">Diagnosticar. Criar. Evoluir.</h2></Reveal>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {[
              ["01", "Diagnosticar", "Entendemos o negócio, a presença atual e onde a tecnologia pode gerar resultado."],
              ["02", "Criar", "Construímos a solução com design, tecnologia, testes e acompanhamento claro."],
              ["03", "Evoluir", "Mantemos, medimos e incorporamos novas soluções conforme a empresa cresce."],
            ].map(([number, title, text], index) => (
              <Reveal key={number} delay={index * .07}><div className="rounded-[28px] border border-white/10 bg-black/15 p-7"><span className="text-sm text-white/35">{number}</span><h3 className="mt-8 text-2xl font-semibold">{title}</h3><p className="mt-3 leading-7 text-white/58">{text}</p></div></Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28">
        <Reveal>
          <div className="glass relative overflow-hidden rounded-[36px] p-8 sm:p-12 lg:p-16">
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_.75fr]">
              <div>
                <div className="inline-flex items-center gap-2 text-sm font-medium text-cyan-200"><WandSparkles className="h-4 w-4" /> Diagnóstico Digital ALGENRI</div>
                <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Antes de vender tecnologia, entendemos o que realmente faz sentido.</h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-white/60">O diagnóstico organiza prioridades e identifica oportunidades em presença digital, atendimento, automação e tecnologia.</p>
                <a href="/diagnostico" className="button-primary mt-8">Iniciar diagnóstico <ArrowRight className="h-4 w-4" /></a>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-6">
                {["Presença digital", "Atendimento", "Automação", "Tecnologia"].map((label, index) => (
                  <div key={label} className="mb-5 last:mb-0"><div className="flex items-center justify-between text-sm"><span className="text-white/65">{label}</span><span className="text-white/35">{58 + index * 9}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300" style={{ width: `${58 + index * 9}%` }} /></div></div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
