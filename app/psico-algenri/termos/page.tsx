import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso | Psico ALGENRI",
  description: "Termos de Uso do aplicativo Psico ALGENRI.",
};

const sections = [
  ["1. Aceitação", "Ao criar uma conta ou utilizar o Psico ALGENRI, o usuário declara ter lido e aceito estes Termos de Uso e a Política de Privacidade aplicável."],
  ["2. Finalidade do serviço", "O Psico ALGENRI é uma ferramenta digital de apoio à organização da rotina clínica e administrativa do profissional e ao acompanhamento do paciente por meio de recursos disponibilizados no aplicativo. O serviço não substitui julgamento profissional, supervisão, orientação jurídica, protocolos clínicos, normas éticas ou atendimento de emergência."],
  ["3. Contas profissionais e de pacientes", "O aplicativo possui contas com permissões distintas. O profissional utiliza recursos clínicos e administrativos conforme seu plano e suas permissões. O paciente acessa somente os recursos disponibilizados para sua conta e para o vínculo ativo com o profissional responsável, sem acesso ao prontuário profissional ou às notas clínicas privadas."],
  ["4. Responsabilidade profissional", "O profissional é responsável pelo conteúdo que registra no aplicativo, pela legitimidade do tratamento dos dados que inserir, pela observância das normas profissionais aplicáveis e pela utilização adequada das informações no contexto de sua atuação."],
  ["5. Responsabilidade do paciente", "O paciente deve utilizar sua conta pessoalmente, manter seus dados de acesso protegidos e utilizar os recursos do aplicativo de forma compatível com o acompanhamento conduzido pelo profissional responsável. O uso da área do paciente não substitui orientação clínica nem atendimento de urgência ou emergência."],
  ["6. Conta e acesso", "As contas são individuais e devem ser protegidas pelos respectivos usuários. Compartilhamento indevido de credenciais, tentativa de acesso não autorizado, fraude, uso abusivo ou violação de segurança pode resultar em restrição de acesso e adoção das medidas cabíveis."],
  ["7. Planos, compras e capacidade", "A disponibilidade de recursos, capacidade e módulos pode variar conforme a oferta vigente. Compras e assinaturas são processadas pelas lojas de aplicativos e podem estar sujeitas aos termos, disponibilidade regional, impostos, renovação e regras comerciais dessas plataformas."],
  ["8. Disponibilidade do serviço", "Buscamos manter o serviço disponível e estável, mas podem ocorrer indisponibilidades temporárias por manutenção, atualizações, falhas de terceiros, segurança ou eventos fora do controle razoável da ALGENRI."],
  ["9. Proteção e uso de dados", "O tratamento de dados pessoais segue a Política de Privacidade do Psico ALGENRI. Profissionais e pacientes devem adotar práticas compatíveis com sigilo, segurança e uso legítimo das informações às quais tenham acesso."],
  ["10. Condutas proibidas", "Não é permitido utilizar o serviço para acessar dados de terceiros sem autorização, praticar fraude, violar direitos, introduzir código malicioso, tentar contornar controles de segurança, explorar vulnerabilidades ou utilizar a plataforma para finalidades ilícitas."],
  ["11. Exclusão da conta", "Profissionais e pacientes podem solicitar a exclusão da conta pelo aplicativo ou pela página pública de exclusão. Dados que não precisem ser mantidos por obrigação legal, regulatória, ética, segurança ou exercício regular de direitos serão excluídos, anonimizados ou tratados conforme o processo aplicável."],
  ["12. Propriedade intelectual", "A marca Psico ALGENRI, o software, interfaces, textos, elementos visuais e demais componentes próprios do produto são protegidos pela legislação aplicável. O uso do aplicativo não transfere ao usuário direitos de propriedade intelectual sobre esses elementos."],
  ["13. Alterações", "Estes termos podem ser atualizados quando houver mudanças legais, operacionais, técnicas ou comerciais. A versão vigente será publicada nesta página."],
  ["14. Suporte", "Dúvidas sobre o uso do Psico ALGENRI podem ser encaminhadas para suporte@algenri.com.br."],
];

export default function PsicoTermsPage() {
  return (
    <main className="page-shell min-h-screen">
      <section className="page-hero mx-auto max-w-5xl">
        <span className="eyebrow">Psico ALGENRI • Regras de uso</span>
        <h1 className="section-title mt-5">Termos de Uso</h1>
        <p className="section-copy mt-7">Estes termos estabelecem as condições de utilização do Psico ALGENRI por profissionais e pacientes e as responsabilidades relacionadas ao uso do aplicativo.</p>
      </section>
      <section className="mx-auto max-w-5xl px-6 pb-28 lg:px-8">
        <div className="glass rounded-[30px] p-6 sm:p-9">
          <p className="text-sm leading-7 text-white/55">Última atualização: outubro de 2026.</p>
          <div className="mt-8 space-y-8">
            {sections.map(([title, text]) => <section key={title}><h2 className="text-xl font-semibold">{title}</h2><p className="mt-3 leading-7 text-white/60">{text}</p></section>)}
          </div>
          <div className="mt-10 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.04] p-5">
            <p className="text-sm font-medium text-cyan-100">Contato</p>
            <p className="mt-2 text-sm leading-6 text-white/55">Suporte: <a className="text-cyan-200 hover:text-white" href="mailto:suporte@algenri.com.br">suporte@algenri.com.br</a>. Consulte também a <a className="text-cyan-200 hover:text-white" href="/psico-algenri/privacidade">Política de Privacidade</a>.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
