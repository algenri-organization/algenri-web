"use client";

import { ArrowRight, Bot, Braces, Cpu, Monitor, WandSparkles, Workflow } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const solutionCards = [
  { icon: Monitor, title: "Websites e presença digital", text: "Sites institucionais e páginas de alta conversão para fortalecer sua marca e gerar oportunidades.", image: "/solution-web.webp.jpeg" },
  { icon: Bot, title: "Inteligência artificial", text: "IA aplicada ao seu negócio para automatizar tarefas, analisar dados e apoiar decisões estratégicas.", image: "/solution-ai.webp.jpeg" },
  { icon: Workflow, title: "Automações inteligentes", text: "Processos mais simples, rápidos e eficientes, com automações sob medida para a sua rotina.", image: "/solution-automation.webp.jpeg" },
  { icon: Braces, title: "Sistemas personalizados", text: "Plataformas desenvolvidas para a realidade da sua empresa, com foco em resultados e evolução.", image: "/solution-systems.webp.jpeg" },
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
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.56, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="min-h-screen overflow-hidden">
      <section className="relative isolate overflow-hidden border-b border-white/[0.06] bg-[#040c17]">
        <motion.img
          src="/hero-art.webp.jpeg"
          alt="Representação artística de inteligência, conexão e evolução digital"
          className="pointer-events-none absolute inset-0 hidden h-full w-full object-cover object-[64%_center] lg:block"
          initial={reduceMotion ? false : { opacity: 0, scale: 1.015 }}
          animate={reduceMotion ? undefined : { opacity: 1, scale: [1, 1.012, 1] }}
          transition={{ opacity: { duration: .8 }, scale: { duration: 18, repeat: Infinity, ease: "easeInOut" } }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#040c17_0%,#040c17_30%,rgba(4,12,23,.90)_41%,rgba(4,12,23,.34)_58%,rgba(4,12,23,.06)_78%,rgba(4,12,23,.02)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#040c17] via-[#040c17]/20 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-6 pb-5 pt-[76px] lg:px-8 lg:pb-6 lg:pt-[78px]">
          <div className="grid min-h-[450px] items-start lg:grid-cols-[.9fr_1.1fr]">
            <div className="relative z-10 max-w-2xl pt-4 lg:pt-5">
              <Reveal>
                <div className="mb-5 flex items-center gap-4 text-[11px] font-medium uppercase tracking-[.30em] text-cyan-300 sm:text-xs">
                  <span>Tecnologia que impulsiona o seu amanhã</span>
                  <span className="hidden h-px w-16 bg-cyan-300/70 sm:block" />
                </div>

                <h1 className="max-w-2xl text-5xl font-semibold leading-[.95] tracking-[-0.06em] sm:text-6xl lg:text-[5.15rem]">
                  Da ideia<br />ao <span className="gradient-text">próximo nível.</span>
                </h1>

                <p className="mt-6 max-w-xl text-lg leading-8 text-white/72">
                  Soluções digitais, inteligência artificial, automações e sistemas personalizados para transformar o seu negócio em resultados reais.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <a href="/diagnostico" className="button-primary px-6 py-3.5">Solicitar diagnóstico <ArrowRight className="h-4 w-4" /></a>
                  <a href="/solucoes" className="button-secondary px-6 py-3.5">Conhecer soluções</a>
                </div>
              </Reveal>
            </div>

            <div className="relative min-h-[310px] lg:min-h-[450px]">
              <motion.img
                src="/hero-art.webp.jpeg"
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover object-[72%_center] lg:hidden"
                initial={reduceMotion ? false : { opacity: 0, scale: 1.01 }}
                animate={reduceMotion ? undefined : { opacity: 1, scale: [1, 1.01, 1] }}
                transition={{ opacity: { duration: .7 }, scale: { duration: 18, repeat: Infinity, ease: "easeInOut" } }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#040c17] via-[#040c17]/10 to-transparent lg:hidden" />
              <div className="absolute right-1 top-8 hidden max-w-[150px] text-[11px] uppercase leading-6 tracking-[.20em] text-white/58 xl:block">
                Pessoas<br />Ideias<br />Tecnologia<br />Evolução
                <div className="mt-5 h-px w-9 bg-cyan-300" />
              </div>
              <div className="absolute bottom-10 right-1 hidden max-w-[165px] text-[11px] uppercase leading-6 tracking-[.20em] text-white/50 xl:block">
                Soluções para pessoas e empresas que querem ir além.
                <div className="mt-5 h-px w-9 bg-cyan-300" />
              </div>
            </div>
          </div>

          <div className="relative z-20 mt-3 overflow-hidden rounded-[24px] border border-cyan-300/20 bg-[#0a1b31]/90 shadow-[0_24px_80px_rgba(0,0,0,.38)] backdrop-blur-2xl lg:mt-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4">
              {capabilities.map(({ icon: Icon, label }, index) => (
                <div key={label} className={`flex min-h-[80px] items-center gap-4 px-6 py-4 ${index ? "border-t border-white/[0.07] sm:border-l sm:border-t-0" : ""} ${index === 2 ? "sm:border-l-0 sm:border-t lg:border-l lg:border-t-0" : ""}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/18 bg-cyan-300/[0.04]">
                    <Icon className="h-5 w-5 text-cyan-300" />
                  </div>
                  <span className="text-sm font-medium leading-5 text-white/82">{label}</span>
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
            <p className="max-w-md text-base leading-7 text-white/58">Unimos estratégia, design, tecnologia e inteligência artificial para desenvolver soluções que geram eficiência, crescimento e novas oportunidades.</p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {solutionCards.map(({ icon: Icon, title, text, image }, index) => (
            <Reveal key={title} delay={index * .05}>
              <motion.article whileHover={reduceMotion ? undefined : { y: -6 }} className="group relative min-h-[360px] overflow-hidden rounded-[24px] border border-white/10 bg-[#07111f] shadow-[0_20px_60px_rgba(0,0,0,.18)]">
                <div aria-hidden className="absolute inset-0 scale-[1.02] bg-cover bg-center transition duration-700 group-hover:scale-[1.07]" style={{ backgroundImage: `url('${image}')` }} />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,12,23,.30)_0%,rgba(4,12,23,.58)_42%,rgba(4,12,23,.96)_78%,#040c17_100%)]" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#040c17]/30 via-transparent to-transparent" />
                <div className="relative flex h-full min-h-[360px] flex-col justify-end p-6">
                  <div className="mb-auto flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-300/20 bg-[#06111f]/70 backdrop-blur-xl"><Icon className="h-6 w-6 text-cyan-300" /></div>
                  <h3 className="text-xl font-semibold tracking-[-.02em]">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/66">{text}</p>
                  <a href="/solucoes" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition hover:text-white">Saiba mais <ArrowRight className="h-4 w-4" /></a>
                </div>
              </motion.article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28">
          <Reveal><span className="eyebrow">Modelo ALGENRI</span><h2 className="section-title mt-4">Diagnosticar. Criar. Evoluir.</h2></Reveal>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {[["01", "Diagnosticar", "Entendemos o negócio, a presença atual e onde a tecnologia pode gerar resultado."],["02", "Criar", "Construímos a solução com design, tecnologia, testes e acompanhamento claro."],["03", "Evoluir", "Mantemos, medimos e incorporamos novas soluções conforme a empresa cresce."]].map(([number, title, text], index) => (
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
