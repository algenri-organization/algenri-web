import type { Metadata } from "next";
import { Mail, ShieldCheck, Trash2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Excluir conta | Psico ALGENRI",
  description: "Recurso público para solicitar exclusão da conta e dos dados associados ao Psico ALGENRI.",
};

const steps = [
  ["1. Envie a solicitação", "Use o botão abaixo para enviar um e-mail para suporte@algenri.com.br com o assunto “Exclusão de conta — Psico ALGENRI”."],
  ["2. Identifique a conta", "Informe o e-mail utilizado no Psico ALGENRI e seu nome. Não envie senha, dados bancários ou conteúdo clínico de pacientes por e-mail."],
  ["3. Confirme a identidade", "Quando necessário para proteger a conta contra exclusões indevidas, poderemos solicitar uma confirmação adicional limitada ao necessário para validar a titularidade."],
  ["4. Processamento", "Após a validação, a conta e os dados associados que não precisem ser mantidos por obrigação legal, regulatória, segurança ou exercício regular de direitos serão excluídos ou anonimizados."],
  ["5. Confirmação", "Ao concluir o processo, enviaremos a confirmação para o endereço de e-mail utilizado na solicitação."],
];

export default function PsicoDeleteAccountPage() {
  return (
    <main className="page-shell min-h-screen">
      <section className="page-hero mx-auto max-w-5xl">
        <span className="eyebrow"><Trash2 className="h-4 w-4" /> Psico ALGENRI • Controle da conta</span>
        <h1 className="section-title mt-5">Solicitar exclusão da conta</h1>
        <p className="section-copy mt-7">Este é o recurso público oficial para solicitar a exclusão da sua conta do Psico ALGENRI e dos dados associados, inclusive caso você não tenha mais acesso ao aplicativo.</p>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-28 lg:px-8">
        <div className="glass rounded-[30px] p-6 sm:p-9">
          <div className="flex items-start gap-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.04] p-5">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-cyan-300" />
            <div><h2 className="font-semibold">Exclusão da conta, não apenas desativação</h2><p className="mt-2 text-sm leading-6 text-white/55">A solicitação inicia o processo de remoção da conta do Psico ALGENRI e dos dados associados que não estejam sujeitos a retenção legal ou regulatória obrigatória.</p></div>
          </div>

          <div className="mt-9 space-y-8">
            {steps.map(([title, text]) => <section key={title}><h2 className="text-xl font-semibold">{title}</h2><p className="mt-3 leading-7 text-white/60">{text}</p></section>)}
          </div>

          <section className="mt-9 border-t border-white/10 pt-8">
            <h2 className="text-xl font-semibold">O que pode ser excluído</h2>
            <p className="mt-3 leading-7 text-white/60">A solicitação pode abranger dados da conta profissional, perfil, pacientes, anamneses, agenda, registros de sessão, notas, tarefas, exercícios, registros financeiros internos do consultório e demais informações vinculadas à conta, observadas as hipóteses de retenção legalmente permitidas.</p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold">O que pode precisar ser mantido</h2>
            <p className="mt-3 leading-7 text-white/60">Alguns registros podem ser mantidos de forma restrita quando houver obrigação legal ou regulatória, prevenção a fraude, segurança, comprovação de transações, exercício regular de direitos ou outra hipótese autorizada pela legislação aplicável. Quando isso ocorrer, a retenção ficará limitada à finalidade que a justifique.</p>
          </section>

          <div className="mt-10 rounded-[24px] border border-white/10 bg-black/15 p-6">
            <p className="text-sm uppercase tracking-[.16em] text-white/35">Canal oficial</p>
            <a className="button-primary mt-4" href="mailto:suporte@algenri.com.br?subject=Exclus%C3%A3o%20de%20conta%20%E2%80%94%20Psico%20ALGENRI&body=Nome%3A%0AE-mail%20da%20conta%20Psico%20ALGENRI%3A%0A%0ASolicito%20a%20exclus%C3%A3o%20da%20minha%20conta%20e%20dos%20dados%20associados.%0A"><Mail className="h-4 w-4" /> Solicitar por e-mail</a>
            <p className="mt-4 text-sm leading-6 text-white/45">Não envie senha nem dados clínicos de pacientes. Para dúvidas, utilize o mesmo endereço: <a className="text-cyan-200 hover:text-white" href="mailto:suporte@algenri.com.br">suporte@algenri.com.br</a>.</p>
          </div>

          <p className="mt-8 text-sm leading-6 text-white/40">Você também pode iniciar a solicitação pelo próprio aplicativo em Perfil → Legal e Privacidade → Exclusão da conta.</p>
        </div>
      </section>
    </main>
  );
}
