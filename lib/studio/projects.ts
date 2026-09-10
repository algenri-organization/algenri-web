export type StudioProjectStatus = "draft" | "planning" | "generating" | "review" | "approved" | "archived";

export type StudioProjectFormat = "video" | "image" | "avatar" | "voice" | "mixed";

export type StudioCreationMode = "quick" | "advanced";
export type StudioScriptMode = "ai" | "manual";
export type StudioEngineMode = "automatic" | "manual";
export type StudioPriority = "quality" | "cost" | "speed" | "balanced";
export type StudioAspectRatio = "16:9" | "9:16" | "1:1" | "4:5";

export type StudioVideoBriefing = {
  creationMode: StudioCreationMode;
  objective: string;
  audience: string;
  destination: string;
  durationSeconds: number;
  centralIdea: string;
  scriptMode: StudioScriptMode;
  script?: string;
  visualStyle: string;
  aspectRatio: StudioAspectRatio;
  useBrandIdentity: boolean;
  useAvatar: boolean;
  avatarId?: string;
  useVoice: boolean;
  voiceId?: string;
  pronunciationNotes?: string;
  requiredScenes?: string;
  requiredOnScreenText?: string;
  prohibitedElements?: string;
  referenceNotes?: string;
  priority: StudioPriority;
  engineMode: StudioEngineMode;
  manualEngineId?: string;
  budgetLimit?: number;
};

export type StudioProject = {
  id: string;
  name: string;
  objective: string;
  format: StudioProjectFormat;
  destination: string;
  audience: string;
  durationSeconds?: number;
  status: StudioProjectStatus;
  budgetLimit?: number;
  preferredProviderIds?: string[];
  videoBriefing?: StudioVideoBriefing;
  createdAt: string;
  updatedAt: string;
};

export const studioProjectStatusLabel: Record<StudioProjectStatus, string> = {
  draft: "Rascunho",
  planning: "Planejamento",
  generating: "Em geração",
  review: "Em revisão",
  approved: "Aprovado",
  archived: "Arquivado",
};

export const studioProjectFormats: { value: StudioProjectFormat; label: string; detail: string }[] = [
  { value: "video", label: "Vídeo", detail: "Produção por cenas, com roteiro, storyboard e versões." },
  { value: "image", label: "Imagem", detail: "Keyframes, campanhas, referências e assets visuais." },
  { value: "avatar", label: "Avatar", detail: "Apresentador autorizado, look, cenário e consistência." },
  { value: "voice", label: "Voz", detail: "Narração, emoção, velocidade e pronúncia controlada." },
  { value: "mixed", label: "Multimodal", detail: "Combina vídeo, imagem, avatar, voz e outros assets." },
];

export const studioDestinations = ["Instagram Reels", "Instagram Story", "YouTube", "Site", "Apresentação", "Anúncio", "Institucional", "Outro"] as const;

export const studioVisualStyles = ["Cinematográfico", "Tecnológico", "Corporativo premium", "Minimalista", "Humano e emocional", "Futurista", "Editorial", "Personalizado"] as const;
