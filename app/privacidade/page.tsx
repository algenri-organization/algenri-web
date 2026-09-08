import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Política de Privacidade e tratamento de dados pessoais da ALGENRI.",
};

const sections = [
  ["1. Quem somos", "A ALGENRI desenvolve soluções digitais, inteligência artificial, automações, websites e sistemas personalizados. Para assuntos relacionados a privacidade e proteção de dados, o canal de contato é contato@algenri.com.br."],
  ["2. Quais dados podemos coletar", "Nos formulários, diagnósticos, contatos comerciais e canais de atendimento, podemos coletar nome, empresa, WhatsApp, e-mail, área de interesse, mensagem enviada e registros relacionados ao atendimento. Quando houver relação comercial, também podemos tratar informações necessárias para propostas, contratos, execução de projetos, suporte e faturamento."],
  ["3. Para que usamos os dados", "Utilizamos os dados para responder solicitações, organizar e armazenar leads, realizar contato comercial, entender necessidades, preparar diagnósticos, propostas e contratos, executar serviços contratados, prestar suporte, enviar notificações relacionadas ao atendimento, cumprir obrigações legais e manter registros necessários à relação com interessados e clientes."],
  ["4. Bases e consentimento", "Quando o contato é iniciado pelo próprio titular, tratamos os dados necessários para atender à solicitação e conduzir o relacionamento comercial. Quando aplicável, solicitamos consentimento específico. Outras hipóteses legais previstas na Lei Geral de Proteção de Dados Pessoais (LGPD) poderão ser utilizadas conforme a finalidade e o contexto do tratamento."],
  ["5. WhatsApp Business Platform e integrações", "A ALGENRI pode utilizar a WhatsApp Business Platform, serviços da Meta e outras integrações tecnológicas para atendimento, notificações e relacionamento. Nesses casos, dados como número de telefone, conteúdo necessário da comunicação, identificadores técnicos e status de mensagens podem ser processados para viabilizar a comunicação e o acompanhamento do atendimento."],
  ["6. Compartilhamento", "Os dados podem ser processados por fornecedores de infraestrutura, hospedagem, mensageria, autenticação, armazenamento e outras tecnologias indispensáveis à operação da ALGENRI, sempre de acordo com a finalidade do serviço e observadas as medidas aplicáveis de proteção de dados. Não comercializamos dados pessoais."],
  ["7. Armazenamento e segurança", "Adotamos medidas técnicas e organizacionais adequadas para reduzir riscos de acesso não autorizado, perda, alteração ou divulgação indevida. O período de armazenamento considera a finalidade do tratamento, obrigações legais, segurança, histórico comercial e necessidade de exercício regular de direitos."],
  ["8. Direitos do titular", "Nos termos da legislação aplicável, o titular pode solicitar informações sobre o tratamento e, quando cabível, confirmação, acesso, correção, atualização, anonimização, bloqueio, eliminação, oposição ou revogação de consentimento. As solicitações podem ser encaminhadas para contato@algenri.com.br."],
  ["9. Exclusão de dados", "O titular pode solicitar a exclusão de dados pessoais tratados pela ALGENRI. O procedimento e as informações necessárias para localização segura dos registros estão descritos na página de Exclusão de Dados. Alguns registros podem precisar ser mantidos quando houver obrigação legal, regulatória, exercício regular de direitos ou outra hipótese permitida pela legislação."],
  ["10. Links e serviços de terceiros", "O site pode direcionar para serviços externos, como WhatsApp, e-mail e outras plataformas utilizadas no relacionamento comercial. O tratamento realizado por esses serviços segue também as políticas dos respectivos fornecedores."],
  ["11. Atualizações desta política", "Esta política pode ser atualizada para refletir mudanças legais, operacionais ou tecnológicas. A versão publicada nesta página será considerada a versão vigente."],
];

export default function PrivacyPage() {
  return (
    <main className="page-shell min-h-screen">
      <section className="page-hero mx-auto max-w-5xl">
        <span className="eyebrow">Privacidade e proteção de dados</span>
        <h1 className="section-title mt-5">Política de Privacidade</h1>
        <p className="section-copy mt-7">Esta política explica como a ALGENRI utiliza dados pessoais em seus canais digitais, formulários, integrações e no relacionamento com interessados e clientes.</p>
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

          <div className="mt-10 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.04] p-5">
            <p className="text-sm font-medium text-cyan-100">Canal de privacidade</p>
            <p className="mt-2 text-sm leading-6 text-white/55">Dúvidas ou solicitações relacionadas a dados pessoais podem ser encaminhadas para <a className="text-cyan-200 hover:text-white" href="mailto:contato@algenri.com.br">contato@algenri.com.br</a>. Para solicitar exclusão, consulte também <a className="text-cyan-200 hover:text-white" href="/exclusao-de-dados">Exclusão de Dados</a>.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
