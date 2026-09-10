export type StudioCapability = "video" | "image" | "avatar" | "voice" | "lip-sync" | "editing";

export type StudioProvider = {
  id: string;
  name: string;
  phase: 1 | 2 | 3;
  status: "planned" | "priority" | "connected";
  capabilities: StudioCapability[];
  role: string;
  costControl: string;
};

export const studioProviders: StudioProvider[] = [
  {
    id: "runway",
    name: "Runway",
    phase: 2,
    status: "priority",
    capabilities: ["video", "image", "editing"],
    role: "Cenas cinematográficas, geração e edição visual por etapas.",
    costControl: "Priorizar keyframes e trechos curtos antes do render completo.",
  },
  {
    id: "heygen",
    name: "HeyGen",
    phase: 2,
    status: "priority",
    capabilities: ["video", "avatar", "voice", "lip-sync"],
    role: "Avatares, presenters, voz e lip sync quando o formato exigir pessoa em cena.",
    costControl: "Evitar regenerar vídeos completos; validar avatar, look, cenário e voz antes do render final.",
  },
  {
    id: "kie-ai",
    name: "Kie.ai",
    phase: 3,
    status: "planned",
    capabilities: ["video", "image"],
    role: "Gateway adicional para motores criativos e alternativas de custo/qualidade.",
    costControl: "Entrará após benchmark de custo, estabilidade e aderência aos fluxos do Studio.",
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
