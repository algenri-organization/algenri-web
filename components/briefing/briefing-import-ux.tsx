"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileText, LoaderCircle, XCircle } from "lucide-react";

type Feedback = {
  kind: "idle" | "loading" | "success" | "error";
  text: string;
};

function getRequestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function importErrorMessage(error?: string) {
  switch (error) {
    case "authentication_required":
      return "Sua sessão expirou. Saia e entre novamente na área interna.";
    case "email_verification_required":
      return "A conta ainda não está liberada como usuário interno verificado.";
    case "access_denied":
      return "Esta conta não possui acesso à área interna da ALGENRI.";
    case "invalid_file_type":
      return "Selecione um arquivo no formato .docx.";
    case "invalid_file_size":
      return "O arquivo selecionado ultrapassa o tamanho permitido.";
    case "no_questions_detected":
      return "O DOCX foi lido, mas nenhuma pergunta estruturada foi encontrada.";
    case "briefing_import_failed":
      return "O servidor não conseguiu concluir a importação. Tente novamente.";
    default:
      return "Não foi possível importar o modelo. Tente novamente.";
  }
}

function cleanFileBaseName(fileName: string) {
  return fileName
    .replace(/\.docx$/i, "")
    .replace(/^ALGENRI[_\s-]*/i, "")
    .replace(/[_\s-]*v\d+(?:\.\d+)?[_\s-]*(?:consolidado|final)?$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferModelName(fileName: string) {
  const base = cleanFileBaseName(fileName);
  if (/\bOTIUM\b/i.test(base)) return "Briefing OTIUM";

  const simplified = base
    .replace(/\bbriefing\b/gi, "")
    .replace(/\bdiagnostico\b/gi, "")
    .replace(/\binicial\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return simplified ? `Briefing ${simplified}` : "Novo modelo de briefing";
}

function inferProjectType(fileName: string) {
  const normalized = cleanFileBaseName(fileName).toLowerCase();

  if (/otium|e-?commerce|loja|shop|varejo/.test(normalized)) return "Site completo com ecommerce";
  if (/site|website|institucional/.test(normalized)) return "Site institucional";
  if (/automacao|automation/.test(normalized)) return "Automação";
  if (/sistema|saas|software/.test(normalized)) return "Sistema personalizado";
  return "Projeto digital";
}

function autofillInput(input: HTMLInputElement | null, value: string) {
  if (!input) return;
  if (input.value.trim() && input.dataset.autoFilled !== "true") return;

  input.value = value;
  input.dataset.autoFilled = "true";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

export default function BriefingImportUx() {
  const [fileName, setFileName] = useState("");
  const [feedback, setFeedback] = useState<Feedback>({ kind: "idle", text: "" });

  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>('input[type="file"][name="file"]');
    if (!input) return;

    const form = input.closest("form");
    const nameInput = form?.querySelector<HTMLInputElement>('input[name="name"]') ?? null;
    const projectTypeInput = form?.querySelector<HTMLInputElement>('input[name="projectType"]') ?? null;

    const markManual = (target: HTMLInputElement | null) => {
      if (!target) return () => undefined;
      const handler = () => {
        target.dataset.autoFilled = "false";
      };
      target.addEventListener("keydown", handler);
      return () => target.removeEventListener("keydown", handler);
    };

    const cleanupName = markManual(nameInput);
    const cleanupProjectType = markManual(projectTypeInput);

    const handleChange = () => {
      const file = input.files?.[0];
      const name = file?.name ?? "";
      setFileName(name);
      setFeedback({ kind: "idle", text: "" });

      const label = input.closest("label");
      const text = label?.querySelector("span");
      if (text) {
        text.textContent = name || "Selecionar arquivo .docx";
        if (name) text.setAttribute("title", name);
      }

      if (file) {
        autofillInput(nameInput, inferModelName(file.name));
        autofillInput(projectTypeInput, inferProjectType(file.name));
      }
    };

    input.addEventListener("change", handleChange);
    return () => {
      input.removeEventListener("change", handleChange);
      cleanupName();
      cleanupProjectType();
    };
  }, []);

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      const url = getRequestUrl(args[0]);
      const isBriefingImport = url.includes("/api/internal/briefing/templates/import");
      if (!isBriefingImport) return originalFetch(...args);

      setFeedback({ kind: "loading", text: "Importando e processando o DOCX…" });

      try {
        const response = await originalFetch(...args);
        let payload: Record<string, unknown> = {};
        try {
          payload = await response.clone().json();
        } catch {
          payload = {};
        }

        if (response.ok) {
          const sections = typeof payload.sectionCount === "number" ? payload.sectionCount : null;
          const questions = typeof payload.questionCount === "number" ? payload.questionCount : null;
          const detail = sections !== null && questions !== null
            ? ` ${sections} seções e ${questions} perguntas identificadas.`
            : "";
          setFeedback({ kind: "success", text: `Modelo importado com sucesso.${detail}` });
        } else {
          setFeedback({
            kind: "error",
            text: importErrorMessage(typeof payload.error === "string" ? payload.error : undefined),
          });
        }

        return response;
      } catch (error) {
        setFeedback({
          kind: "error",
          text: error instanceof Error ? `Falha de comunicação: ${error.message}` : "Falha de comunicação durante a importação.",
        });
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  if (!fileName && feedback.kind === "idle") return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] w-[min(420px,calc(100vw-40px))] rounded-2xl border border-white/10 bg-[#071423]/95 p-4 text-sm text-white shadow-2xl backdrop-blur">
      <div className="flex items-start gap-3">
        {feedback.kind === "loading" ? <LoaderCircle className="mt-0.5 animate-spin text-cyan-300" size={20} /> : null}
        {feedback.kind === "success" ? <CheckCircle2 className="mt-0.5 text-emerald-300" size={20} /> : null}
        {feedback.kind === "error" ? <XCircle className="mt-0.5 text-rose-300" size={20} /> : null}
        {feedback.kind === "idle" ? <FileText className="mt-0.5 text-cyan-300" size={20} /> : null}
        <div className="min-w-0">
          {fileName && <p className="truncate font-medium text-slate-100">{fileName}</p>}
          <p className={`mt-1 leading-5 ${feedback.kind === "error" ? "text-rose-200" : feedback.kind === "success" ? "text-emerald-200" : "text-slate-400"}`}>
            {feedback.text || "Arquivo selecionado. Nome e tipo de projeto foram sugeridos automaticamente; revise se necessário e clique em Importar modelo."}
          </p>
        </div>
      </div>
    </div>
  );
}
