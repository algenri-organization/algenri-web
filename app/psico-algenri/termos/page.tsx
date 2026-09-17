import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso | Psico ALGENRI",
  description: "Termos de Uso do aplicativo Psico ALGENRI.",
};

const sections = [
  ["1. Aceitação", "Ao criar uma conta ou utilizar o Psico ALGENRI, o usuário declara ter lido e aceito estes Termos de Uso e a Política de Privacidade aplicável."],
  ["2. Finalidade do serviço", "O Psico ALGENRI é uma ferramenta digital de apoio à organização da rotina profissional, com recursos de cadastro de pacientes, anamnese, agenda, registros de sessão, tarefas, exercícios, financeiro e capacidade de uso. O aplicativo não substitui julgamento profissional, supervisão, orientação jurídica, protocolos clínicos, normas éticas ou atendimento de emergência."],
  ["3. Responsabilidade profissional", "O usuário é responsável pelo conteúdo que registra no aplicativo, pela legitimidade do tratamento dos dados que inserir, pela observância das normas profissionais aplicáveis e pela utilização adequada das informações no contexto de sua atuação."],
  ["4. Conta e acesso", "A conta é individual e deve ser protegida pelo próprio usuário. O compartilhamento indevido de credenciais, tentativa de acesso não autorizado, uso abusivo ou violação de segurança pode resultar em restrição de acesso e adoção das medidas cabíveis."],
  ["5. Planos e capacidade", "A versão gratuita oferece capacidade limitada de pacientes. O plano Psico ALGENRI Essencial amplia a capacidade conforme a oferta vigente apresentada no aplicativo e na loja correspondente. Compras são processadas pelas lojas de aplicativos e podem estar sujeitas aos termos, disponibilidade regional, impostos e regras comerciais dessas plataformas."],
  ["6. Disponibilidade do serviço", "Buscamos manter o serviço disponível e estável, mas podem ocorrer indisponibilidades temporárias por manutenção, atualizações, falhas de terceiros, segurança ou eventos fora do controle razoável da ALGENRI."],
  ["7. Proteção e uso de dados", "O tratamento de dados pessoais segue a Política de Privacidade do Psico ALGENRI. O usuário deve adotar práticas compatíveis com o sigilo profissional e evitar o uso do aplicativo de forma contrária à legislação ou às normas éticas aplicáveis."],
  ["8. Condutas proibidas", "Não é permitido utilizar o serviço para acessar dados de terceiros sem autorização, praticar fraude, violar direitos, introduzir código malicioso, tentar contornar controles de segurança, explorar vulnerabilidades ou utilizar a plataforma para finalidades ilícitas."],
  ["9. Exclusão da conta", "O usuário pode solicitar a exclusão da conta pelo aplicativo ou pela página pública de exclusão. Dados que não precisem ser mantidos por obrigação legal, regulatória, segurança ou exercício regular de direitos serão excluídos ou anonimizados conforme o processo aplicável."],
  ["10. Propriedade intelectual", "A marca Psico ALGENRI, o software, interfaces, textos, elementos visuais e demais componentes próprios do produto são protegidos pela legislação aplicável. O uso do aplicativo não transfere ao usuário direitos de propriedade intelectual sobre esses elementos."],
  ["11. Alterações", "Estes termos podem ser atualizados quando houver mudanças legais, operacionais, técnicas ou comerciais. A versão vigente será publicada nesta página."],
  ["12. Suporte", "Dúvidas sobre o uso do Psico ALGENRI podem ser encaminhadas para suporte@algenri.com.br."],
];

export default function PsicoTermsPage() {
  return (
    <main className="page-shell min-h-screen">
      <section className="page-hero mx-auto max-w-5xl">
        <span className="eyebrow">Psico ALGENRI • Regras de uso</span>
        <h1 className="section-title mt-5">Termos de Uso</h1>
        <p className="section-copy mt-7">Estes termos estabelecem as condições de utilização do Psico ALGENRI e as responsabilidades relacionadas ao uso profissional do aplicativo.</p>
      </section>
      <section className="mx-auto max-w-5xl px-6 pb-28 lg:px-8">
        <div className="glass rounded-[30px] p-6 sm:p-9">
          <p className="text-sm leading-7 text-white/55">Última atualização: setembro de 2026.</p>
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
