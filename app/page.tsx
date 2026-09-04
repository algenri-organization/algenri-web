"use client";

import {
  ArrowRight,
  Bot,
  Braces,
  Film,
  Globe2,
  Sparkles,
  WandSparkles,
  Workflow,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const solutions = [
  [Globe2, "Sites & E-commerce", "Presença digital profissional, rápida e preparada para converter."],
  [Bot, "IA para negócios", "Atendimento, agentes e aplicações inteligentes conectadas à rotina da empresa."],
  [Workflow, "Automação", "Fluxos que reduzem tarefas manuais e integram atendimento, vendas e operação."],
  [Braces, "Sistemas sob medida", "Portais, dashboards e aplicações para processos que já pedem uma solução própria."],
  [Film, "Creative AI", "Vídeos, avatares, imagens e conteúdo com IA para comunicação e marketing."],
];

const capabilities = ["Websites profissionais", "Inteligência artificial", "Automações inteligentes", "Sistemas personalizados"];

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
      <section className="relative border-b border-white/[0.06]">
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-55" />
        <div className="pointer-events-none absolute left-[10%] top-0 h-64 w-64 rounded-full bg-blue-500/18 blur-3xl" />
        <div className="pointer-events-none absolute right-[8%] top-10 h-72 w-72 rounded-full bg-violet-500/16 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 pb-14 pt-10 lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:px-8 lg:pb-16 lg:pt-14">
          <div className="flex flex-col justify-center">
            <Reveal>
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.05] px-4 py-2 text-sm text-white/72 backdrop-blur-xl">
                <Sparkles className="h-4 w-4 text-cyan-200" /> Soluções digitais, IA e automação
              </div>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[1.01] tracking-[-0.055em] sm:text-6xl lg:text-[4.65rem]">
                Sua empresa mais <span className="gradient-text">digital, inteligente e eficiente.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/62">
                A ALGENRI transforma necessidades reais em presença digital, automação, inteligência artificial e software — com soluções simples de usar e prontas para evoluir.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="/diagnostico" className="button-primary">Solicitar diagnóstico <ArrowRight className="h-4 w-4" /></a>
                <a href="/solucoes" className="button-secondary">Conhecer soluções</a>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.12}>
            <div className="glass relative min-h-[500px] overflow-hidden rounded-[34px] border-cyan-300/10 sm:min-h-[540px]">
              <motion.img
                src="/hero-intelligence.svg"
                alt="Representação artística de inteligência, conexão e evolução digital"
                className="absolute inset-0 h-full w-full object-cover object-center"
                initial={reduceMotion ? false : { opacity: 0, scale: 1.025 }}
                animate={reduceMotion ? undefined : { opacity: 1, scale: [1.005, 1.025, 1.005] }}
                transition={{ opacity: { duration: .75 }, scale: { duration: 14, repeat: Infinity, ease: "easeInOut" } }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07111f]/90 via-transparent to-[#07111f]/10" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#07111f]/18 via-transparent to-transparent" />

              <div className="absolute left-6 top-6 rounded-full border border-cyan-300/15 bg-[#07111f]/64 px-3 py-1.5 text-[11px] uppercase tracking-[.18em] text-cyan-100/80 backdrop-blur-xl">
                Inteligência conectada ao negócio
              </div>

              <div className="absolute inset-x-6 bottom-6 rounded-[24px] border border-white/10 bg-[#07111f]/76 p-5 backdrop-blur-2xl sm:p-6">
                <div className="flex items-end justify-between gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-[.18em] text-white/38">ALGENRI</p>
                    <p className="mt-2 max-w-md text-2xl font-semibold tracking-[-.03em] sm:text-3xl">Tecnologia que impulsiona o seu amanhã.</p>
                    <p className="mt-3 text-sm text-white/48">Pessoas · Ideias · Tecnologia · Evolução</p>
                  </div>
                  <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-white/[0.04] sm:flex">
                    <img src="/algenri-mark.svg" alt="" aria-hidden className="h-11 w-11" />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pb-10 lg:px-8 lg:pb-12">
          <div className="grid overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.025] sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((item, index) => (
              <div key={item} className={`px-5 py-4 text-sm text-white/58 ${index > 0 ? "border-t border-white/[0.07] sm:border-t-0 sm:border-l" : ""} ${index > 1 ? "sm:border-t lg:border-t-0" : ""}`}>
                <span className="mr-2 text-cyan-200/70">0{index + 1}</span>{item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28">
        <Reveal>
          <span className="eyebrow">Soluções</span>
          <h2 className="section-title mt-4">Não vendemos apenas um site. Construímos a próxima etapa digital do negócio.</h2>
          <p className="section-copy mt-6">Podemos começar pequeno e evoluir conforme a necessidade: presença digital, conteúdo, automação, inteligência artificial e sistemas próprios.</p>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {solutions.map(([Icon, title, text], index) => (
            <Reveal key={title as string} delay={index * .05}>
              <motion.article whileHover={reduceMotion ? undefined : { y: -6 }} className="glass h-full rounded-[28px] p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/8"><Icon className="h-5 w-5 text-sky-200" /></div>
                <h3 className="mt-7 text-2xl font-semibold">{title as string}</h3>
                <p className="mt-3 leading-7 text-white/58">{text as string}</p>
              </motion.article>
            </Reveal>
          ))}
          <Reveal delay={.25}>
            <a href="/solucoes" className="glass-soft flex h-full min-h-60 flex-col justify-between rounded-[28px] p-6 transition hover:bg-white/[0.07]">
              <Sparkles className="h-5 w-5 text-violet-200" />
              <div><p className="text-sm uppercase tracking-[.16em] text-white/35">Explore</p><h3 className="mt-3 text-2xl font-semibold">Veja todas as soluções <ArrowRight className="ml-1 inline h-5 w-5" /></h3></div>
            </a>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-white/8 bg-white/[0.025]">
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
