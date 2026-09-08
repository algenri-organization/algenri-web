import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Exclusão de Dados",
  description: "Instruções para solicitar exclusão de dados pessoais tratados pela ALGENRI.",
};

const steps = [
  ["1. Envie a solicitação", "Encaminhe um e-mail para contato@algenri.com.br com o assunto “Exclusão de dados pessoais”."],
  ["2. Informe os dados necessários", "Inclua nome, e-mail e/ou número de WhatsApp utilizado no contato com a ALGENRI, além de uma breve descrição do vínculo ou formulário utilizado. Essas informações servem apenas para localizar com segurança os registros relacionados à solicitação."],
  ["3. Confirmação de identidade", "Quando necessário para evitar exclusão indevida de dados de terceiros, a ALGENRI poderá solicitar informações adicionais de confirmação de identidade, limitadas ao necessário para atender ao pedido."],
  ["4. Processamento", "Após a validação, a ALGENRI analisará os registros vinculados ao titular e realizará a exclusão, anonimização ou bloqueio quando cabível, observando os prazos legais aplicáveis e eventuais obrigações de retenção."],
  ["5. Confirmação", "Ao final do processo, a ALGENRI enviará uma confirmação pelo canal de contato utilizado, informando a conclusão ou, quando houver impedimento legal para exclusão integral, a justificativa correspondente."],
];

export default function DataDeletionPage() {
  return (
    <main className="page-shell min-h-screen">
      <section className="page-hero mx-auto max-w-5xl">
        <span className="eyebrow">Privacidade e controle dos seus dados</span>
        <h1 className="section-title mt-5">Exclusão de Dados</h1>
        <p className="section-copy mt-7">Esta página explica como solicitar a exclusão de dados pessoais associados aos canais digitais, formulários, atendimento e integrações da ALGENRI.</p>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-28 lg:px-8">
        <div className="glass rounded-[30px] p-6 sm:p-9">
          <p className="text-sm leading-7 text-white/55">Última atualização: setembro de 2026.</p>
          <div className="mt-8 space-y-8">
            {steps.map(([title, text]) => (
              <section key={title}>
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="mt-3 leading-7 text-white/60">{text}</p>
              </section>
            ))}
          </div>

          <section className="mt-10 border-t border-white/10 pt-8">
            <h2 className="text-xl font-semibold">Dados abrangidos</h2>
            <p className="mt-3 leading-7 text-white/60">A solicitação pode abranger dados fornecidos em formulários, registros de leads e atendimento, contatos comerciais e informações processadas por integrações utilizadas pela ALGENRI, inclusive comunicações realizadas por WhatsApp Business Platform, quando relacionadas ao titular.</p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold">Retenção necessária</h2>
            <p className="mt-3 leading-7 text-white/60">Alguns registros poderão ser mantidos pelo período necessário para cumprimento de obrigação legal ou regulatória, exercício regular de direitos, prevenção a fraude, segurança ou outra hipótese permitida pela legislação aplicável. Nesses casos, o tratamento permanecerá limitado à finalidade que justifique a retenção.</p>
          </section>

          <div className="mt-10 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.04] p-5">
            <p className="text-sm font-medium text-cyan-100">Solicitar exclusão</p>
            <p className="mt-2 text-sm leading-6 text-white/55">Envie sua solicitação para <a className="text-cyan-200 hover:text-white" href="mailto:contato@algenri.com.br?subject=Exclus%C3%A3o%20de%20dados%20pessoais">contato@algenri.com.br</a>. Para conhecer as demais regras de tratamento, consulte a <a className="text-cyan-200 hover:text-white" href="/privacidade">Política de Privacidade</a>.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
