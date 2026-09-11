import "server-only";

import { getClient, getProject } from "@/lib/client-flow/store";
import { getCommercialProposal } from "@/lib/proposals/store";
import { getContract } from "@/lib/contracts/store";
import { saveStudioContinuity } from "@/lib/studio/continuity-store";
import { applyStudioAiStoryboard, getStudioProject, markStudioAiStoryboardFailure, updateStudioStoryboardScene, type StudioStoryboardScene } from "@/lib/studio/project-store";

function extractOutputText(payload: any) {
  for (const item of payload?.output ?? []) for (const content of item?.content ?? []) if (content?.type === "output_text" && typeof content.text === "string") return content.text;
  return "";
}
function getModel() { return process.env.OPENAI_STUDIO_MODEL || process.env.OPENAI_PROPOSAL_MODEL || "gpt-5.6-luna"; }
async function callStudioAi(input: string, schema: Record<string, unknown>, schemaName: string) {
  const apiKey = process.env.OPENAI_API_KEY; if (!apiKey) throw new Error("ai_not_configured");
  const model = getModel();
  const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, input, text: { format: { type: "json_schema", name: schemaName, strict: true, schema } } }) });
  const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(`ai_provider_${response.status}`);
  const text = extractOutputText(payload); if (!text) throw new Error("ai_empty_response"); return { parsed: JSON.parse(text), model };
}
async function commercialContext(project: any) {
  const link = project.commercialLink ?? { origin: "internal" };
  const [client, commercialProject, proposal, contract] = await Promise.all([link.clientId ? getClient(link.clientId) : null, link.commercialProjectId ? getProject(link.commercialProjectId) : null, link.proposalId ? getCommercialProposal(link.proposalId) : null, link.contractId ? getContract(link.contractId) : null]);
  return {
    client: client ? { name: client.tradeName || client.legalName, segment: client.segment, website: client.website, notes: client.notes } : null,
    project: commercialProject ? { name: commercialProject.name, type: commercialProject.projectType, description: commercialProject.description, notes: commercialProject.notes, status: commercialProject.status } : null,
    proposal: proposal ? { number: proposal.proposalNumber, title: proposal.title, summary: proposal.summary, status: proposal.status, sections: proposal.sections.map((s:any)=>({ title:s.title, content:s.content })) } : null,
    contract: contract ? { number: contract.contractNumber, title: contract.title, status: contract.status, notes: contract.notes } : null,
  };
}

const continuitySchema = { type: "object", additionalProperties: false, required: ["characters","environment","wardrobe","visualRules"], properties: { characters: { type: "string" }, environment: { type: "string" }, wardrobe: { type: "string" }, visualRules: { type: "string" } } };
const sceneProperties = {
  title: { type: "string" }, durationSeconds: { type: "integer", minimum: 1, maximum: 30 }, objective: { type: "string" }, narration: { type: "string" }, visualDirection: { type: "string" }, technicalPrompt: { type: "string" }, continuityNotes: { type: "string" }, transitionFromPrevious: { type: "string" },
};

function continuityMode(briefing: any, existing: any) {
  if (existing?.mode === "independent" || existing?.mode === "strict") return existing.mode;
  if (briefing?.peopleMode === "recurring") return "strict" as const;
  const text = `${briefing?.visualStyle || ""} ${briefing?.requiredScenes || ""}`.toLowerCase();
  return /(cinemat|realist|pessoa|people|personagem|ator|atriz|humano|human)/.test(text) ? "strict" as const : "coherent" as const;
}
function preserveExplicitContinuity(existing:any, generated:any){
  return {
    characters:String(existing?.characters||"").trim()||generated.characters,
    environment:String(existing?.environment||"").trim()||generated.environment,
    wardrobe:String(existing?.wardrobe||"").trim()||generated.wardrobe,
    visualRules:String(existing?.visualRules||"").trim()||generated.visualRules,
  };
}

