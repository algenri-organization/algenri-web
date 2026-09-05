import mammoth from "mammoth";
import { templateSnapshotSchema } from "@/lib/briefing/schema";
import type {
  BriefingQuestion,
  BriefingSection,
  BriefingTemplateSnapshot,
  QuestionType,
} from "@/lib/briefing/types";

type ImportOptions = {
  name: string;
  projectType: string;
  version?: string;
  privacyNoticeVersion?: string;
};

type ImportWarning = {
  code: "empty_section" | "unparsed_numbered_paragraph" | "mammoth_message";
  message: string;
};

export type BriefingImportResult = {
  template: BriefingTemplateSnapshot;
  source: {
    parser: "mammoth";
    sectionCount: number;
    questionCount: number;
  };
  warnings: ImportWarning[];
};

type Block = {
  kind: "heading" | "paragraph";
  text: string;
};

const separatorPattern = /^[_\-–—.\s]{12,}$/;
const numberedPattern = /^(\d{1,3})[.)]\s+(.+)$/;

function decodeHtml(value: string) {
  return value
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function htmlToBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  const blockPattern = /<(h1|h2|p|li)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi;

  for (const match of html.matchAll(blockPattern)) {
    const tag = match[1].toLowerCase();
    const text = decodeHtml(match[2]);
    if (!text || separatorPattern.test(text)) continue;

    blocks.push({
      kind: tag === "h1" || tag === "h2" ? "heading" : "paragraph",
      text,
    });
  }

  return blocks;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function stripNumbering(value: string) {
  const match = value.match(numberedPattern);
  return match ? match[2].trim() : value.trim();
}

function inferQuestionType(label: string): QuestionType {
  const normalized = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (normalized.includes("ticket medio") || normalized.includes("valor aproximado")) {
    return "currency";
  }

  if (/^(quantos|quantas|qual a quantidade|qual o numero de)\b/.test(normalized)) {
    return "number";
  }

  if (/\b(e-mail|email)\b/.test(normalized) && /^(qual|informe|digite)/.test(normalized)) {
    return "email";
  }

  if (/\b(data|quando)\b/.test(normalized) && /^(qual|informe)/.test(normalized)) {
    return "date";
  }

  if (/^(existe|deseja|ha |a empresa possui|a empresa pretende|a otium autoriza|e necessaria|e necessario|o site devera|essa pessoa tem|a cliente tera|o estoque precisa)\b/.test(normalized)) {
    return "yes_no";
  }

  return "long_text";
}

function makeSectionId(order: number, title: string) {
  return `section-${order}-${slugify(title) || "untitled"}`;
}

function makeQuestionId(sectionOrder: number, questionOrder: number, label: string) {
  return `s${sectionOrder}-q${questionOrder}-${slugify(label) || "question"}`;
}

export async function importBriefingDocx(
  buffer: Buffer,
  options: ImportOptions,
): Promise<BriefingImportResult> {
  const converted = await mammoth.convertToHtml({ buffer });
  const blocks = htmlToBlocks(converted.value);
  const warnings: ImportWarning[] = converted.messages.map((message) => ({
    code: "mammoth_message",
    message: `${message.type}: ${message.message}`,
  }));

  const sections: BriefingSection[] = [];
  let currentSection: BriefingSection | null = null;
  let currentQuestion: BriefingQuestion | null = null;

  const flushSection = () => {
    if (!currentSection) return;

    if (currentSection.questions.length > 0) {
      currentSection.order = sections.length;
      currentSection.id = makeSectionId(currentSection.order + 1, currentSection.title);
      currentSection.questions = currentSection.questions.map((question, index) => ({
        ...question,
        id: makeQuestionId(currentSection!.order + 1, index + 1, question.label),
        order: index,
      }));
      sections.push(currentSection);
    } else {
      warnings.push({
        code: "empty_section",
        message: `Seção ignorada por não conter perguntas: ${currentSection.title}`,
      });
    }

    currentSection = null;
    currentQuestion = null;
  };

  for (const block of blocks) {
    if (block.kind === "heading") {
      flushSection();
      currentSection = {
        id: "pending",
        title: stripNumbering(block.text),
        order: sections.length,
        questions: [],
      };
      continue;
    }

    if (!currentSection) continue;

    const numbered = block.text.match(numberedPattern);
    if (numbered) {
      const label = numbered[2].trim();
      currentQuestion = {
        id: "pending",
        label,
        type: inferQuestionType(label),
        required: false,
        order: currentSection.questions.length,
      };
      currentSection.questions.push(currentQuestion);
      continue;
    }

    if (currentQuestion) {
      currentQuestion.helperText = currentQuestion.helperText
        ? `${currentQuestion.helperText} ${block.text}`
        : block.text;
    }
  }

  flushSection();

  const template = templateSnapshotSchema.parse({
    name: options.name,
    projectType: options.projectType,
    version: options.version ?? "1.0",
    privacyNoticeVersion: options.privacyNoticeVersion ?? "1.0",
    sections,
  });

  return {
    template,
    source: {
      parser: "mammoth",
      sectionCount: template.sections.length,
      questionCount: template.sections.reduce((total, section) => total + section.questions.length, 0),
    },
    warnings,
  };
}
