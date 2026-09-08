import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de uso do site e dos canais digitais da ALGENRI.",
};

const sections = [
  ["1. Aplicação destes termos", "Estes Termos de Uso regulam o acesso ao site, formulários, páginas públicas e demais canais digitais mantidos pela ALGENRI. Ao utilizar esses canais, o usuário declara estar ciente destas condições e da Política de Privacidade."],
  ["2. Finalidade dos canais", "Os canais da ALGENRI apresentam soluções digitais, inteligência artificial, automações, websites, sistemas personalizados e serviços relacionados. Informações comerciais, diagnósticos, propostas e escopos apresentados no site possuem caráter informativo até que sejam formalizados em proposta, contrato ou instrumento específico."],
  ["3. Uso adequado", "O usuário se compromete a fornecer informações verdadeiras e a utilizar os canais de forma lícita, sem tentativa de acesso indevido, fraude, interferência técnica, envio de conteúdo malicioso ou uso que possa comprometer a segurança, disponibilidade ou integridade dos serviços."],
  ["4. Formulários e contato", "Ao preencher formulários ou iniciar contato pelos canais indicados, o usuário autoriza o tratamento dos dados necessários para responder à solicitação e conduzir o relacionamento comercial, nos termos da Política de Privacidade. O contato poderá ocorrer por e-mail, telefone, WhatsApp ou outros canais informados pelo próprio usuário."],
  ["5. WhatsApp e serviços de terceiros", "A ALGENRI pode utilizar o WhatsApp Business Platform e outros serviços de terceiros para atendimento, notificações e relacionamento. O uso desses serviços também está sujeito aos termos e políticas dos respectivos fornecedores. A ALGENRI não controla indisponibilidades ou alterações em plataformas de terceiros."],
  ["6. Propriedade intelectual", "Textos, identidade visual, marcas, elementos gráficos, materiais, interfaces e demais conteúdos próprios da ALGENRI são protegidos pela legislação aplicável. A reprodução, distribuição ou exploração comercial sem autorização prévia não é permitida, salvo quando expressamente indicado."],
  ["7. Disponibilidade e alterações", "A ALGENRI poderá atualizar conteúdos, funcionalidades, integrações e estes Termos de Uso a qualquer momento para refletir mudanças operacionais, tecnológicas ou legais. Poderão ocorrer indisponibilidades temporárias por manutenção, falhas de terceiros ou eventos fora de controle razoável."],
  ["8. Limitação e contratação", "Nenhuma informação publicada substitui análise técnica, proposta comercial ou contrato específico. Obrigações, prazos, valores, garantias e responsabilidades relativos a serviços contratados serão definidos nos documentos aplicáveis a cada relação comercial."],
  ["9. Privacidade e dados pessoais", "O tratamento de dados pessoais relacionado ao uso do site e dos canais digitais segue a Política de Privacidade da ALGENRI. Solicitações relacionadas a dados pessoais podem ser encaminhadas para contato@algenri.com.br."],
  ["10. Contato", "Dúvidas sobre estes termos podem ser encaminhadas para contato@algenri.com.br."],
];

export default function TermsPage() {
  return (
    <main className="page-shell min-h-screen">
      <section className="page-hero mx-auto max-w-5xl">
        <span className="eyebrow">Transparência e uso responsável</span>
        <h1 className="section-title mt-5">Termos de Uso</h1>
        <p className="section-copy mt-7">Estas condições orientam o uso do site e dos canais digitais da ALGENRI.</p>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-28 lg:px-8">
        <div className="glass rounded-[30px] p-6 sm:p-9">
          <p className="text-sm leading-7 text-white/55">Última atualização: setembro de 2026.</p>
          <div className="mt-8 space-y-8">
            {sections.map(([title, text]) => (
              <section key={title}>
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="mt-3 leading-7 text-white/60">{text}</p>
              </section>
            ))}
          </div>
          <div className="mt-10 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.04] p-5 text-sm leading-6 text-white/55">
            Consulte também a <a href="/privacidade" className="text-cyan-200 hover:text-white">Política de Privacidade</a> e as <a href="/exclusao-de-dados" className="text-cyan-200 hover:text-white">Instruções para Exclusão de Dados</a>.
          </div>
        </div>
      </section>
    </main>
  );
}
