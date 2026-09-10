"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Bot, CheckCircle2, ChevronRight, Coins, Film, Gauge, ImagePlus, Loader2, Mic2, Palette, PlayCircle, ShieldCheck, SlidersHorizontal, Sparkles, Target, TriangleAlert, Type, Users, WandSparkles } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";
import { studioDestinations, studioVisualStyles, type StudioAspectRatio, type StudioCreationMode, type StudioPriority, type StudioScriptMode } from "@/lib/studio/projects";
import { manualStudioEngines, type StudioEngineMode } from "@/lib/studio/providers";

const steps = ["Ideia", "Produção", "Motor & custo", "Revisão"] as const;

export default function NewStudioProjectPage() {
  const [step, setStep] = useState(0);
  const [creationMode, setCreationMode] = useState<StudioCreationMode>("quick");
  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");
  const [objective, setObjective] = useState("");
  const [audience, setAudience] = useState("");
  const [destination, setDestination] = useState("Instagram Reels");
  const [duration, setDuration] = useState(20);
  const [scriptMode, setScriptMode] = useState<StudioScriptMode>("ai");
  const [script, setScript] = useState("");
  const [style, setStyle] = useState("Cinematográfico");
  const [ratio, setRatio] = useState<StudioAspectRatio>("9:16");
  const [brand, setBrand] = useState(true);
  const [avatar, setAvatar] = useState(false);
  const [voice, setVoice] = useState(true);
  const [pronunciation, setPronunciation] = useState("ALGENRI: AL - GEN - RI");
  const [requiredScenes, setRequiredScenes] = useState("");
  const [screenText, setScreenText] = useState("");
  const [prohibited, setProhibited] = useState("");
  const [references, setReferences] = useState("");
  const [priority, setPriority] = useState<StudioPriority>("balanced");
  const [engineMode, setEngineMode] = useState<StudioEngineMode>("automatic");
  const [manualEngine, setManualEngine] = useState(manualStudioEngines[0]?.id ?? "runway");
  const [budget, setBudget] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const quickReady = idea.trim().length >= 8;
  const advancedReady = objective.trim().length >= 5 && audience.trim().length >= 2;
  const canContinue = creationMode === "quick" ? quickReady : advancedReady;

  const projectSummary = useMemo(() => ({
    name: name || "Novo projeto de vídeo",
    idea,
    objective: objective || idea,
    audience: audience || "A definir pela IA no refinamento",
    destination,
    duration,
    scriptMode,
    style,
    ratio,
    brand,
    avatar,
    voice,
    pronunciation,
    requiredScenes,
    screenText,
    prohibited,
    references,
    priority,
    engineMode,
    manualEngine,
    budget,
  }), [name, idea, objective, audience, destination, duration, scriptMode, style, ratio, brand, avatar, voice, pronunciation, requiredScenes, screenText, prohibited, references, priority, engineMode, manualEngine, budget]);

  async function saveAndPrepareStoryboard() {
    setSaving(true);
    setSaveError("");
    try {
      const user = firebaseAuth.currentUser;
      if (!user) throw new Error("Sua sessão expirou. Entre novamente na Área Interna.");
      const token = await user.getIdToken();
      const response = await fetch("/api/internal/studio/projects", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectSummary.name,
          briefing: {
            creationMode,
            objective: projectSummary.objective,
            audience: projectSummary.audience,
            destination,
            durationSeconds: duration,
            centralIdea: idea || objective,
            scriptMode,
            ...(script.trim() ? { script: script.trim() } : {}),
            visualStyle: style,
            aspectRatio: ratio,
            useBrandIdentity: brand,
            useAvatar: avatar,
            useVoice: voice,
            ...(pronunciation.trim() ? { pronunciationNotes: pronunciation.trim() } : {}),
            ...(requiredScenes.trim() ? { requiredScenes: requiredScenes.trim() } : {}),
            ...(screenText.trim() ? { requiredOnScreenText: screenText.trim() } : {}),
            ...(prohibited.trim() ? { prohibitedElements: prohibited.trim() } : {}),
            ...(references.trim() ? { referenceNotes: references.trim() } : {}),
            priority,
            engineMode,
            ...(engineMode === "manual" ? { manualEngineId: manualEngine } : {}),
            ...(budget.trim() ? { budgetLimit: Number(budget) } : {}),
          },
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.projectId) throw new Error(payload.error || "Não foi possível salvar o projeto.");
      window.location.href = `/interno/lab/studio/projetos/${payload.projectId}`;
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Não foi possível salvar o projeto.");
    } finally {
      setSaving(false);
    }
  }

  return <main className="min-h-screen bg-[#040c17] px-5 pb-24 pt-24 text-white sm:px-6 lg:px-8">
    <div className="mx-auto max-w-6xl">
      <a href="/interno/lab/studio/projetos" className="inline-flex items-center gap-2 text-xs text-white/45 transition hover:text-white"><ArrowLeft className="h-4 w-4"/> Voltar aos projetos</a>

      <div className="mt-5 border-b border-white/10 pb-7">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-cyan-200"><Film className="h-4 w-4"/> ALGENRI Studio · Criação</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-.03em] sm:text-4xl">Criar novo vídeo</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">Descreva o que você quer criar. O Studio transforma o briefing em roteiro, cenas, prompts técnicos, seleção de motores e estimativa antes de qualquer geração paga.</p>
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-4">{steps.map((label,index)=><button key={label} type="button" onClick={()=>index<=step&&setStep(index)} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left ${index===step?"border-cyan-300/25 bg-cyan-300/[.07]":index<step?"border-emerald-300/15 bg-emerald-300/[.025]":"border-white/10 bg-white/[.02]"}`}><span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${index<step?"bg-emerald-300/10 text-emerald-200":index===step?"bg-cyan-300/10 text-cyan-100":"bg-white/[.04] text-white/30"}`}>{index<step?<CheckCircle2 className="h-4 w-4"/>:index+1}</span><span className="text-xs font-semibold text-white/65">{label}</span></button>)}</div>

      {step===0 && <section className="mt-7 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <button type="button" onClick={()=>setCreationMode("quick")} className={`rounded-[24px] border p-5 text-left transition ${creationMode==="quick"?"border-cyan-300/25 bg-cyan-300/[.06]":"border-white/10 bg-white/[.02]"}`}><div className="flex items-center justify-between"><span className="flex items-center gap-2 font-semibold"><WandSparkles className="h-5 w-5 text-cyan-200"/> Criação rápida</span>{creationMode==="quick"&&<CheckCircle2 className="h-5 w-5 text-cyan-200"/>}</div><p className="mt-2 text-sm leading-6 text-white/40">Você descreve a ideia em linguagem natural e a IA completa a estrutura inicial do projeto.</p></button>
          <button type="button" onClick={()=>setCreationMode("advanced")} className={`rounded-[24px] border p-5 text-left transition ${creationMode==="advanced"?"border-violet-300/25 bg-violet-300/[.06]":"border-white/10 bg-white/[.02]"}`}><div className="flex items-center justify-between"><span className="flex items-center gap-2 font-semibold"><SlidersHorizontal className="h-5 w-5 text-violet-200"/> Criação avançada</span>{creationMode==="advanced"&&<CheckCircle2 className="h-5 w-5 text-violet-200"/>}</div><p className="mt-2 text-sm leading-6 text-white/40">Controle objetivo, público e parâmetros desde o início. Ideal para produção com requisitos específicos.</p></button>
        </div>

        <label className="block rounded-[24px] border border-white/10 bg-white/[.02] p-5"><span className="text-xs font-semibold text-white/70">Nome do projeto</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="Ex.: Vídeo institucional ALGENRI — setembro" className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-cyan-300/25"/></label>

        {creationMode==="quick"?<label className="block rounded-[26px] border border-cyan-300/15 bg-cyan-300/[.025] p-5"><span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-cyan-200"><Sparkles className="h-4 w-4"/> O que você quer criar?</span><textarea value={idea} onChange={e=>setIdea(e.target.value)} rows={7} placeholder="Ex.: Quero um vídeo de 20 segundos sobre a ALGENRI para Instagram, moderno e cinematográfico, mostrando tecnologia, criatividade e soluções digitais. Quero uma abertura impactante e encerramento com a marca." className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 outline-none placeholder:text-white/20 focus:border-cyan-300/25"/><p className="mt-3 text-xs text-white/30">O Studio usará essa ideia para propor objetivo, público, roteiro, cenas e assets.</p></label>:<div className="grid gap-4 md:grid-cols-2"><label className="rounded-[24px] border border-white/10 bg-white/[.02] p-5 md:col-span-2"><span className="flex items-center gap-2 text-xs font-semibold text-white/70"><Target className="h-4 w-4"/> Objetivo</span><textarea value={objective} onChange={e=>setObjective(e.target.value)} rows={4} placeholder="O que este vídeo precisa comunicar, provocar ou gerar?" className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-cyan-300/25"/></label><label className="rounded-[24px] border border-white/10 bg-white/[.02] p-5"><span className="flex items-center gap-2 text-xs font-semibold text-white/70"><Users className="h-4 w-4"/> Público</span><input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="Ex.: empresários e gestores" className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/20"/></label><label className="rounded-[24px] border border-white/10 bg-white/[.02] p-5"><span className="text-xs font-semibold text-white/70">Ideia central</span><input value={idea} onChange={e=>setIdea(e.target.value)} placeholder="Mensagem principal do vídeo" className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/20"/></label></div>}
      </section>}

      {step===1 && <section className="mt-7 space-y-6">
        <div className="grid gap-4 lg:grid-cols-3"><label className="rounded-[22px] border border-white/10 bg-white/[.02] p-4"><span className="text-xs font-semibold text-white/65">Destino</span><select value={destination} onChange={e=>setDestination(e.target.value)} className="mt-3 w-full rounded-xl border border-white/10 bg-[#081522] px-3 py-3 text-sm">{studioDestinations.map(item=><option key={item}>{item}</option>)}</select></label><label className="rounded-[22px] border border-white/10 bg-white/[.02] p-4"><span className="flex items-center gap-2 text-xs font-semibold text-white/65"><Gauge className="h-4 w-4"/> Duração</span><input value={duration} onChange={e=>setDuration(Number(e.target.value))} type="number" min="3" max="180" className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm"/></label><label className="rounded-[22px] border border-white/10 bg-white/[.02] p-4"><span className="text-xs font-semibold text-white/65">Proporção</span><select value={ratio} onChange={e=>setRatio(e.target.value as StudioAspectRatio)} className="mt-3 w-full rounded-xl border border-white/10 bg-[#081522] px-3 py-3 text-sm"><option>9:16</option><option>16:9</option><option>1:1</option><option>4:5</option></select></label></div>

        <div className="grid gap-4 md:grid-cols-2"><label className="rounded-[22px] border border-white/10 bg-white/[.02] p-4"><span className="flex items-center gap-2 text-xs font-semibold text-white/65"><Palette className="h-4 w-4"/> Estilo visual</span><select value={style} onChange={e=>setStyle(e.target.value)} className="mt-3 w-full rounded-xl border border-white/10 bg-[#081522] px-3 py-3 text-sm">{studioVisualStyles.map(item=><option key={item}>{item}</option>)}</select></label><div className="rounded-[22px] border border-white/10 bg-white/[.02] p-4"><p className="text-xs font-semibold text-white/65">Roteiro</p><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={()=>setScriptMode("ai")} className={`rounded-xl border px-3 py-3 text-xs ${scriptMode==="ai"?"border-cyan-300/25 bg-cyan-300/[.06] text-cyan-100":"border-white/10 text-white/40"}`}>IA cria</button><button onClick={()=>setScriptMode("manual")} className={`rounded-xl border px-3 py-3 text-xs ${scriptMode==="manual"?"border-violet-300/25 bg-violet-300/[.06] text-violet-100":"border-white/10 text-white/40"}`}>Eu forneço</button></div></div></div>
        {scriptMode==="manual"&&<label className="block rounded-[22px] border border-white/10 bg-white/[.02] p-4"><span className="text-xs font-semibold text-white/65">Roteiro / locução</span><textarea value={script} onChange={e=>setScript(e.target.value)} rows={5} className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm"/></label>}

        <div className="grid gap-4 md:grid-cols-3">{[
          {label:"Identidade da marca",icon:ShieldCheck,value:brand,set:setBrand,detail:"Logo, cores e padrões aprovados."},
          {label:"Avatar",icon:Users,value:avatar,set:setAvatar,detail:"Apresentador autorizado quando necessário."},
          {label:"Voz / narração",icon:Mic2,value:voice,set:setVoice,detail:"Voz independente do motor visual."},
        ].map(({label,icon:Icon,value,set,detail})=><button key={label} onClick={()=>set(!value)} className={`rounded-[22px] border p-4 text-left ${value?"border-emerald-300/20 bg-emerald-300/[.035]":"border-white/10 bg-white/[.02]"}`}><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4"/>{label}</span>{value&&<CheckCircle2 className="h-4 w-4 text-emerald-200"/>}</div><p className="mt-2 text-xs leading-5 text-white/35">{detail}</p></button>)}</div>

        {voice&&<label className="block rounded-[22px] border border-amber-300/15 bg-amber-300/[.02] p-4"><span className="flex items-center gap-2 text-xs font-semibold text-amber-100"><Mic2 className="h-4 w-4"/> Pronúncia especial</span><textarea value={pronunciation} onChange={e=>setPronunciation(e.target.value)} rows={3} className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm"/><p className="mt-2 text-xs text-white/30">Dicionário permanente será ligado à Biblioteca do Studio nas próximas etapas.</p></label>}

        <div className="grid gap-4 md:grid-cols-2"><label className="rounded-[22px] border border-white/10 bg-white/[.02] p-4"><span className="text-xs font-semibold text-white/65">Cenas obrigatórias</span><textarea value={requiredScenes} onChange={e=>setRequiredScenes(e.target.value)} rows={4} placeholder="Ex.: abertura com interface digital; encerramento com logo" className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm placeholder:text-white/20"/></label><label className="rounded-[22px] border border-white/10 bg-white/[.02] p-4"><span className="flex items-center gap-2 text-xs font-semibold text-white/65"><Type className="h-4 w-4"/> Textos obrigatórios na tela</span><textarea value={screenText} onChange={e=>setScreenText(e.target.value)} rows={4} placeholder="Textos que precisam aparecer exatamente como escritos" className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm placeholder:text-white/20"/></label><label className="rounded-[22px] border border-white/10 bg-white/[.02] p-4"><span className="text-xs font-semibold text-white/65">Não pode aparecer</span><textarea value={prohibited} onChange={e=>setProhibited(e.target.value)} rows={4} placeholder="Objetos, estilos, marcas ou comportamentos proibidos" className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm placeholder:text-white/20"/></label><label className="rounded-[22px] border border-white/10 bg-white/[.02] p-4"><span className="flex items-center gap-2 text-xs font-semibold text-white/65"><ImagePlus className="h-4 w-4"/> Referências visuais</span><textarea value={references} onChange={e=>setReferences(e.target.value)} rows={4} placeholder="Descreva referências; upload será integrado à Biblioteca" className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm placeholder:text-white/20"/></label></div>
      </section>}

      {step===2 && <section className="mt-7 space-y-6">
        <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-white/35">Prioridade do projeto</p><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{(["balanced","quality","cost","speed"] as StudioPriority[]).map(item=><button key={item} onClick={()=>setPriority(item)} className={`rounded-[20px] border p-4 text-left ${priority===item?"border-cyan-300/25 bg-cyan-300/[.06]":"border-white/10 bg-white/[.02]"}`}><p className="text-sm font-semibold">{{balanced:"Equilíbrio",quality:"Qualidade",cost:"Menor custo",speed:"Velocidade"}[item]}</p></button>)}</div></div>

        <div className="rounded-[26px] border border-violet-300/15 bg-violet-300/[.025] p-5"><div className="flex items-center gap-2"><Bot className="h-5 w-5 text-violet-200"/><h2 className="font-semibold">Escolha do motor</h2></div><div className="mt-4 grid gap-3 md:grid-cols-2"><button onClick={()=>setEngineMode("automatic")} className={`rounded-[20px] border p-4 text-left ${engineMode==="automatic"?"border-cyan-300/25 bg-cyan-300/[.06]":"border-white/10"}`}><p className="text-sm font-semibold">Automático</p><p className="mt-2 text-xs leading-5 text-white/35">Studio escolhe o motor por cena considerando qualidade, custo, duração, consistência, áudio e disponibilidade.</p></button><button onClick={()=>setEngineMode("manual")} className={`rounded-[20px] border p-4 text-left ${engineMode==="manual"?"border-violet-300/25 bg-violet-300/[.06]":"border-white/10"}`}><p className="text-sm font-semibold">Manual</p><p className="mt-2 text-xs leading-5 text-white/35">Você controla diretamente o motor da geração.</p></button></div>{engineMode==="manual"&&<select value={manualEngine} onChange={e=>setManualEngine(e.target.value)} className="mt-4 w-full rounded-xl border border-white/10 bg-[#081522] px-3 py-3 text-sm">{manualStudioEngines.map(engine=><option key={engine.id} value={engine.id}>{engine.name}</option>)}</select>}</div>

        <label className="block rounded-[22px] border border-white/10 bg-white/[.02] p-4"><span className="flex items-center gap-2 text-xs font-semibold text-white/65"><Coins className="h-4 w-4"/> Teto de orçamento do projeto</span><input value={budget} onChange={e=>setBudget(e.target.value)} type="number" min="0" step="0.01" placeholder="Deixe em branco para apenas estimar" className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm placeholder:text-white/20"/><p className="mt-2 text-xs text-white/30">Nenhuma geração acima do teto deverá ocorrer sem nova confirmação explícita.</p></label>
      </section>}

      {step===3 && <section className="mt-7 space-y-5">
        <div className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/[.025] p-6"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-cyan-200"><Sparkles className="h-4 w-4"/> Briefing pronto</div><h2 className="mt-2 text-2xl font-semibold">{projectSummary.name}</h2><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[
          ["Ideia",projectSummary.idea||"A completar"],["Destino",projectSummary.destination],["Duração",`${projectSummary.duration}s`],["Estilo",projectSummary.style],["Formato",projectSummary.ratio],["Motor",projectSummary.engineMode==="automatic"?"Automático":manualStudioEngines.find(e=>e.id===projectSummary.manualEngine)?.name||projectSummary.manualEngine],["Prioridade",projectSummary.priority],["Avatar",projectSummary.avatar?"Sim":"Não"],["Voz",projectSummary.voice?"Sim":"Não"],
        ].map(([label,value])=><div key={label} className="rounded-2xl border border-white/10 bg-black/15 p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/25">{label}</p><p className="mt-2 text-sm font-semibold text-white/70">{value}</p></div>)}</div></div>

        <div className="rounded-[26px] border border-emerald-300/15 bg-emerald-300/[.025] p-5"><div className="flex gap-3"><PlayCircle className="mt-0.5 h-5 w-5 text-emerald-200"/><div><h3 className="font-semibold">Preparação automática</h3><p className="mt-2 text-sm leading-6 text-white/45">Ao salvar, o briefing será persistido e o Studio criará a primeira estrutura de storyboard por cenas, com duração, objetivo, direção visual, locução-base e prompt técnico. Nenhuma API paga é acionada neste passo.</p></div></div></div>

        {saveError&&<div className="flex gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[.04] p-4"><TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-100"/><div><p className="text-sm font-semibold text-amber-100">Não foi possível salvar</p><p className="mt-1 text-xs text-white/45">{saveError}</p></div></div>}
        <button type="button" onClick={saveAndPrepareStoryboard} disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/[.08] px-5 py-4 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/[.12] disabled:cursor-wait disabled:opacity-50">{saving?<Loader2 className="h-4 w-4 animate-spin"/>:<Sparkles className="h-4 w-4"/>}{saving?"Salvando e preparando storyboard...":"Salvar e preparar roteiro/storyboard"}</button>
      </section>}

      <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
        <button type="button" onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/50 disabled:opacity-25">Voltar</button>
        {step<3&&<button type="button" onClick={()=>setStep(Math.min(3,step+1))} disabled={step===0&&!canContinue} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[.08] px-5 py-3 text-sm font-semibold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-30">Continuar <ChevronRight className="h-4 w-4"/></button>}
      </div>
    </div>
  </main>;
}
