"use client";

import { useEffect } from "react";

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
  const otiumMatch = base.match(/\bOTIUM\b/i);
  if (otiumMatch) return "Briefing OTIUM";

  return base
    .replace(/\bbriefing\b/gi, "")
    .replace(/\bdiagnostico\b/gi, "")
    .replace(/\binicial\b/gi, "")
    .replace(/\s+/g, " ")
    .trim() || "Novo modelo de briefing";
}

function inferProjectType(fileName: string) {
  const normalized = cleanFileBaseName(fileName).toLowerCase();

  if (/otium|e-?commerce|loja|shop|varejo/.test(normalized)) {
    return "Site completo com ecommerce";
  }

  if (/site|website|institucional/.test(normalized)) {
    return "Site institucional";
  }

  if (/automacao|automation/.test(normalized)) {
    return "Automação";
  }

  if (/sistema|saas|software/.test(normalized)) {
    return "Sistema personalizado";
  }

  return "Projeto digital";
}

function fillIfAutomatic(input: HTMLInputElement | null, value: string) {
  if (!input) return;
  const canAutofill = !input.value.trim() || input.dataset.autoFilled === "true";
  if (!canAutofill) return;

  input.value = value;
  input.dataset.autoFilled = "true";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

export default function BriefingImportAutofill() {
  useEffect(() => {
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"][name="file"]');
    if (!fileInput) return;

    const form = fileInput.closest("form");
    if (!form) return;

    const label = fileInput.closest("label");
    const labelText = label?.querySelector<HTMLSpanElement>("span");
    const nameInput = form.querySelector<HTMLInputElement>('input[name="name"]');
    const projectTypeInput = form.querySelector<HTMLInputElement>('input[name="projectType"]');

    const markManual = (input: HTMLInputElement | null) => {
      if (!input) return () => undefined;
      const handler = () => {
        input.dataset.autoFilled = "false";
      };
      input.addEventListener("keydown", handler);
      return () => input.removeEventListener("keydown", handler);
    };

    const cleanupName = markManual(nameInput);
    const cleanupProjectType = markManual(projectTypeInput);

    const handleFileChange = () => {
      const file = fileInput.files?.[0];
      if (!file) {
        if (labelText) labelText.textContent = "Selecionar arquivo .docx";
        return;
      }

      if (labelText) {
        labelText.textContent = file.name;
        labelText.title = file.name;
      }

      fillIfAutomatic(nameInput, inferModelName(file.name));
      fillIfAutomatic(projectTypeInput, inferProjectType(file.name));
    };

    fileInput.addEventListener("change", handleFileChange);

    return () => {
      fileInput.removeEventListener("change", handleFileChange);
      cleanupName();
      cleanupProjectType();
    };
  }, []);

  return null;
}
