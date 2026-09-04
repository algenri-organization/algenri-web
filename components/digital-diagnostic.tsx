"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Gauge, RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

type Dimension = "Presença digital" | "Atendimento" | "Automação" | "Tecnologia";
type DiagnosticQuestion = {
  dimension: Dimension;
  question: string;
  reverse?: boolean;
};

const questions: DiagnosticQuestion[] = [
  { dimension: "Presença digital", question: "Sua empresa possui um site profissional, atualizado e adaptado para celular?" },
  { dimension: "Presença digital", question: "Sua empresa aparece de forma organizada no Google, mapas e buscas locais?" },
  { dimension: "Atendimento", question: "Os contatos recebidos têm resposta rápida e acompanhamento até a decisão?" },
  { dimension: "Atendimento", question: "Existe um processo claro para registrar e acompanhar leads e clientes?" },
  { dimension: "Automação", question: "Há tarefas repetitivas que ainda dependem de copiar dados, mensagens ou planilhas manualmente?", reverse: true },
  { dimension: "Automação", question: "Ferramentas e canais importantes trocam informações automaticamente entre si?" },
  { dimension: "Tecnologia", question: "Os principais processos da empresa estão organizados em ferramentas confiáveis, e não apenas em planilhas ou mensagens?" },
  { dimension: "Tecnologia", question: "A empresa já utiliza IA ou tecnologia para apoiar atendimento, produtividade, conteúdo ou decisões?" },
];

const options = [
  { label: "Não", value: 1 },
  { label: "Parcialmente", value: 2 },
  { label: "Sim", value: 3 },
];

const dimensionOrder: Dimension[] = ["Presença digital", "Atendimento", "Automação", "Tecnologia"];

function getLevel(score: number) {
  if (score < 45) return { title: "Base digital a estruturar", text: "Existem oportunidades importantes de organização e profissionalização antes de avançar para soluções mais complexas." };
  if (score < 70) return { title: "Em evolução digital", text: "A empresa já possui uma base, mas ainda há ganhos relevantes em integração, atendimento e eficiência operacional." };
  if (score < 88) return { title: "Boa maturidade digital", text: "A estrutura está bem encaminhada. O maior potencial tende a estar em automação, IA e integração dos ativos existentes." };
  return { title: "Operação digital avançada", text: "A empresa apresenta boa maturidade. O próximo salto pode vir de automações mais inteligentes, dados e soluções próprias." };
}

export function DigitalDiagnostic() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(0));
  const [showResult, setShowResult] = useState(false);

  const answered = answers.filter(Boolean).length;
  const progress = (answered / questions.length) * 100;

  const scores = useMemo(() => {
    return dimensionOrder.map((dimension) => {
      const related = questions
        .map((question, index) => ({ question, answer: answers[index] }))
        .filter(({ question }) => question.dimension === dimension);

      const normalized = related.reduce((sum, { question, answer }) => {
        if (!answer) return sum;
        const effective = question.reverse ? 4 - answer : answer;
        return sum + effective;
      }, 0);

      const max = related.length * 3;
      return { dimension, score: Math.round((normalized / max) * 100) };
    });
  }, [answers]);

  const overall = Math.round(scores.reduce((sum, item) => sum + item.score, 0) / scores.length);
  const level = getLevel(overall);

  function selectAnswer(value: number) {
    setAnswers((current) => current.map((item, index) => index === step ? value : item));
  }

  function next() {
    if (!answers[step]) return;
    if (step === questions.length - 1) setShowResult(true);
    else setStep((current) => current + 1);
  }

  function reset() {
    setAnswers(Array(questions.length).fill(0));
    setStep(0);
    setShowResult(false);
  }

  if (showResult) {
    return (
      <div className="glass overflow-hidden rounded-[32px] p-6 sm:p-8">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="eyebrow"><Sparkles className="h-4 w-4" /> Resultado inicial</span>
            <div className="mt-5 flex items-end gap-3">
              <span className="text-6xl font-semibold tracking-[-0.06em]">{overall}</span>
              <span className="pb-2 text-white/35">/ 100</span>
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.035em]">{level.title}</h2>
            <p className="mt-4 max-w-2xl leading-7 text-white/58">{level.text}</p>
          </div>
          <div className="rounded-[26px] border border-cyan-300/15 bg-cyan-300/[0.04] p-5 lg:max-w-xs">
            <Gauge className="h-5 w-5 text-cyan-200" />
            <p className="mt-4 text-sm leading-6 text-white/55">Este resultado é uma triagem automática. A recomendação comercial final deve considerar contexto, prioridade e objetivo do negócio.</p>
          </div>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          {scores.map((item) => (
            <div key={item.dimension} className="rounded-[24px] border border-white/9 bg-black/15 p-5">
              <div className="flex items-center justify-between text-sm"><span>{item.dimension}</span><span className="text-white/38">{item.score}%</span></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/7"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-violet-400" style={{ width: `${item.score}%` }} /></div>
            </div>
          ))}
        </div>

        <div className="mt-9 rounded-[26px] border border-white/10 bg-white/[0.035] p-6">
          <div className="flex items-start gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-300" /><div><h3 className="font-semibold">Próximo passo recomendado</h3><p className="mt-2 leading-7 text-white/55">Envie seus dados para que a ALGENRI transforme esta triagem em uma recomendação objetiva de prioridades, serviços e próximos passos.</p></div></div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href="/contato" className="button-primary">Quero uma análise ALGENRI <ArrowRight className="h-4 w-4" /></a>
            <button type="button" onClick={reset} className="button-secondary"><RotateCcw className="h-4 w-4" /> Refazer diagnóstico</button>
          </div>
        </div>
      </div>
    );
  }

  const current = questions[step];

  return (
    <div className="glass rounded-[32px] p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[.14em] text-white/35">
        <span>{current.dimension}</span>
        <span>{step + 1} de {questions.length}</span>
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/7"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-violet-400 transition-all duration-300" style={{ width: `${Math.max(progress, ((step + 1) / questions.length) * 100)}%` }} /></div>

      <h2 className="mt-8 max-w-3xl text-2xl font-semibold leading-tight tracking-[-0.025em] sm:text-3xl">{current.question}</h2>
      <p className="mt-3 text-sm text-white/40">Escolha a opção que melhor representa o cenário atual.</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const active = answers[step] === option.value;
          return (
            <button key={option.value} type="button" onClick={() => selectAnswer(option.value)} className={`rounded-[22px] border px-5 py-5 text-left transition ${active ? "border-cyan-300/45 bg-cyan-300/10 shadow-[0_0_35px_rgba(0,229,255,.08)]" : "border-white/10 bg-black/15 hover:border-white/20 hover:bg-white/[0.04]"}`}>
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-9 flex items-center justify-between gap-4">
        <button type="button" onClick={() => setStep((currentStep) => Math.max(0, currentStep - 1))} disabled={step === 0} className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-25"><ArrowLeft className="h-4 w-4" /> Voltar</button>
        <button type="button" onClick={next} disabled={!answers[step]} className="button-primary disabled:cursor-not-allowed disabled:opacity-35">{step === questions.length - 1 ? "Ver resultado" : "Continuar"} <ArrowRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
