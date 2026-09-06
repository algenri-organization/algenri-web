import { getClient, getProject } from "@/lib/client-flow/store";
import { getProjectDossier } from "@/lib/dossiers/store";
import { getInternalBriefingInstance, listBriefingInstances } from "@/lib/briefing/instance-store";
import { getCommercialProposal, applyAiProposalDraft, type ProposalSection } from "@/lib/proposals/store";

export type ProposalAiSource = "auto" | "dossier" | "briefing" | "project";

type AiDraft = {
  summary: string;
  sections: Array<{ key: string; title: string; content: string }>;
};

const SECTION_KEYS = [
  "company_presentation",
  "project_context",
  "proposal_objective",
  "scope",
  "deliverables",
  "exclusions",
  "schedule",
  "client_responsibilities",
  "commercial_conditions",
  "next_steps",
] as const;

function safeJson(value: unknown) {
  try { return JSON.stringify(value); } catch { return "{}"; }
}

function briefingContext(detail: Awaited<ReturnType<typeof getInternalBriefingInstance>>) {
  if (!detail) return null;
  const rows = detail.instance.templateSnapshot.sections.flatMap((section) => section.questions.map((question) => ({
    section: section.title,
    question: question.label,
    answer: detail.answers[question.id] ?? null,
  })));
  return {
    template: detail.instance.templateSnapshot.name,
    version: detail.instance.templateVersion,
    status: detail.instance.status,
    progress: detail.instance.progress,
    answers: rows,
  };
}

function extractOutputText(payload: any) {
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return "";
}

function classifyProviderFailure(status: number, payload: any) {
  const type = String(payload?.error?.type ?? "").toLowerCase();
  const code = String(payload?.error?.code ?? "").toLowerCase();
  const message = String(payload?.error?.message ?? "").toLowerCase();
  const joined = `${type} ${code} ${message}`;

  if (joined.includes("insufficient_quota") || joined.includes("billing") || joined.includes("quota") || joined.includes("credit balance")) {
    return "ai_insufficient_quota";
  }
  if (status === 401 || joined.includes("invalid_api_key") || joined.includes("incorrect api key") || joined.includes("authentication")) {
    return "ai_invalid_credentials";
  }
  if (status === 429 || joined.includes("rate_limit") || joined.includes("rate limit")) {
    return "ai_rate_limited";
  }
  if (status === 404 || joined.includes("model_not_found") || joined.includes("does not exist") || joined.includes("model") && joined.includes("access")) {
    return "ai_model_unavailable";
  }
  if (status >= 500) return "ai_provider_unavailable";
  if (status === 400 && (joined.includes("json_schema") || joined.includes("schema") || joined.includes("response_format"))) {
    return "ai_schema_rejected";
  }
  return "ai_generation_failed";
}

