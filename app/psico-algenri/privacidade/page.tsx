import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | Psico ALGENRI",
  description: "Política de Privacidade do aplicativo Psico ALGENRI.",
};

const sections = [
  ["1. Sobre esta política", "Esta Política de Privacidade descreve como o Psico ALGENRI trata dados pessoais relacionados à criação e uso da conta, suporte, segurança, funcionamento do aplicativo e informações inseridas pelo profissional no exercício de sua atividade."],
  ["2. Quem utiliza o Psico ALGENRI", "O aplicativo é destinado ao uso profissional. O usuário da conta é o profissional que utiliza o Psico ALGENRI para organizar sua rotina. Dados de pacientes podem ser inseridos pelo próprio profissional para viabilizar funcionalidades clínicas e administrativas."],
  ["3. Dados da conta profissional", "Podemos tratar nome, e-mail, telefone, identificadores de conta, imagem de perfil, registros de autenticação, CRP e estado do CRP quando informados, abordagem profissional, tipo de licença, capacidade disponível, código de indicação, histórico de compras e solicitações de suporte."],
  ["4. Dados de pacientes inseridos pelo profissional", "O Psico ALGENRI permite registrar nome, data de nascimento, telefone, e-mail, modalidade de atendimento, valor de atendimento, queixa principal, informações sobre medicamentos, psicoterapia anterior e outros dados necessários ao acompanhamento profissional. O conteúdo inserido pode incluir dados pessoais sensíveis relacionados à saúde."],
  ["5. Registros clínicos e conteúdo do usuário", "Podem ser armazenados anamnese, objetivos terapêuticos, respostas de formulários, notas, registros de sessão, observações privadas, tarefas, exercícios e respostas associadas. Esses conteúdos são inseridos e administrados pelo profissional usuário no contexto de sua atividade."],
  ["6. Agenda e informações financeiras", "O aplicativo pode armazenar horários de atendimentos, recorrência, status de consultas, valores de serviços, vencimentos, situação de recebimento, forma de pagamento e observações financeiras internas. O Psico ALGENRI não acessa a agenda de contatos nem o calendário pessoal do dispositivo para essas funcionalidades."],
  ["7. Imagens", "Quando o profissional escolhe adicionar ou alterar sua foto de perfil, o aplicativo pode acessar a biblioteca de imagens do dispositivo somente após autorização do usuário. A imagem escolhida é armazenada para exibição do perfil."],
  ["8. Compras no aplicativo", "Compras e ativações de capacidade podem ser processadas pela Apple App Store ou Google Play e validadas com apoio do RevenueCat. O Psico ALGENRI pode receber informações sobre o produto adquirido, situação da compra, identificador da transação e direitos ativos. A ALGENRI não recebe, por meio do aplicativo, o número completo do cartão ou as credenciais de pagamento utilizadas nas lojas."],
  ["9. Finalidades do tratamento", "Os dados são tratados para autenticar usuários, manter conta e perfil, disponibilizar funcionalidades clínicas e administrativas, armazenar e sincronizar registros, organizar agenda e financeiro, controlar capacidade de uso, confirmar compras, oferecer suporte, atender solicitações do usuário, prevenir abuso, proteger contas e manter a segurança e integridade do serviço."],
  ["10. Provedores utilizados", "O Psico ALGENRI utiliza provedores necessários à operação do serviço. O Supabase é utilizado para autenticação, banco de dados e armazenamento. O RevenueCat é utilizado para validar e gerenciar direitos relacionados a compras no aplicativo. Apple e Google processam compras realizadas em suas respectivas lojas. Esses provedores tratam dados conforme suas funções na prestação do serviço e seus próprios termos e políticas aplicáveis."],
  ["11. Compartilhamento de dados", "A ALGENRI não vende dados pessoais. Informações podem ser transmitidas a prestadores necessários para operar o aplicativo, como os provedores descritos nesta política, ou quando houver obrigação legal, proteção de direitos, prevenção de fraude, segurança ou solicitação válida de autoridade competente. O acesso deve ficar limitado ao necessário para a finalidade aplicável."],
  ["12. Segurança", "Adotamos controles técnicos e organizacionais voltados à proteção dos dados, incluindo autenticação, isolamento de acesso por usuário, políticas de acesso no banco de dados, conexão protegida na transmissão e controles de armazenamento. Nenhum sistema é imune a riscos, e as medidas de segurança podem ser revisadas e aprimoradas ao longo do tempo."],
  ["13. Retenção", "Os dados permanecem armazenados enquanto necessários para a conta e para as funcionalidades utilizadas, cumprimento das finalidades informadas, segurança, prevenção de fraude, exercício regular de direitos e obrigações legais ou regulatórias aplicáveis. Quando uma exclusão é solicitada, os dados são avaliados para exclusão, anonimização ou retenção restrita ao que for necessário e permitido."],
  ["14. Exclusão da conta", "O profissional pode iniciar uma solicitação de exclusão dentro do próprio aplicativo e também pela página pública de exclusão de conta. A solicitação abrange a conta e os dados associados que não precisem ser mantidos por obrigação legal, regulatória, segurança, prevenção de fraude ou exercício regular de direitos."],
  ["15. Direitos e solicitações", "O titular pode solicitar, quando aplicável, confirmação de tratamento, acesso, correção, atualização, informações sobre compartilhamento, anonimização, bloqueio, eliminação, oposição ou outras medidas previstas na legislação aplicável. Solicitações podem ser encaminhadas para suporte@algenri.com.br."],
  ["16. Crianças e adolescentes", "O Psico ALGENRI não é direcionado a crianças ou adolescentes para criação de conta própria. Caso o profissional registre informações de pacientes menores de idade, cabe a ele observar as exigências legais, éticas e profissionais aplicáveis ao tratamento desses dados."],
  ["17. Transferência e processamento por provedores", "Alguns provedores tecnológicos podem processar ou armazenar informações em infraestrutura localizada fora do Brasil. Nesses casos, o tratamento ocorre conforme as salvaguardas e mecanismos aplicáveis ao serviço contratado e à legislação pertinente."],
  ["18. Alterações desta política", "Esta política pode ser atualizada para refletir mudanças legais, operacionais, de segurança, de fornecedores ou de funcionalidades. A versão publicada nesta página será considerada a versão vigente."],
  ["19. Contato", "Dúvidas, solicitações de privacidade e suporte relacionadas ao Psico ALGENRI podem ser encaminhadas para suporte@algenri.com.br."],
];

