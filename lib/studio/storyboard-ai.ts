import "server-only";

import { getClient, getProject } from "@/lib/client-flow/store";
import { getCommercialProposal } from "@/lib/proposals/store";
import { getContract } from "@/lib/contracts/store";
import { applyStudioAiStoryboard, getStudioProject, markStudioAiStoryboardFailure, updateStudioStoryboardScene, type StudioStoryboardScene } from "@/lib/studio/project-store";

function extractOutputText(payload: any) {
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return "";
}

function getModel() {
  return process.env.OPENAI_STUDIO_MODEL || process.env.OPENAI_PROPOSAL_MODEL || "gpt-5.6-luna";
}

async function callStudioAi(input: string, schema: Record<string, unknown>, schemaName: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("ai_not_configured");
  const model = getModel();
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, input, text: { format: { type: "json_schema", name: schemaName, strict: true, schema } } }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`ai_provider_${response.status}`);
  const text = extractOutputText(payload);
  if (!text) throw new Error("ai_empty_response");
  return { parsed: JSON.parse(text), model };
}

async function commercialContext(project: any) {
  const link = project.commercialLink ?? { origin: "internal" };
  const [client, commercialProject, proposal, contract] = await Promise.all([
    link.clientId ? getClient(link.clientId) : null,
    link.commercialProjectId ? getProject(link.commercialProjectId) : null,
    link.proposalId ? getCommercialProposal(link.proposalId) : null,
    link.contractId ? getContract(link.contractId) : null,
  ]);
  return {
    client: client ? { name: client.tradeName || client.legalName, segment: client.segment, website: client.website, notes: client.notes } : null,
    project: commercialProject ? { name: commercialProject.name, type: commercialProject.projectType, description: commercialProject.description, notes: commercialProject.notes, status: commercialProject.status } : null,
    proposal: proposal ? { number: proposal.proposalNumber, title: proposal.title, summary: proposal.summary, status: proposal.status, sections: proposal.sections.map((s:any)=>({ title:s.title, content:s.content })) } : null,
    contract: contract ? { number: contract.contractNumber, title: contract.title, status: contract.status, notes: contract.notes } : null,
  };
}

export async function generateStudioStoryboardWithAi(projectId: string) {
  const project = await getStudioProject(projectId);
  if (!project) throw new Error("studio_project_not_found");
  const briefing = project.briefing;
  if (!briefing) throw new Error("studio_briefing_not_found");

  const context = {
    studioProject: { name: project.name, origin: project.commercialLink?.origin ?? "internal" },
    briefing,
    commercial: await commercialContext(project),
    brand: { name: "ALGENRI", slogan: "Tecnologia que impulsiona o seu amanhã.", positioning: "Soluções digitais, tecnologia, IA e automação com padrão premium e foco em resultado." },
  };

  const maxScenes = briefing.durationSeconds <= 12 ? 3 : briefing.durationSeconds <= 35 ? 5 : briefing.durationSeconds <= 70 ? 7 : 9;
  const schema = {
    type: "object", additionalProperties: false, required: ["scenes"], properties: {
      scenes: { type: "array", minItems: 2, maxItems: maxScenes, items: { type: "object", additionalProperties: false, required: ["title","durationSeconds","objective","narration","visualDirection","technicalPrompt"], properties: { title: { type: "string" }, durationSeconds: { type: "integer", minimum: 1, maximum: 30 }, objective: { type: "string" }, narration: { type: "string" }, visualDirection: { type: "string" }, technicalPrompt: { type: "string" } } } }
    }
  };

  const prompt = `Você é o diretor criativo e roteirista técnico do ALGENRI Studio. Crie um storyboard profissional em português do Brasil, pronto para futura geração multimotor por cena.\n\nREGRAS:\n- Use apenas fatos do contexto. Não invente informações comerciais, promessas, funcionalidades ou dados do cliente.\n- A soma das durações deve ser exatamente ${briefing.durationSeconds} segundos.\n- Respeite destino ${briefing.destination}, proporção ${briefing.aspectRatio}, estilo ${briefing.visualStyle} e público ${briefing.audience}.\n- Se houver roteiro manual, preserve a mensagem e distribua a locução pelas cenas sem repetição.\n- Se houver identidade de marca, reserve textos/logos para composição controlada; não dependa de texto perfeito gerado dentro do vídeo.\n- Se houver pronúncia especial, respeite-a na locução.\n- Cada technicalPrompt deve descrever enquadramento, câmera, iluminação, ambiente, ação, consistência e elementos proibidos.\n- Crie abertura forte, desenvolvimento lógico e encerramento claro.\n- Não ultrapasse ${maxScenes} cenas.\n\nCONTEXTO:\n${JSON.stringify(context)}`;

  try {
    const { parsed, model } = await callStudioAi(prompt, schema, "algenri_studio_storyboard");
    const scenes = (parsed as { scenes: Omit<StudioStoryboardScene,"index"|"status">[] }).scenes.map((scene, index) => ({ ...scene, index: index + 1, status: "draft" as const }));
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

export async function regenerateStudioSceneWithAi(projectId: string, sceneIndex: number, instructions?: string) {
  const project = await getStudioProject(projectId);
  if (!project) throw new Error("studio_project_not_found");
  const storyboard = Array.isArray(project.storyboard) ? project.storyboard as StudioStoryboardScene[] : [];
  const current = storyboard.find(scene => scene.index === sceneIndex);
  if (!current) throw new Error("studio_scene_not_found");
  const context = {
    project: { name: project.name, briefing: project.briefing, commercial: await commercialContext(project) },
    fullStoryboard: storyboard,
    currentScene: current,
    userInstructions: instructions?.trim() || "Melhore a cena mantendo coerência com o storyboard e o tempo disponível.",
  };
  const schema = { type: "object", additionalProperties: false, required: ["title","durationSeconds","objective","narration","visualDirection","technicalPrompt"], properties: { title: { type: "string" }, durationSeconds: { type: "integer", const: current.durationSeconds }, objective: { type: "string" }, narration: { type: "string" }, visualDirection: { type: "string" }, technicalPrompt: { type: "string" } } };
  const prompt = `Você é o diretor criativo do ALGENRI Studio. Reescreva SOMENTE a cena ${sceneIndex}, preservando exatamente ${current.durationSeconds} segundos e a continuidade com as cenas anterior e posterior. Não altere fatos comerciais. Não dependa de texto perfeito dentro do vídeo; reserve logos e textos para composição controlada. Respeite pronúncias e restrições do briefing.\n\nCONTEXTO:\n${JSON.stringify(context)}`;
  const { parsed, model } = await callStudioAi(prompt, schema, "algenri_studio_scene");
  const regenerated = { ...(parsed as Omit<StudioStoryboardScene,"index"|"status">), index: sceneIndex, status: "draft" as const };
  await updateStudioStoryboardScene(projectId, sceneIndex, regenerated);
  return { scene: regenerated, model };
}