export async function generateProposalWithAi(input: {
  proposalId: string;
  source?: ProposalAiSource;
  instructions?: string;
  updatedBy: string;
}) {
  const proposal = await getCommercialProposal(input.proposalId);
  if (!proposal) throw new Error("proposal_not_found");
  if (!["draft", "in_review"].includes(proposal.status)) throw new Error("proposal_locked");

  const [project, client] = await Promise.all([getProject(proposal.projectId), getClient(proposal.clientId)]);
  if (!project || !client) throw new Error("proposal_context_not_found");

  const briefings = await listBriefingInstances({ projectId: project.id });
  const preferredBriefing = [...briefings].sort((a, b) => {
    const aCompleted = a.status === "completed" ? 1 : 0;
    const bCompleted = b.status === "completed" ? 1 : 0;
    if (aCompleted !== bCompleted) return bCompleted - aCompleted;
    return (b.completedAt ?? b.lastSavedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.lastSavedAt ?? a.createdAt);
  })[0];
  const briefing = preferredBriefing ? await getInternalBriefingInstance(preferredBriefing.id) : null;
  const dossier = proposal.sourceDossierId ? await getProjectDossier(proposal.sourceDossierId) : null;

  const requestedSource = input.source ?? "auto";
  let resolvedSource: Exclude<ProposalAiSource, "auto"> = "project";
  if (requestedSource === "dossier" && dossier) resolvedSource = "dossier";
  else if (requestedSource === "briefing" && briefing) resolvedSource = "briefing";
  else if (requestedSource === "project") resolvedSource = "project";
  else if (requestedSource === "auto") resolvedSource = dossier ? "dossier" : briefing ? "briefing" : "project";
  else if (requestedSource === "dossier" && !dossier) throw new Error("dossier_not_available");
  else if (requestedSource === "briefing" && !briefing) throw new Error("briefing_not_available");

  const context = {
    company: {
      name: "ALGENRI",
      positioning: "Parceira de tecnologia e soluções digitais para empresas, unindo pessoas, ideias, tecnologia e evolução.",
      slogan: "Tecnologia que impulsiona o seu amanhã.",
      services: ["sites e e-commerce", "sistemas e SaaS", "IA e automação", "WhatsApp e atendimento digital", "SEO e presença digital", "manutenção e suporte", "LGPD técnica e acessibilidade"],
    },
    client: {
      legalName: client.legalName,
      tradeName: client.tradeName,
      segment: client.segment,
      city: client.city,
      state: client.state,
      website: client.website,
      notes: client.notes,
    },
    project: {
      name: project.name,
      type: project.projectType,
      description: project.description,
      notes: project.notes,
      status: project.status,
      expectedDeliveryDate: project.expectedDeliveryDate,
    },
    dossier: dossier ? {
      title: dossier.title,
      version: dossier.version,
      status: dossier.status,
      sections: dossier.sections.map((section) => ({ key: section.key, title: section.title, content: section.content })),
    } : null,
    briefing: briefingContext(briefing),
    currentProposal: {
      title: proposal.title,
      summary: proposal.summary,
      sections: proposal.sections.map((section) => ({ key: section.key, title: section.title, content: section.content })),
      paymentTerms: proposal.paymentTerms,
      commercialConditions: proposal.commercialConditions,
      investmentItems: proposal.investmentItems.map((item) => ({ description: item.description, billingType: item.billingType, recurrence: item.recurrence, quantity: item.quantity, unitValue: item.unitValue })),
    },
    sourceToPrioritize: resolvedSource,
    additionalInstructions: input.instructions?.trim() || "",
  };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("ai_not_configured");
  const model = process.env.OPENAI_PROPOSAL_MODEL || "gpt-5.6-luna";

  const prompt = `Você é o especialista comercial da ALGENRI. Gere uma proposta comercial completa, objetiva, persuasiva e profissional em português do Brasil.

REGRAS:
- Use somente fatos presentes no contexto. Não invente funcionalidades, prazos, preços, integrações, garantias, dados jurídicos ou condições de pagamento.
- Quando algum ponto depender de confirmação, escreva de forma segura, por exemplo: "a definir em conjunto" ou "conforme validação técnica".
- Não invente valores. Os preços são controlados separadamente pelo operador da ALGENRI.
- Evite linguagem genérica, exagerada ou repetitiva. A proposta deve parecer específica para o cliente e o projeto.
- Preserve o posicionamento premium e consultivo da ALGENRI.
- A seção "Apresentação da ALGENRI" deve ser curta.
- Em "Escopo" e "Entregáveis", use listas claras quando isso melhorar a leitura.
- Em "Itens Não Incluídos", delimite o escopo sem criar restrições que não estejam justificadas pelo contexto.
- Em "Cronograma", não invente datas. Use fases ou referências existentes no contexto; se não houver prazo, indique que será definido após validação final do escopo.
- Em "Condições Comerciais", não invente preço ou forma de pagamento; utilize apenas condições explicitamente presentes no contexto.
- Retorne exatamente as 10 seções solicitadas e um resumo executivo.

CONTEXTO:
${safeJson(context)}`;

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["summary", "sections"],
    properties: {
      summary: { type: "string" },
      sections: {
        type: "array",
        minItems: 10,
        maxItems: 10,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["key", "title", "content"],
          properties: {
            key: { type: "string", enum: [...SECTION_KEYS] },
            title: { type: "string" },
            content: { type: "string" },
          },
        },
      },
    },
  };

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        input: prompt,
        text: { format: { type: "json_schema", name: "algenri_commercial_proposal", strict: true, schema } },
      }),
    });
  } catch (error) {
    console.error("Proposal AI network request failed", error);
    throw new Error("ai_provider_unreachable");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const diagnostic = classifyProviderFailure(response.status, payload);
    console.error("Proposal AI request failed", {
      status: response.status,
      providerType: payload?.error?.type,
      providerCode: payload?.error?.code,
      providerMessage: payload?.error?.message,
      diagnostic,
      model,
    });
    throw new Error(diagnostic);
  }

  const outputText = extractOutputText(payload);
  if (!outputText) throw new Error("ai_empty_response");

  let draft: AiDraft;
  try { draft = JSON.parse(outputText) as AiDraft; } catch { throw new Error("ai_invalid_response"); }
  const byKey = new Map(draft.sections.map((section) => [section.key, section]));
  const sections: ProposalSection[] = proposal.sections.map((section, order) => {
    const generated = byKey.get(section.key);
    if (!generated) return section;
    return { ...section, title: generated.title.trim() || section.title, content: generated.content.trim(), source: "ai", order };
  });

  const updated = await applyAiProposalDraft(proposal.id, { summary: draft.summary.trim(), sections, model, source: resolvedSource }, input.updatedBy);
  return { proposal: updated, model, source: resolvedSource };
}
