import type { BriefingQuestion, BriefingSection } from "./types";

function valuesEqual(left: unknown, right: unknown) {
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((value) => right.includes(value));
  }
  return left === right;
}

export function isBriefingQuestionVisible(question: BriefingQuestion, answers: Record<string, unknown>) {
  if (!question.condition) return true;
  const actual = answers[question.condition.fieldId];
  const expected = question.condition.value;

  if (question.condition.operator === "equals") return valuesEqual(actual, expected);
  if (question.condition.operator === "not_equals") return !valuesEqual(actual, expected);
  if (question.condition.operator === "contains") {
    if (Array.isArray(actual)) return actual.includes(expected as never);
    if (typeof actual === "string") return actual.includes(String(expected));
    return false;
  }
  return true;
}

export function isBriefingQuestionAnswered(question: BriefingQuestion, value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "boolean" || typeof value === "number") return true;
  return false;
}

export function calculateBriefingProgress(sections: BriefingSection[], answers: Record<string, unknown>) {
  const visibleQuestions = sections
    .flatMap((section) => section.questions)
    .filter((question) => isBriefingQuestionVisible(question, answers));

  if (!visibleQuestions.length) return 0;

  const answeredVisible = visibleQuestions.filter((question) =>
    isBriefingQuestionAnswered(question, answers[question.id]),
  ).length;

  return Math.round((answeredVisible / visibleQuestions.length) * 100);
}

export function hasMissingRequiredBriefingAnswers(
  sections: BriefingSection[],
  answers: Record<string, unknown>,
) {
  return sections
    .flatMap((section) => section.questions)
    .filter((question) => question.required && isBriefingQuestionVisible(question, answers))
    .some((question) => !isBriefingQuestionAnswered(question, answers[question.id]));
}
