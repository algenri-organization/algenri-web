"use client";

import {
  ArrowRight,
  Bot,
  Braces,
  Film,
  Gauge,
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

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.62, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="page-shell min-h-screen overflow-hidden">
      <section className="relative flex min-h-[88vh] items-center">
        <div className="hero-grid pointer-events-none absolute inset-0" />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-[7%] top-[16%] h-72 w-72 rounded-full bg-blue-500/25 blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, 42, 0], y: [0, 24, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute right-[6%] top-[18%] h-80 w-80 rounded-full bg-violet-500/20 blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, -32, 0], y: [0, 34, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
          <div className="flex flex-col justify-center">
            <Reveal>
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur-xl">
                <Sparkles className="h-4 w-4" /> Tecnologia que acompanha o crescimento da empresa
              </div>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
                Sua empresa mais <span className="gradient-text">digital, inteligente e eficiente.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/62">
                A ALGENRI une presença digital, inteligência artificial, automação e software para transformar necessidades reais em soluções simples de usar e prontas para evoluir.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href="/diagnostico" className="button-primary">Solicitar diagnóstico <ArrowRight className="h-4 w-4" /></a>
                <a href="/solucoes" className="button-secondary">Conhecer soluções</a>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <div className="glass relative min-h-[470px] overflow-hidden rounded-[34px] p-5 sm:p-7">
              <div className="absolute inset-x-12 top-0 h-32 bg-gradient-to-r from-blue-500/30 via-cyan-400/20 to-violet-500/30 blur-3xl" />
              <div className="relative flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">ALGENRI control room</p>
                  <p className="mt-1 font-medium">Sua operação digital, conectada.</p>
                </div>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">online</span>
              </div>
              <div className="relative mt-5 grid gap-4 sm:grid-cols-2">
                <motion.div whileHover={reduceMotion ? undefined : { y: -5 }} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <Bot className="h-5 w-5 text-sky-300" />
                  <p className="mt-5 text-sm text-white/45">Atendimento inteligente</p>
                  <p className="mt-1 text-2xl font-semibold">24/7</p>
                  <p className="mt-3 text-sm leading-6 text-white/55">Leads atendidos, qualificados e encaminhados automaticamente.</p>
                </motion.div>
                <motion.div whileHover={reduceMotion ? undefined : { y: -5 }} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <Gauge className="h-5 w-5 text-violet-300" />
                  <p className="mt-5 text-sm text-white/45">Evolução digital</p>
                  <p className="mt-1 text-2xl font-semibold">Contínua</p>
                  <p className="mt-3 text-sm leading-6 text-white/55">Site, dados, conteúdo e automações trabalhando como um ecossistema.</p>
                </motion.div>
              </div>
              <div className="relative mt-4 rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div><p className="text-sm text-white/45">Fluxo automatizado</p><p className="mt-1 font-medium">Lead → diagnóstico → proposta → acompanhamento</p></div>
                  <Workflow className="h-6 w-6 text-cyan-300" />
                </div>
                <div className="mt-5 flex items-end gap-2">
                  {[72, 46, 88, 61, 94, 78].map((height, index) => (
                    <motion.div key={index} className="w-full rounded-full bg-gradient-to-t from-blue-500/45 to-cyan-300/80" style={{ height }} initial={reduceMotion ? false : { scaleY: 0 }} whileInView={reduceMotion ? undefined : { scaleY: 1 }} viewport={{ once: true }} transition={{ delay: .35 + index * .06 }} />
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-28 lg:px-8">
        <Reveal>
          <span className="eyebrow">Soluções</span>
          <h2 className="section-title mt-4">Não vendemos apenas um site. Construímos a próxima etapa digital do negócio.</h2>
          <p className="section-copy mt-6">Podemos começar pequeno e evoluir conforme a necessidade: presença digital, conteúdo, automação, inteligência artificial e sistemas próprios.</p>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {solutions.map(([Icon, title, text], index) => (
            <Reveal key={title as string} delay={index * .05}>
              <motion.article whileHover={reduceMotion ? undefined : { y: -7 }} className="glass h-full rounded-[28px] p-6">
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
        <div className="mx-auto max-w-7xl px-6 py-28 lg:px-8">
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

      <section className="mx-auto max-w-7xl px-6 py-28 lg:px-8">
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
