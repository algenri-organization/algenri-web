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
  if (/\bOTIUM\b/i.test(base)) return "Briefing OTIUM";

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
  if (/site|website|institucional/.test(normalized)) return "Site institucional";
  if (/automacao|automation/.test(normalized)) return "Automação";
  if (/sistema|saas|software/.test(normalized)) return "Sistema personalizado";
  return "Projeto digital";
}

function setInputValue(input: HTMLInputElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function fillIfAutomatic(input: HTMLInputElement | null, value: string) {
  if (!input) return;
  const canAutofill = !input.value.trim() || input.dataset.autoFilled === "true";
  if (!canAutofill) return;

  setInputValue(input, value);
  input.dataset.autoFilled = "true";
}

export default function BriefingImportAutofill() {
  useEffect(() => {
    let cleanupBoundForm: (() => void) | null = null;

    const bindForm = () => {
      const fileInput = document.querySelector<HTMLInputElement>('input[type="file"][name="file"]');
      if (!fileInput || fileInput.dataset.autofillBound === "true") return false;

      const form = fileInput.closest("form");
      if (!form) return false;

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
          if (labelText) {
            labelText.textContent = "Selecionar arquivo .docx";
            labelText.removeAttribute("title");
          }
          return;
        }

        if (labelText) {
          labelText.textContent = file.name;
          labelText.title = file.name;
        }

        fillIfAutomatic(nameInput, inferModelName(file.name));
        fillIfAutomatic(projectTypeInput, inferProjectType(file.name));
      };

      fileInput.dataset.autofillBound = "true";
      fileInput.addEventListener("change", handleFileChange);

      cleanupBoundForm = () => {
        fileInput.removeEventListener("change", handleFileChange);
        delete fileInput.dataset.autofillBound;
        cleanupName();
        cleanupProjectType();
      };

      return true;
    };

    if (bindForm()) {
      return () => cleanupBoundForm?.();
    }

    const observer = new MutationObserver(() => {
      if (bindForm()) observer.disconnect();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      cleanupBoundForm?.();
    };
  }, []);

  return null;
}