export default function PsicoPrivacyPage() {
  return (
    <main className="page-shell min-h-screen">
      <section className="page-hero mx-auto max-w-5xl">
        <span className="eyebrow">Psico ALGENRI • Privacidade</span>
        <h1 className="section-title mt-5">Política de Privacidade</h1>
        <p className="section-copy mt-7">Informações sobre o tratamento de dados no Psico ALGENRI, incluindo dados da conta profissional, dados de pacientes, registros clínicos, informações financeiras e compras no aplicativo.</p>
      </section>
      <section className="mx-auto max-w-5xl px-6 pb-28 lg:px-8">
        <div className="glass rounded-[30px] p-6 sm:p-9">
          <p className="text-sm leading-7 text-white/55">Última atualização: setembro de 2026.</p>
          <div className="mt-8 space-y-8">
            {sections.map(([title, text]) => <section key={title}><h2 className="text-xl font-semibold">{title}</h2><p className="mt-3 leading-7 text-white/60">{text}</p></section>)}
          </div>
          <div className="mt-10 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.04] p-5">
            <p className="text-sm font-medium text-cyan-100">Privacidade, suporte e exclusão</p>
            <p className="mt-2 text-sm leading-6 text-white/55">Entre em contato pelo e-mail <a className="text-cyan-200 hover:text-white" href="mailto:suporte@algenri.com.br">suporte@algenri.com.br</a>. Para exclusão de conta, utilize também a página <a className="text-cyan-200 hover:text-white" href="/psico-algenri/excluir-conta">Excluir conta do Psico ALGENRI</a>.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
