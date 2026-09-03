"use client";

import {
  ArrowRight,
  Bot,
  Braces,
  CheckCircle2,
  Film,
  Gauge,
  Globe2,
  Sparkles,
  WandSparkles,
  Workflow,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const solutions = [
  {
    icon: Globe2,
    title: "Web",
    text: "Sites, landing pages, lojas e experiências digitais com domínio próprio e alta qualidade visual.",
  },
  {
    icon: Bot,
    title: "IA",
    text: "Agentes, atendimento inteligente e aplicações de inteligência artificial conectadas ao negócio.",
  },
  {
    icon: Workflow,
    title: "Automação",
    text: "Fluxos que reduzem trabalho manual, conectam ferramentas e aceleram atendimento, vendas e operação.",
  },
  {
    icon: Braces,
    title: "Sistemas",
    text: "Portais, dashboards e aplicações sob medida para processos que hoje vivem em planilhas e mensagens.",
  },
  {
    icon: Film,
    title: "Creative AI",
    text: "Vídeos, avatares, imagens e conteúdo com IA para comunicação, treinamento e marketing empresarial.",
  },
];

const process = [
  ["01", "Diagnosticar", "Entendemos o negócio, a presença atual e onde a tecnologia pode gerar resultado."],
  ["02", "Criar", "Construímos a solução com design, tecnologia e clareza para o cliente acompanhar."],
  ["03", "Evoluir", "Mantemos, medimos e incorporamos novas automações, conteúdos e sistemas conforme a empresa cresce."],
];

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="min-h-screen overflow-hidden">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#07111f]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <a href="#inicio" className="font-semibold tracking-[0.18em]">ALGENRI</a>
          <nav className="hidden items-center gap-7 text-sm text-white/70 md:flex">
            <a href="#solucoes" className="transition hover:text-white">Soluções</a>
            <a href="#processo" className="transition hover:text-white">Como funciona</a>
            <a href="#diagnostico" className="transition hover:text-white">Diagnóstico</a>
          </nav>
          <a
            href="#diagnostico"
            className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/15"
          >
            Solicitar diagnóstico
          </a>
        </div>
      </header>

      <section id="inicio" className="relative flex min-h-[92vh] items-center pt-24">
        <div className="hero-grid pointer-events-none absolute inset-0" />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-[8%] top-[18%] h-72 w-72 rounded-full bg-blue-500/25 blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, 45, 0], y: [0, 28, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute right-[8%] top-[20%] h-80 w-80 rounded-full bg-violet-500/20 blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, -35, 0], y: [0, 36, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
          <div className="flex flex-col justify-center">
            <Reveal>
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur-xl">
                <Sparkles className="h-4 w-4" />
                Soluções digitais, IA e automação
              </div>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[1.03] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Transformamos ideias em <span className="gradient-text">experiências digitais</span> que fazem negócios avançarem.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/65">
                Sites, inteligência artificial, automações, vídeos e sistemas criados para colocar sua empresa no digital, profissionalizar a operação e preparar o próximo passo.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href="#diagnostico" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-slate-950 transition hover:-translate-y-0.5">
                  Solicitar diagnóstico <ArrowRight className="h-4 w-4" />
                </a>
                <a href="#solucoes" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 font-medium text-white transition hover:bg-white/10">
                  Conhecer soluções
                </a>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <div className="glass relative min-h-[470px] overflow-hidden rounded-[32px] p-5 sm:p-7">
              <div className="absolute inset-x-12 top-0 h-32 bg-gradient-to-r from-blue-500/30 via-cyan-400/20 to-violet-500/30 blur-3xl" />
              <div className="relative flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">Digital control room</p>
                  <p className="mt-1 font-medium">Sua operação, conectada.</p>
                </div>
                <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-200">online</div>
              </div>

              <div className="relative mt-5 grid gap-4 sm:grid-cols-2">
                <motion.div whileHover={reduceMotion ? undefined : { y: -5 }} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <Bot className="h-5 w-5 text-sky-300" />
                  <p className="mt-5 text-sm text-white/45">Atendimento IA</p>
                  <p className="mt-1 text-2xl font-semibold">24/7</p>
                  <p className="mt-3 text-sm leading-6 text-white/55">Leads respondidos, qualificados e direcionados automaticamente.</p>
                </motion.div>
                <motion.div whileHover={reduceMotion ? undefined : { y: -5 }} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <Gauge className="h-5 w-5 text-violet-300" />
                  <p className="mt-5 text-sm text-white/45">Presença digital</p>
                  <p className="mt-1 text-2xl font-semibold">Evolução contínua</p>
                  <p className="mt-3 text-sm leading-6 text-white/55">Site, conteúdo, dados e automações trabalhando como um ecossistema.</p>
                </motion.div>
              </div>

              <div className="relative mt-4 rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-white/45">Fluxo automatizado</p>
                    <p className="mt-1 font-medium">Lead → diagnóstico → proposta → acompanhamento</p>
                  </div>
                  <Workflow className="h-6 w-6 text-cyan-300" />
                </div>
                <div className="mt-5 flex gap-2">
                  {[72, 46, 88, 61, 94, 78].map((height, index) => (
                    <motion.div
                      key={index}
                      className="w-full rounded-full bg-gradient-to-t from-blue-500/45 to-cyan-300/80"
                      style={{ height }}
                      initial={reduceMotion ? false : { scaleY: 0 }}
                      whileInView={reduceMotion ? undefined : { scaleY: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + index * 0.06 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="solucoes" className="mx-auto max-w-7xl px-6 py-28 lg:px-8">
        <Reveal>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-300">Soluções</p>
          <div className="mt-4 flex max-w-4xl flex-col gap-5">
            <h2 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Um parceiro para a evolução digital da empresa.</h2>
            <p className="max-w-2xl text-lg leading-8 text-white/60">Começamos pelo que o negócio precisa hoje e construímos uma base que pode evoluir para automação, IA e software.</p>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {solutions.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delay={index * 0.06}>
                <motion.article whileHover={reduceMotion ? undefined : { y: -7, scale: 1.01 }} className="glass h-full rounded-[28px] p-6 transition-shadow hover:shadow-2xl">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/8">
                    <Icon className="h-5 w-5 text-sky-200" />
                  </div>
                  <h3 className="mt-7 text-2xl font-semibold">{item.title}</h3>
                  <p className="mt-3 leading-7 text-white/58">{item.text}</p>
                </motion.article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section id="processo" className="border-y border-white/8 bg-white/[0.025]">
        <div className="mx-auto max-w-7xl px-6 py-28 lg:px-8">
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-violet-300">Como trabalhamos</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Diagnosticar. Criar. Evoluir.</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {process.map(([number, title, text], index) => (
              <Reveal key={number} delay={index * 0.08}>
                <div className="rounded-[28px] border border-white/10 bg-black/15 p-7">
                  <span className="text-sm text-white/35">{number}</span>
                  <h3 className="mt-8 text-2xl font-semibold">{title}</h3>
                  <p className="mt-3 leading-7 text-white/58">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="diagnostico" className="mx-auto max-w-7xl px-6 py-28 lg:px-8">
        <Reveal>
          <div className="glass relative overflow-hidden rounded-[36px] p-8 sm:p-12 lg:p-16">
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_.75fr]">
              <div>
                <div className="inline-flex items-center gap-2 text-sm font-medium text-cyan-200"><WandSparkles className="h-4 w-4" /> Diagnóstico Digital ALGENRI</div>
                <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Descubra onde sua empresa pode evoluir no digital.</h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-white/60">Vamos avaliar presença, atendimento, automação, tecnologia e oportunidades. Esta é a base da futura ferramenta automática de diagnóstico da ALGENRI.</p>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-black/20 p-6">
                {["Presença digital", "Atendimento", "Automação", "Tecnologia"].map((label, index) => (
                  <div key={label} className="mb-5 last:mb-0">
                    <div className="flex items-center justify-between text-sm"><span className="text-white/65">{label}</span><CheckCircle2 className="h-4 w-4 text-emerald-300" /></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300" style={{ width: `${58 + index * 9}%` }} /></div>
                  </div>
                ))}
                <button className="mt-7 w-full rounded-full bg-white px-5 py-3 font-semibold text-slate-950 transition hover:-translate-y-0.5">Quero meu diagnóstico</button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>ALGENRI — Soluções Digitais & IA</span>
          <span>algenri.com.br</span>
        </div>
      </footer>
    </main>
  );
}
