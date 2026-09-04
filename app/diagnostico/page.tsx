import type { Metadata } from "next";
import { DigitalDiagnostic } from "@/components/digital-diagnostic";
import { Bot, Globe2, LaptopMinimalCheck, Workflow } from "lucide-react";

export const metadata: Metadata = {
  title: "Diagnóstico Digital",
  description: "Diagnóstico Digital ALGENRI para identificar oportunidades em presença, atendimento, automação e tecnologia.",
};

const sections = [
  { icon: Globe2, title: "Presença digital", text: "Site, Google, reputação e clareza da presença online." },
  { icon: Bot, title: "Atendimento", text: "Velocidade de resposta, organização dos contatos e acompanhamento." },
  { icon: Workflow, title: "Automação", text: "Tarefas manuais, retrabalho, integrações e ganho de eficiência." },
  { icon: LaptopMinimalCheck, title: "Tecnologia", text: "Ferramentas, sistemas, IA e estrutura digital da operação." },
];

export default function DiagnosticoPage() {
  return (
    <main className="page-shell min-h-screen overflow-hidden">
      <section className="relative mx-auto max-w-7xl px-6 pb-14 pt-28 lg:px-8 lg:pt-36">
        <div className="pointer-events-none absolute left-[-100px] top-10 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative max-w-5xl">
          <span className="eyebrow">Diagnóstico Digital ALGENRI</span>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.01] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
            Descubra onde a tecnologia pode gerar <span className="gradient-text">mais resultado agora.</span>
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-white/60">
            Em poucos minutos, avaliamos quatro dimensões essenciais da operação digital. O resultado mostra a maturidade atual e ajuda a organizar prioridades antes de qualquer proposta comercial.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-28 lg:px-8">
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="glass-soft rounded-[24px] p-5">
                <div className="flex items-center justify-between"><Icon className="h-5 w-5 text-cyan-200" /><span className="text-xs text-white/25">0{index + 1}</span></div>
                <h2 className="mt-5 font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/50">{item.text}</p>
              </div>
            );
          })}
        </div>

        <DigitalDiagnostic />

        <div className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-white/30">
          O diagnóstico oferece uma leitura inicial e não substitui uma análise técnica detalhada. Nenhuma informação é enviada nesta etapa interativa.
        </div>
      </section>
    </main>
  );
}
