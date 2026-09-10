export type StudioProjectStatus = "draft" | "planning" | "generating" | "review" | "approved" | "archived";

export type StudioProjectFormat = "video" | "image" | "avatar" | "voice" | "mixed";

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
