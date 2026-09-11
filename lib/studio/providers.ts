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
  | "intelligence"
  | "audio";

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
  selectable?: boolean;
};

export type StudioEngineMode = "automatic" | "manual";

export type StudioRoutingCriteria = {
  quality: number;
  cost: number;
  duration: number;
  avatar: number;
  audio: number;
  consistency: number;
  videoType: number;
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
  { id:"runway", name:"Runway", layer:"generation", phase:2, status:"priority", capabilities:["video","image","editing","voice","audio"], role:"Motor principal para cenas cinematográficas, geração por imagem/texto, edição visual e workflows multimodais.", integrationMode:"api", costControl:"Usar estimativa, keyframes e clipes curtos antes do render final; registrar créditos por tarefa.", selectable:true },
  { id:"higgsfield", name:"Higgsfield", layer:"generation", phase:2, status:"priority", capabilities:["video","image","editing"], role:"Motor criativo alternativo com foco em linguagem visual e cinematográfica, para comparação direta com Runway.", integrationMode:"api", costControl:"Entrar com benchmark controlado de cenas equivalentes antes de aumentar o uso por projeto.", selectable:true },
  { id:"veo", name:"Veo", layer:"generation", phase:3, status:"planned", capabilities:["video","audio"], role:"Motor premium para vídeo generativo com foco em qualidade visual, direção cinematográfica e cenas complexas.", integrationMode:"api", costControl:"Reservar para cenas em que o ganho de qualidade justificar custo superior ou maior latência.", selectable:true },
  { id:"luma", name:"Luma", layer:"generation", phase:3, status:"planned", capabilities:["video","image"], role:"Alternativa para geração visual e image-to-video, útil no roteamento automático por custo e estilo.", integrationMode:"api", costControl:"Comparar custo por segundo e taxa de aprovação de cena antes de promover no roteamento automático.", selectable:true },
  { id:"seedance", name:"Seedance", layer:"generation", phase:3, status:"planned", capabilities:["video","image"], role:"Motor adicional para cenas generativas e consistência, sujeito a benchmark de disponibilidade e integração.", integrationMode:"api", costControl:"Entrar primeiro por testes equivalentes de cena e somente depois receber peso no modo automático.", selectable:true },
  { id:"kling", name:"Kling", layer:"generation", phase:3, status:"planned", capabilities:["video","image"], role:"Motor alternativo para geração de vídeo e image-to-video, com potencial para cenas realistas e movimentos complexos.", integrationMode:"api", costControl:"Usar benchmark por duração, aderência e consistência antes de selecionar automaticamente.", selectable:true },
  { id:"heygen", name:"HeyGen", layer:"avatar-voice", phase:2, status:"priority", capabilities:["video","avatar","voice","lip-sync","audio"], role:"Especialista em avatar, presenter, voz e lip sync quando o formato exigir uma pessoa em cena.", integrationMode:"api", costControl:"Validar avatar, look, cenário, voz e pronúncia antes do render completo; evitar regeneração integral.", selectable:true },
  { id:"elevenlabs", name:"ElevenLabs", layer:"avatar-voice", phase:2, status:"priority", capabilities:["voice","audio"], role:"Motor dedicado de voz neural para narração natural, controle de interpretação, velocidade, similaridade e dicionários de pronúncia.", integrationMode:"api", costControl:"Gerar prévias curtas antes da locução completa e versionar a voz aprovada sem regenerar vídeo." },
  { id:"minimax-audio", name:"MiniMax Audio", layer:"avatar-voice", phase:2, status:"priority", capabilities:["voice","audio"], role:"Motor alternativo de voz com TTS expressivo, emoções, velocidade, pitch e suporte a vozes clonadas, para benchmark direto com ElevenLabs.", integrationMode:"api", costControl:"Usar prévias curtas e modelo Turbo nos testes; promover HD somente para a versão de qualidade aprovada." },
  { id:"hyperframes", name:"HyperFrames by HeyGen", layer:"avatar-voice", phase:3, status:"planned", capabilities:["video","avatar","editing"], role:"Recurso complementar do ecossistema HeyGen para fluxos avançados e consistência visual quando trouxer ganho real.", integrationMode:"workflow", costControl:"Ativar somente após comprovar vantagem de qualidade/custo sobre o fluxo principal." },
  { id:"grok-kie", name:"Grok via Kie.ai", layer:"gateway", phase:3, status:"planned", capabilities:["video","image","multimodel"], role:"Acesso a modelos disponibilizados via Kie.ai, tratado como opção de motor quando houver suporte e vantagem operacional.", integrationMode:"api", costControl:"Comparar preço, disponibilidade e limites do gateway antes de usar em produção.", selectable:true },
  { id:"kie-ai", name:"Kie.ai", layer:"gateway", phase:2, status:"priority", capabilities:["video","image","audio","multimodel"], role:"Gateway multimodelo para ampliar rapidamente a cobertura do Studio com uma API unificada e consulta de saldo, permitindo priorizar créditos disponíveis e opções de menor custo.", integrationMode:"api", costControl:"Consultar saldo antes da geração, usar créditos de teste quando disponíveis e promover cada modelo ao roteamento automático somente após benchmark de custo, estabilidade e qualidade.", selectable:true },
  { id:"remotion", name:"Remotion", layer:"composition", phase:2, status:"priority", capabilities:["video","composition","editing"], role:"Montagem programática de cenas, legendas, logos, transições, versões e formatos sem regerar IA desnecessariamente.", integrationMode:"sdk", costControl:"Priorizar composição local/programática para reaproveitar assets aprovados e reduzir novas gerações pagas." },
  { id:"canva", name:"Canva", layer:"design-finish", phase:3, status:"support", capabilities:["design","video","image","editing"], role:"Acabamento, branded content, templates e derivações de formatos para peças já produzidas pelo Studio.", integrationMode:"api", costControl:"Usar como camada de acabamento e template, evitando deslocar geração cara para tarefas simples de design." },
  { id:"vidiq", name:"vidIQ", layer:"intelligence", phase:4, status:"support", capabilities:["intelligence"], role:"Apoio de inteligência para YouTube, pauta e performance. Não é motor de criação e não substitui o módulo Marketing.", integrationMode:"manual-assisted", costControl:"Usar somente quando houver ganho de inteligência de conteúdo; manter separado do custo de geração multimodal." },
];

export const manualStudioEngines = studioProviders.filter((provider) => provider.selectable);

export const automaticRoutingCriteria = [
  { key: "quality", label: "Qualidade", detail: "Aderência visual e taxa histórica de aprovação." },
  { key: "cost", label: "Custo", detail: "Créditos, custo estimado e teto disponível no projeto." },
  { key: "duration", label: "Duração", detail: "Compatibilidade do motor com o tempo e número de cenas." },
  { key: "avatar", label: "Avatar", detail: "Necessidade de presenter, clone autorizado ou lip sync." },
  { key: "audio", label: "Áudio", detail: "Narração, fala sincronizada, efeitos ou áudio nativo." },
  { key: "consistency", label: "Consistência", detail: "Capacidade de manter personagem, ambiente e identidade entre cenas." },
  { key: "videoType", label: "Tipo do vídeo", detail: "Institucional, cinematográfico, social, produto, avatar ou híbrido." },
] as const;

export const productionStages = [
  "Briefing", "Conceito & roteiro", "Storyboard", "Assets & identidade", "Voz & pronúncia", "Escolha do motor", "Estimativa de custo", "Preview / keyframe", "Geração por cenas", "Revisão & versões", "Entrega",
] as const;
