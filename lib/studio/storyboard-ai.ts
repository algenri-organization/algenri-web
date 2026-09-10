import "server-only";

import { getClient, getProject } from "@/lib/client-flow/store";
import { getCommercialProposal } from "@/lib/proposals/store";
import { getContract } from "@/lib/contracts/store";
import { applyStudioAiStoryboard, getStudioProject, markStudioAiStoryboardFailure, type StudioStoryboardScene } from "@/lib/studio/project-store";

function extractOutputText(payload: any) {
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return "";
}

export async function generateStudioStoryboardWithAi(projectId: string) {
  const project = await getStudioProject(projectId);
  if (!project) throw new Error("studio_project_not_found");
  const briefing = project.briefing;
  if (!briefing) throw new Error("studio_briefing_not_found");

  const link = project.commercialLink ?? { origin: "internal" };
  const [client, commercialProject, proposal, contract] = await Promise.all([
    link.clientId ? getClient(link.clientId) : null,
    link.commercialProjectId ? getProject(link.commercialProjectId) : null,
    link.proposalId ? getCommercialProposal(link.proposalId) : null,
    link.contractId ? getContract(link.contractId) : null,
  ]);

  const context = {
    studioProject: { name: project.name, origin: link.origin },
    briefing,
    commercial: {
      client: client ? { name: client.tradeName || client.legalName, segment: client.segment, website: client.website, notes: client.notes } : null,
      project: commercialProject ? { name: commercialProject.name, type: commercialProject.projectType, description: commercialProject.description, notes: commercialProject.notes, status: commercialProject.status } : null,
      proposal: proposal ? { number: proposal.proposalNumber, title: proposal.title, summary: proposal.summary, status: proposal.status, sections: proposal.sections.map((s:any)=>({ title:s.title, content:s.content })) } : null,
      contract: contract ? { number: contract.contractNumber, title: contract.title, status: contract.status, notes: contract.notes } : null,
    },
    brand: { name: "ALGENRI", slogan: "Tecnologia que impulsiona o seu amanhã.", positioning: "Soluções digitais, tecnologia, IA e automação com padrão premium e foco em resultado." },
  };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    await markStudioAiStoryboardFailure(projectId, "ai_not_configured");
    throw new Error("ai_not_configured");
  }
  const model = process.env.OPENAI_STUDIO_MODEL || process.env.OPENAI_PROPOSAL_MODEL || "gpt-5.6-luna";
  const maxScenes = briefing.durationSeconds <= 12 ? 3 : briefing.durationSeconds <= 35 ? 5 : briefing.durationSeconds <= 70 ? 7 : 9;

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["scenes"],
    properties: {
      scenes: {
        type: "array", minItems: 2, maxItems: maxScenes,
        items: {
          type: "object", additionalProperties: false,
          required: ["title","durationSeconds","objective","narration","visualDirection","technicalPrompt"],
          properties: {
            title: { type: "string" }, durationSeconds: { type: "integer", minimum: 1, maximum: 30 }, objective: { type: "string" }, narration: { type: "string" }, visualDirection: { type: "string" }, technicalPrompt: { type: "string" },
          },
        },
      },
    },
  };

  const prompt = `Você é o diretor criativo e roteirista técnico do ALGENRI Studio. Crie um storyboard profissional em português do Brasil, pronto para futura geração multimotor por cena.\n\nREGRAS:\n- Use apenas fatos do contexto. Não invente informações comerciais, promessas, funcionalidades ou dados do cliente.\n- A soma das durações deve ser exatamente ${briefing.durationSeconds} segundos.\n- Respeite destino ${briefing.destination}, proporção ${briefing.aspectRatio}, estilo ${briefing.visualStyle} e público ${briefing.audience}.\n- Se houver roteiro manual, preserve a mensagem e distribua a locução pelas cenas sem repetição.\n- Se houver identidade de marca, reserve textos/logos para composição controlada; não dependa de texto perfeito gerado dentro do vídeo.\n- Se houver pronúncia especial, respeite-a na locução.\n- Cada technicalPrompt deve descrever enquadramento, câmera, iluminação, ambiente, ação, consistência e elementos proibidos, sem citar segredos ou APIs.\n- Crie abertura forte, desenvolvimento lógico e encerramento claro.\n- Não ultrapasse ${maxScenes} cenas.\n\nCONTEXTO:\n${JSON.stringify(context)}`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, input: prompt, text: { format: { type: "json_schema", name: "algenri_studio_storyboard", strict: true, schema } } }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`ai_provider_${response.status}`);
    const text = extractOutputText(payload);
    if (!text) throw new Error("ai_empty_response");
    const parsed = JSON.parse(text) as { scenes: Omit<StudioStoryboardScene,"index"|"status">[] };
    const scenes = parsed.scenes.map((scene, index) => ({ ...scene, index: index + 1, status: "draft" as const }));
    const total = scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0);
    if (total !== briefing.durationSeconds) throw new Error("ai_invalid_duration_sum");
    await applyStudioAiStoryboard(projectId, scenes, model);
    return { storyboard: scenes, model };
  } catch (error) {
    const code = error instanceof Error ? error.message : "ai_generation_failed";
    await markStudioAiStoryboardFailure(projectId, code);
    throw error;
  }
}
