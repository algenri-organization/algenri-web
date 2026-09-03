import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diagnóstico Digital",
  description: "Diagnóstico Digital ALGENRI para identificar oportunidades em presença, atendimento, automação e tecnologia.",
};

const sections = [
  ["Presença digital", "Seu site, Google, redes, reputação e clareza da proposta comercial."],
  ["Atendimento", "Como os contatos chegam, são respondidos e acompanhados até a decisão."],
  ["Automação", "Tarefas manuais, retrabalho, integrações e oportunidades de ganho de eficiência."],
  ["Tecnologia", "Ferramentas, planilhas, sistemas e processos que poderiam ser melhor estruturados."],
];

export default function DiagnosticoPage() {
  return (
    <main className="page-shell min-h-screen">
      <section className="page-hero mx-auto max-w-7xl">
        <span className="eyebrow">Diagnóstico Digital ALGENRI</span>
        <h1 className="section-title mt-5">Tecnologia começa com uma boa pergunta: o que realmente precisa melhorar?</h1>
        <p className="section-copy mt-7">O diagnóstico será o ponto de entrada para entendermos a empresa antes de recomendar qualquer solução. Nesta primeira versão, o formulário organiza as informações essenciais para uma análise inicial.</p>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-28 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
        <aside className="space-y-4">
          {sections.map(([title, text], index) => (
            <div key={title} className="glass-soft rounded-[24px] p-5">
              <span className="text-xs text-white/32">0{index + 1}</span>
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/52">{text}</p>
            </div>
          ))}
        </aside>

        <form className="glass rounded-[30px] p-6 sm:p-8" action="mailto:contato@algenri.com.br" method="post" encType="text/plain">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm text-white/62">Nome
              <input name="nome" required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40" placeholder="Seu nome" />
            </label>
            <label className="block text-sm text-white/62">Empresa
              <input name="empresa" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40" placeholder="Nome da empresa" />
            </label>
            <label className="block text-sm text-white/62">E-mail
              <input type="email" name="email" required className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40" placeholder="voce@empresa.com.br" />
            </label>
            <label className="block text-sm text-white/62">WhatsApp
              <input name="whatsapp" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40" placeholder="(00) 00000-0000" />
            </label>
          </div>

          <label className="mt-5 block text-sm text-white/62">Qual é o principal desafio digital hoje?
            <select name="desafio" className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1728] px-4 py-3 text-white outline-none transition focus:border-cyan-300/40">
              <option>Preciso criar ou melhorar meu site</option>
              <option>Quero automatizar atendimento ou processos</option>
              <option>Quero aplicar IA no negócio</option>
              <option>Preciso de um sistema próprio</option>
              <option>Quero melhorar marketing, conteúdo ou reputação</option>
              <option>Ainda não sei por onde começar</option>
            </select>
          </label>

          <label className="mt-5 block text-sm text-white/62">Conte um pouco sobre o cenário atual
            <textarea name="cenario" rows={6} className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40" placeholder="Quais ferramentas vocês usam hoje? Onde existe retrabalho? O que gostariam de melhorar?" />
          </label>

          <label className="mt-5 flex items-start gap-3 text-xs leading-5 text-white/42">
            <input type="checkbox" required className="mt-1" />
            <span>Autorizo o uso destas informações exclusivamente para contato e elaboração do diagnóstico solicitado.</span>
          </label>

          <button type="submit" className="button-primary mt-7 w-full">Enviar informações para análise</button>
          <p className="mt-4 text-center text-xs leading-5 text-white/32">Esta é a versão inicial do fluxo. Na próxima evolução, o diagnóstico será processado diretamente pela plataforma ALGENRI e integrado ao CRM.</p>
        </form>
      </section>
    </main>
  );
}
