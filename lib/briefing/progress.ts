import type { BriefingQuestion, BriefingSection } from "./types";

function isAnswered(question: BriefingQuestion, value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "boolean" || typeof value === "number") return true;
  return false;
}

export function calculateBriefingProgress(sections: BriefingSection[], answers: Record<string, unknown>) {
  const required = sections.flatMap((section) => section.questions).filter((question) => question.required);
  if (!required.length) return 0;

  const completed = required.filter((question) => isAnswered(question, answers[question.id])).length;
  return Math.round((completed / required.length) * 100);
}