export async function generateStudioStoryboardWithAi(projectId: string) {
  const project = await getStudioProject(projectId); if (!project) throw new Error("studio_project_not_found");
  const briefing = project.briefing; if (!briefing) throw new Error("studio_briefing_not_found");
  const existingContinuity = project.continuity ?? null;
  const visualBible = project.visualBible ?? null;
  const context = { studioProject: { name: project.name, origin: project.commercialLink?.origin ?? "internal" }, briefing, commercial: await commercialContext(project), existingContinuity, visualBible };
  const maxScenes = briefing.durationSeconds <= 12 ? 3 : briefing.durationSeconds <= 35 ? 5 : briefing.durationSeconds <= 70 ? 7 : 9;
  const schema = { type: "object", additionalProperties: false, required: ["continuityBible","scenes"], properties: { continuityBible: continuitySchema, scenes: { type: "array", minItems: 2, maxItems: maxScenes, items: { type: "object", additionalProperties: false, required: ["title","durationSeconds","objective","narration","visualDirection","technicalPrompt","continuityNotes","transitionFromPrevious"], properties: sceneProperties } } } };
  const prompt = `Você é diretor criativo e supervisor de continuidade do ALGENRI Studio. Crie um storyboard profissional em português do Brasil pronto para geração multimotor por cena.\n\nREGRAS PRINCIPAIS:\n- Use apenas fatos do contexto; não invente promessas ou dados do cliente.\n- A soma das durações deve ser exatamente ${briefing.durationSeconds} segundos.\n- Respeite destino ${briefing.destination}, proporção ${briefing.aspectRatio}, estilo ${briefing.visualStyle} e público ${briefing.audience}.\n- peopleMode=${briefing.peopleMode || "generic"}: se for none, não introduza pessoas; se for generic, pessoas podem variar; se for recurring, trate a pessoa principal como a MESMA identidade ao longo das cenas.\n- Qualquer campo já preenchido em existingContinuity foi definido pelo usuário e deve ser tratado como restrição obrigatória, não como sugestão.\n- visualBible contém personagens e ambientes estruturados; todo item com locked=true é uma restrição fixa. Não mude, duplique, substitua ou misture esses itens.\n- Logos, nomes de marca, slogans, títulos, CTAs e qualquer texto legível ficam SEMPRE para composição posterior controlada.\n- Crie UMA continuityBible para o vídeo inteiro antes das cenas.\n- Em vídeos cinematográficos com pessoas reais, defina protagonista(s) recorrentes de forma visualmente consistente: faixa etária aparente, cabelo, traços visuais não sensíveis, figurino, acessórios, linguagem corporal. Não altere identidade entre cenas salvo se o roteiro exigir personagem diferente.\n- Nunca duplique a mesma pessoa para preencher uma cena. Personagens secundários devem ser visualmente distintos do protagonista.\n- Mantenha ambiente, arquitetura, paleta, hora do dia, direção de luz, lentes e linguagem de câmera coerentes. Mudanças de local ou personagem devem ser intencionais e explicadas em transitionFromPrevious.\n- Cada technicalPrompt deve REPETIR os principais âncoras da continuityBible e da visualBible necessários para impedir que o motor invente outra pessoa ou outro ambiente.\n- Cada continuityNotes deve dizer exatamente o que precisa permanecer igual à cena anterior.\n- transitionFromPrevious deve definir a passagem visual/narrativa da cena anterior; na primeira cena use "Abertura".\n- Se houver roteiro manual, preserve a mensagem e distribua a locução sem repetição.\n- Nenhum technicalPrompt pode pedir logo, texto, tipografia ou marca d'água. Inclua explicitamente sem logos, sem texto legível, sem marcas d'água e sem símbolos corporativos inventados.\n- Crie abertura forte, desenvolvimento lógico e encerramento claro.\n- Não ultrapasse ${maxScenes} cenas.\n\nCONTEXTO:\n${JSON.stringify(context)}`;
  try {
    const { parsed, model } = await callStudioAi(prompt, schema, "algenri_studio_storyboard_continuity");
    const result = parsed as { continuityBible: { characters:string; environment:string; wardrobe:string; visualRules:string }; scenes: any[] };
    const continuityBible = preserveExplicitContinuity(existingContinuity, result.continuityBible);
    const scenes = result.scenes.map((scene, index) => ({ ...scene, index: index + 1, status: "draft" as const })) as any[];
    const total = scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0); if (total !== briefing.durationSeconds) throw new Error("ai_invalid_duration_sum");
    await applyStudioAiStoryboard(projectId, scenes as StudioStoryboardScene[], model);
    await saveStudioContinuity(projectId, { mode: continuityMode(briefing, existingContinuity), ...continuityBible });
    return { storyboard: scenes, continuity: continuityBible, model };
  } catch (error) {
    const code = error instanceof Error ? error.message : "ai_generation_failed"; await markStudioAiStoryboardFailure(projectId, code); throw error;
  }
}

export async function regenerateStudioSceneWithAi(projectId: string, sceneIndex: number, instructions?: string) {
  const project = await getStudioProject(projectId); if (!project) throw new Error("studio_project_not_found");
  const storyboard = Array.isArray(project.storyboard) ? project.storyboard as any[] : []; const current = storyboard.find(scene => scene.index === sceneIndex); if (!current) throw new Error("studio_scene_not_found");
  const previous = storyboard.find(scene => scene.index === sceneIndex - 1) ?? null; const next = storyboard.find(scene => scene.index === sceneIndex + 1) ?? null;
  const context = { project: { name: project.name, briefing: project.briefing, commercial: await commercialContext(project) }, continuityBible: project.continuity ?? null, visualBible: project.visualBible ?? null, previousScene: previous, currentScene: current, nextScene: next, userInstructions: instructions?.trim() || "Melhore a cena sem quebrar a continuidade do vídeo." };
  const schema = { type: "object", additionalProperties: false, required: ["title","durationSeconds","objective","narration","visualDirection","technicalPrompt","continuityNotes","transitionFromPrevious"], properties: { ...sceneProperties, durationSeconds: { type: "integer", const: current.durationSeconds } } };
  const prompt = `Você é diretor criativo e supervisor de continuidade do ALGENRI Studio. Reescreva SOMENTE a cena ${sceneIndex}, preservando exatamente ${current.durationSeconds} segundos. A personagem, ambiente, figurino, iluminação e linguagem de câmera devem permanecer compatíveis com a continuityBible, a visualBible e as cenas anterior e posterior. Itens da visualBible com locked=true são imutáveis. Não invente outra pessoa quando a narrativa pede a mesma protagonista e nunca duplique a protagonista para preencher a cena. transitionFromPrevious deve explicar a passagem; continuityNotes deve listar os elementos que não podem mudar. Logos, nomes, CTAs e textos legíveis ficam para composição posterior. O technicalPrompt deve repetir os âncoras de continuidade e proibir logos, texto, marcas d'água e símbolos corporativos inventados.\n\nCONTEXTO:\n${JSON.stringify(context)}`;
  const { parsed, model } = await callStudioAi(prompt, schema, "algenri_studio_scene_continuity");
  const regenerated = { ...(parsed as any), index: sceneIndex, status: "draft" as const };
  await updateStudioStoryboardScene(projectId, sceneIndex, regenerated);
  return { scene: regenerated, model };
}
