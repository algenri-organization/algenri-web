export type StudioCapability =
  | "video"
  | "image"
  | "avatar"
  | "voice"
  | "lip-sync"
  | "editing"
  | "composition"
  | "design"
  | "multimodel"
  | "intelligence";

export type StudioProviderLayer =
  | "generation"
  | "avatar-voice"
  | "composition"
  | "design-finish"
  | "gateway"
  | "intelligence";

export type StudioProvider = {
  id: string;
  name: string;
  layer: StudioProviderLayer;
  phase: 1 | 2 | 3 | 4;
  status: "planned" | "priority" | "connected" | "support";
  capabilities: StudioCapability[];
  role: string;
  integrationMode: "api" | "sdk" | "mcp" | "workflow" | "manual-assisted";
  costControl: string;
};

export const providerLayerLabels: Record<StudioProviderLayer, string> = {
  generation: "Motores de geração",
  "avatar-voice": "Avatar & voz",
  composition: "Montagem & renderização",
  "design-finish": "Design & acabamento",
  gateway: "Gateways / multimodelo",
  intelligence: "Inteligência & benchmark",
};

export const studioProviders: StudioProvider[] = [
  {
    id: "runway",
    name: "Runway",
    layer: "generation",
    phase: 2,
    status: "priority",
    capabilities: ["video", "image", "editing", "voice"],
    role: "Motor principal para cenas cinematográficas, geração por imagem/texto, edição visual e workflows multimodais.",
    integrationMode: "api",
    costControl: "Usar estimativa, keyframes e clipes curtos antes do render final; registrar créditos por tarefa.",
  },
  {
    id: "higgsfield",
    name: "Higgsfield",
    layer: "generation",
    phase: 2,
    status: "priority",
    capabilities: ["video", "image", "editing"],
    role: "Motor criativo alternativo com foco em linguagem visual e cinematográfica, para comparação direta com Runway.",
    integrationMode: "api",
    costControl: "Entrar com benchmark controlado de cenas equivalentes antes de aumentar o uso por projeto.",
  },
  {
    id: "heygen",
    name: "HeyGen",
    layer: "avatar-voice",
    phase: 2,
    status: "priority",
    capabilities: ["video", "avatar", "voice", "lip-sync"],
    role: "Especialista em avatar, presenter, voz e lip sync quando o formato exigir uma pessoa em cena.",
    integrationMode: "api",
    costControl: "Validar avatar, look, cenário, voz e pronúncia antes do render completo; evitar regeneração integral.",
  },
  {
    id: "hyperframes",
    name: "HyperFrames by HeyGen",
    layer: "avatar-voice",
    phase: 3,
    status: "planned",
    capabilities: ["video", "avatar", "editing"],
    role: "Recurso complementar do ecossistema HeyGen para fluxos avançados e consistência visual quando trouxer ganho real.",
    integrationMode: "workflow",
    costControl: "Ativar somente após comprovar vantagem de qualidade/custo sobre o fluxo principal.",
  },
  {
    id: "remotion",
    name: "Remotion",
    layer: "composition",
    phase: 2,
    status: "priority",
    capabilities: ["video", "composition", "editing"],
    role: "Montagem programática de cenas, legendas, logos, transições, versões e formatos sem regerar IA desnecessariamente.",
    integrationMode: "sdk",
    costControl: "Priorizar composição local/programática para reaproveitar assets aprovados e reduzir novas gerações pagas.",
  },
  {
    id: "canva",
    name: "Canva",
    layer: "design-finish",
    phase: 3,
    status: "support",
    capabilities: ["design", "video", "image", "editing"],
    role: "Acabamento, branded content, templates e derivações de formatos para peças já produzidas pelo Studio.",
    integrationMode: "api",
    costControl: "Usar como camada de acabamento e template, evitando deslocar geração cara para tarefas simples de design.",
  },
  {
    id: "kie-ai",
    name: "Kie.ai",
    layer: "gateway",
    phase: 3,
    status: "planned",
    capabilities: ["video", "image", "multimodel"],
    role: "Gateway adicional para acessar múltiplos motores e criar alternativas de custo, disponibilidade e qualidade.",
    integrationMode: "api",
    costControl: "Só promover motores após benchmark de custo, estabilidade e aderência ao fluxo do Studio.",
  },
  {
    id: "vidiq",
    name: "vidIQ",
    layer: "intelligence",
    phase: 4,
    status: "support",
    capabilities: ["intelligence"],
    role: "Apoio de inteligência para YouTube, pauta e performance. Não é motor de criação e não substitui o módulo Marketing.",
    integrationMode: "manual-assisted",
    costControl: "Usar somente quando houver ganho de inteligência de conteúdo; manter separado do custo de geração multimodal.",
  },
];

export const productionStages = [
  "Briefing",
  "Conceito & roteiro",
  "Storyboard",
  "Assets & identidade",
  "Voz & pronúncia",
  "Estimativa de custo",
  "Preview / keyframe",
  "Geração por cenas",
  "Revisão & versões",
  "Entrega",
] as const;
