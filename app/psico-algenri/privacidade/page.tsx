import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | Psico ALGENRI",
  description: "Política de Privacidade do aplicativo Psico ALGENRI.",
};

const sections = [
  ["1. Sobre esta política", "Esta Política de Privacidade descreve como o Psico ALGENRI trata dados pessoais relacionados à criação e uso da conta, suporte, segurança, funcionamento do aplicativo e informações inseridas pelo profissional no exercício de sua atividade."],
  ["2. Dados da conta profissional", "Podemos tratar nome, e-mail, identificadores de conta, imagem de perfil, registros de autenticação, informações de plano, capacidade contratada, histórico de compras e solicitações de suporte necessárias para disponibilizar e administrar o serviço."],
  ["3. Dados de pacientes inseridos pelo profissional", "O Psico ALGENRI permite que o profissional registre dados de pacientes, incluindo cadastro, anamnese, agenda, registros de sessão, notas, tarefas e informações financeiras relacionadas ao atendimento. Esses dados podem incluir informações pessoais e dados sensíveis de saúde. O profissional usuário é responsável por utilizar o aplicativo de forma compatível com suas obrigações profissionais, éticas e legais e por possuir base jurídica adequada para o tratamento das informações que inserir."],
  ["4. Finalidades do tratamento", "Os dados são tratados para autenticar usuários, manter a conta e o perfil, viabilizar os recursos clínicos e administrativos do aplicativo, armazenar e sincronizar registros, processar solicitações do usuário, oferecer suporte, prevenir abuso, manter a segurança, controlar capacidade de uso e confirmar compras realizadas pelas lojas de aplicativos."],
  ["5. Infraestrutura e fornecedores", "O serviço pode utilizar provedores de autenticação, banco de dados, armazenamento, hospedagem, monitoramento e processamento de compras necessários à operação do aplicativo. O acesso é limitado ao necessário para a prestação do serviço e sujeito às medidas técnicas e contratuais aplicáveis."],
  ["6. Compras no aplicativo", "Compras e ativações de capacidade podem ser processadas pela Apple App Store, Google Play e serviços tecnológicos utilizados para validar os direitos adquiridos. A ALGENRI não recebe dados completos de cartão de pagamento do usuário por meio do aplicativo."],
  ["7. Segurança", "Adotamos controles técnicos e organizacionais voltados à proteção dos dados, incluindo autenticação, isolamento de acesso por usuário, políticas de acesso no banco de dados, transmissão protegida e controles de armazenamento. Nenhum sistema é imune a riscos, por isso medidas de segurança são continuamente revisadas."],
  ["8. Retenção", "Os dados permanecem armazenados enquanto necessários para o funcionamento da conta, cumprimento das finalidades informadas, exercício regular de direitos, segurança e obrigações legais ou regulatórias aplicáveis. Quando uma exclusão é solicitada, os dados são avaliados para exclusão, anonimização ou retenção limitada ao que for legalmente necessário."],
  ["9. Direitos e solicitações", "O titular pode solicitar, quando aplicável, confirmação de tratamento, acesso, correção, atualização, informações sobre compartilhamento, eliminação, anonimização, bloqueio, oposição ou outras medidas previstas na legislação aplicável. Solicitações podem ser encaminhadas para suporte@algenri.com.br."],
  ["10. Exclusão da conta", "O usuário profissional pode iniciar uma solicitação de exclusão dentro do próprio aplicativo e também por meio da página pública de exclusão de conta do Psico ALGENRI. A exclusão abrange a conta e os dados associados que não precisem ser mantidos por obrigação legal, regulatória, segurança ou exercício regular de direitos."],
  ["11. Crianças e adolescentes", "O Psico ALGENRI é destinado ao uso profissional por psicólogos e outros profissionais autorizados. O aplicativo não é direcionado a crianças para criação de conta própria. O tratamento de dados de pacientes menores de idade, quando realizado pelo profissional, deve observar as exigências legais, éticas e profissionais aplicáveis."],
  ["12. Contato", "Dúvidas, solicitações de privacidade e suporte relacionadas ao Psico ALGENRI podem ser encaminhadas para suporte@algenri.com.br."],
  ["13. Atualizações", "Esta política pode ser atualizada para refletir alterações legais, operacionais, de segurança ou de funcionalidades. A versão publicada nesta página será considerada a versão vigente."],
];

export default function PsicoPrivacyPage() {
  return (
    <main className="page-shell min-h-screen">
      <section className="page-hero mx-auto max-w-5xl">
        <span className="eyebrow">Psico ALGENRI • Privacidade</span>
        <h1 className="section-title mt-5">Política de Privacidade</h1>
        <p className="section-copy mt-7">Informações sobre o tratamento de dados no aplicativo Psico ALGENRI, incluindo dados da conta profissional e informações registradas no acompanhamento clínico.</p>
      </section>
      <section className="mx-auto max-w-5xl px-6 pb-28 lg:px-8">
        <div className="glass rounded-[30px] p-6 sm:p-9">
          <p className="text-sm leading-7 text-white/55">Última atualização: setembro de 2026.</p>
          <div className="mt-8 space-y-8">
            {sections.map(([title, text]) => <section key={title}><h2 className="text-xl font-semibold">{title}</h2><p className="mt-3 leading-7 text-white/60">{text}</p></section>)}
          </div>
          <div className="mt-10 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.04] p-5">
            <p className="text-sm font-medium text-cyan-100">Privacidade e suporte</p>
            <p className="mt-2 text-sm leading-6 text-white/55">Entre em contato pelo e-mail <a className="text-cyan-200 hover:text-white" href="mailto:suporte@algenri.com.br">suporte@algenri.com.br</a>. Para exclusão de conta, utilize também a página <a className="text-cyan-200 hover:text-white" href="/psico-algenri/excluir-conta">Excluir conta do Psico ALGENRI</a>.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
