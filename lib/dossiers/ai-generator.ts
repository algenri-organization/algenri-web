import { getClient, getProject } from "@/lib/client-flow/store";
import { getProjectDossier, applyAiDossierDraft, type DossierSection } from "@/lib/dossiers/store";

const SECTION_KEYS = [
  "executive_summary",
  "client_context",
  "project_objectives",
  "identified_needs",
  "recommended_scope",
  "features",
  "integrations",
  "required_materials",
  "pending_decisions",
  "risks",
  "algenri_recommendations",
  "preliminary_schedule",
  "next_steps",
] as const;

type AiDraft = { sections: Array<{ key: string; title: string; content: string }> };

function safeJson(value: unknown) {
  try { return JSON.stringify(value); } catch { return "{}"; }
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
  if (joined.includes("insufficient_quota") || joined.includes("billing") || joined.includes("quota") || joined.includes("credit balance")) return "ai_insufficient_quota";
  if (status === 401 || joined.includes("invalid_api_key") || joined.includes("incorrect api key") || joined.includes("authentication")) return "ai_invalid_credentials";
  if (status === 429 || joined.includes("rate_limit") || joined.includes("rate limit")) return "ai_rate_limited";
  if (status === 404 || joined.includes("model_not_found") || joined.includes("does not exist") || (joined.includes("model") && joined.includes("access"))) return "ai_model_unavailable";
  if (status >= 500) return "ai_provider_unavailable";
  if (status === 400 && (joined.includes("json_schema") || joined.includes("schema") || joined.includes("response_format"))) return "ai_schema_rejected";
  return "ai_generation_failed";
}

function briefingRows(dossier: Awaited<ReturnType<typeof getProjectDossier>>) {
  if (!dossier) return [];
  const sections = Array.isArray(dossier.sourceSnapshot.sections) ? dossier.sourceSnapshot.sections as any[] : [];
  const answers = dossier.sourceSnapshot.answers ?? {};
  return sections.flatMap((section: any) => (section?.questions ?? []).map((question: any) => ({
    section: String(section?.title ?? ""),
    question: String(question?.label ?? ""),
    answer: answers[String(question?.id ?? "")] ?? null,
  })));
}

export async function generateDossierWithAi(input: { dossierId: string; instructions?: string; updatedBy: string }) {
  const dossier = await getProjectDossier(input.dossierId);
  if (!dossier) throw new Error("dossier_not_found");
  if (dossier.status === "finalized" || dossier.status === "archived") throw new Error("dossier_locked");

  const [project, client] = await Promise.all([getProject(dossier.projectId), getClient(dossier.clientId)]);
  if (!project || !client) throw new Error("dossier_context_not_found");

  const context = {
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
    briefing: {
      template: dossier.sourceSnapshot.templateName,
      version: dossier.sourceSnapshot.templateVersion,
      answers: briefingRows(dossier),
    },
    currentDossier: dossier.sections.map(section => ({ key: section.key, title: section.title, content: section.content })),
    additionalInstructions: input.instructions?.trim() || "",
  };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("ai_not_configured");
  const model = process.env.OPENAI_DOSSIER_MODEL || process.env.OPENAI_PROPOSAL_MODEL || "gpt-5.6-luna";

  const prompt = `Você é o analista de projetos da ALGENRI. Transforme as respostas do briefing em um dossiê técnico-comercial completo, claro e útil para a etapa seguinte de proposta comercial, em português do Brasil.\n\nREGRAS:\n- Use somente fatos existentes no contexto. Não invente funcionalidades, integrações, preços, prazos, garantias, dados jurídicos ou decisões do cliente.\n- Diferencie claramente fatos informados, necessidades inferidas com segurança e pontos que ainda dependem de validação.\n- Quando houver lacunas, registre-as em \"Decisões Pendentes\" em vez de assumir respostas.\n- O \"Escopo Recomendado\" deve traduzir necessidades do briefing em blocos de trabalho, sem extrapolar o contexto.\n- \"Funcionalidades\" deve listar somente funcionalidades sustentadas pelas respostas ou explicitamente marcadas como recomendação sujeita a validação.\n- \"Integrações e Dependências\" deve registrar sistemas, acessos, terceiros, domínios, meios de pagamento, APIs ou dependências apenas quando presentes ou claramente necessários, sinalizando confirmação quando aplicável.\n- \"Riscos e Pontos de Atenção\" deve ser objetivo e específico ao projeto.\n- \"Recomendações ALGENRI\" pode incluir recomendações profissionais derivadas do contexto, sempre identificadas como recomendação.\n- \"Cronograma Preliminar\" não pode inventar datas. Organize em fases; use prazo informado apenas se existir.\n- \"Próximos Passos\" deve preparar a transição direta para a proposta comercial.\n- Retorne exatamente as 13 seções solicitadas.\n\nCONTEXTO:\n${safeJson(context)}`;

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["sections"],
    properties: {
      sections: {
        type: "array",
        minItems: 13,
        maxItems: 13,
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
        text: { format: { type: "json_schema", name: "algenri_project_dossier", strict: true, schema } },
      }),
    });
  } catch (error) {
    console.error("Dossier AI network request failed", error);
    throw new Error("ai_provider_unreachable");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const diagnostic = classifyProviderFailure(response.status, payload);
    console.error("Dossier AI request failed", { status: response.status, providerType: payload?.error?.type, providerCode: payload?.error?.code, diagnostic, model });
    throw new Error(diagnostic);
  }

  const outputText = extractOutputText(payload);
  if (!outputText) throw new Error("ai_empty_response");
  let draft: AiDraft;
  try { draft = JSON.parse(outputText) as AiDraft; } catch { throw new Error("ai_invalid_response"); }

  const byKey = new Map(draft.sections.map(section => [section.key, section]));
  const sections: DossierSection[] = dossier.sections.map((section, order) => {
    const generated = byKey.get(section.key);
    if (!generated) return section;
    return { ...section, title: generated.title.trim() || section.title, content: generated.content.trim(), source: "ai", order };
  });

  const updated = await applyAiDossierDraft(dossier.id, { sections, model }, input.updatedBy);
  return { dossier: updated, model };
}
