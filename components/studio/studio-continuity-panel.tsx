"use client";

import { useEffect, useState } from "react";
import { ImageUp, Link2, Loader2, Save, Trash2, TriangleAlert } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";
import StudioVisualBiblePanel from "@/components/studio/studio-visual-bible-panel";

type Mode = "independent" | "coherent" | "strict";
type ReferencePurpose = "character" | "scene-frame" | "environment";
type Continuity = {
  mode: Mode;
  characters: string;
  environment: string;
  wardrobe: string;
  visualRules: string;
  chainPreviousScene: boolean;
  referencePurpose: ReferencePurpose;
  referenceSubject: string;
  referenceImageStoragePath?: string | null;
  referenceImageContentType?: string | null;
  updatedAt?: string;
};

const empty: Continuity = {
  mode: "coherent",
  characters: "",
  environment: "",
  wardrobe: "",
  visualRules: "",
  chainPreviousScene: true,
  referencePurpose: "character",
  referenceSubject: "",
  referenceImageStoragePath: null,
  referenceImageContentType: null,
};

export default function StudioContinuityPanel({ projectId, initialContinuity, onChange }: { projectId: string; initialContinuity?: Partial<Continuity> | null; onChange?: (value: Continuity) => void }) {
  const [value, setValue] = useState<Continuity>({ ...empty, ...(initialContinuity || {}) });
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");

  async function token() { const user = firebaseAuth.currentUser; if (!user) throw new Error("Sessão não encontrada."); return user.getIdToken(); }
  function patch(update: Partial<Continuity>) { setValue(current => ({ ...current, ...update })); }

  async function loadReference(current: Continuity) {
    if (!current.referenceImageStoragePath) { setPreview(old => { if (old.startsWith("blob:")) URL.revokeObjectURL(old); return ""; }); return; }
    try {
      const response = await fetch(`/api/internal/studio/projects/${projectId}/continuity?asset=1`, { headers: { Authorization: `Bearer ${await token()}` }, cache: "no-store" });
      if (!response.ok) return;
      const url = URL.createObjectURL(await response.blob());
      setPreview(old => { if (old.startsWith("blob:")) URL.revokeObjectURL(old); return url; });
    } catch {}
  }

  useEffect(() => {
    const next = { ...empty, ...(initialContinuity || {}) } as Continuity;
    setValue(next);
    void loadReference(next);
    return () => { if (preview.startsWith("blob:")) URL.revokeObjectURL(preview); };
  }, [projectId]);

  async function save() {
    setBusy("save"); setError("");
    try {
      const response = await fetch(`/api/internal/studio/projects/${projectId}/continuity`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ mode: value.mode, characters: value.characters, environment: value.environment, wardrobe: value.wardrobe, visualRules: value.visualRules, chainPreviousScene: value.chainPreviousScene, referencePurpose: value.referencePurpose, referenceSubject: value.referenceSubject }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.continuity) throw new Error(payload.message || payload.error || "Não foi possível salvar a continuidade.");
      setValue(payload.continuity); onChange?.(payload.continuity);
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao salvar continuidade."); }
    finally { setBusy(""); }
  }

  async function upload(file: File) {
    setBusy("upload"); setError("");
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch(`/api/internal/studio/projects/${projectId}/continuity`, { method: "POST", headers: { Authorization: `Bearer ${await token()}` }, body: form });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.continuity) throw new Error(payload.error || "Não foi possível enviar a referência.");
      setValue(payload.continuity); onChange?.(payload.continuity); await loadReference(payload.continuity);
    } catch (e) { setError(e instanceof Error ? e.message : "Falha no upload da referência."); }
    finally { setBusy(""); }
  }

  async function remove() {
    setBusy("delete"); setError("");
    try {
      const response = await fetch(`/api/internal/studio/projects/${projectId}/continuity`, { method: "DELETE", headers: { Authorization: `Bearer ${await token()}` } });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.continuity) throw new Error(payload.error || "Não foi possível remover a referência.");
      setValue(payload.continuity); onChange?.(payload.continuity); setPreview(old => { if (old.startsWith("blob:")) URL.revokeObjectURL(old); return ""; });
    } catch (e) { setError(e instanceof Error ? e.message : "Falha ao remover referência."); }
    finally { setBusy(""); }
  }

  const characterReference = value.referencePurpose === "character";

  return <>
    <section className="mt-8 rounded-[28px] border border-violet-300/15 bg-violet-300/[.025] p-5 sm:p-6">
      <div className="flex gap-3"><Link2 className="mt-0.5 h-5 w-5 text-violet-100"/><div><h2 className="text-lg font-semibold">Direção de continuidade</h2><p className="mt-2 max-w-4xl text-sm leading-6 text-white/45">Separe identidade de personagem, enquadramento da cena e continuidade entre cenas. O Studio não deve tratar automaticamente uma foto de grupo como se fosse um único personagem.</p></div></div>
      {error && <div className="mt-4 rounded-2xl border border-rose-300/15 bg-rose-300/[.04] p-4 text-sm text-rose-100">{error}</div>}

      <div className="mt-5 grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="space-y-4">
          <label className="grid gap-2 text-xs text-white/45"><span>Modo</span><select value={value.mode} onChange={e => patch({ mode: e.target.value as Mode })} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-white"><option value="independent">Cenas independentes</option><option value="coherent">Coerente</option><option value="strict">Continuidade estrita</option></select></label>
          <label className={`flex items-start gap-2 rounded-2xl border p-3 ${value.mode === "independent" ? "border-white/8 bg-black/10 opacity-45" : "border-cyan-300/15 bg-cyan-300/[.035]"}`}><input type="checkbox" checked={value.chainPreviousScene} disabled={value.mode === "independent"} onChange={e => patch({ chainPreviousScene: e.target.checked })} className="mt-0.5"/><span><strong className="block text-xs text-white/70">Encadear com a cena anterior</strong><span className="mt-1 block text-[10px] leading-4 text-white/35">Usa o quadro final da cena anterior para continuidade temporal, separado da referência de identidade.</span></span></label>

          <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
            <p className="text-[10px] uppercase tracking-[.12em] text-white/30">Referência visual</p>
            <label className="mt-3 grid gap-2 text-[11px] text-white/45"><span>Esta imagem representa</span><select value={value.referencePurpose} onChange={e => patch({ referencePurpose: e.target.value as ReferencePurpose })} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-white"><option value="character">Personagem / identidade</option><option value="scene-frame">Primeiro frame da cena</option><option value="environment">Ambiente / linguagem visual</option></select></label>
            {preview ? <img src={preview} alt="Referência de continuidade" className="mt-3 max-h-44 w-full rounded-xl object-cover"/> : <div className="mt-3 grid h-24 place-items-center rounded-xl border border-dashed border-white/10 text-[11px] text-white/25">Sem imagem</div>}
            <div className="mt-3 flex flex-wrap gap-2"><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-violet-300/15 px-3 py-2 text-xs text-violet-100"><ImageUp className="h-3.5 w-3.5"/> Enviar<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file); e.currentTarget.value = ""; }}/></label>{value.referenceImageStoragePath && <button onClick={remove} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl border border-rose-300/15 px-3 py-2 text-xs text-rose-100"><Trash2 className="h-3.5 w-3.5"/> Remover</button>}</div>
            {characterReference && <div className="mt-3 flex gap-2 rounded-xl border border-amber-300/15 bg-amber-300/[.04] p-3"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-100"/><p className="text-[10px] leading-4 text-amber-50/75">Para identidade, use preferencialmente uma imagem com uma única pessoa, rosto visível e sem obstruções. Foto de grupo aumenta o risco de duplicação ou troca de identidade.</p></div>}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {characterReference && <label className="grid gap-2 text-xs text-white/45 sm:col-span-2"><span>Qual pessoa deve permanecer?</span><textarea rows={3} value={value.referenceSubject} onChange={e => patch({ referenceSubject: e.target.value })} placeholder="Ex.: apenas o homem à esquerda, terno azul-marinho, camisa branca, cabelo castanho curto. Não duplicar essa pessoa; demais pessoas são figurantes distintos." className="resize-y rounded-xl border border-amber-300/15 bg-amber-300/[.025] px-3 py-3 text-sm leading-6 text-white outline-none"/><span className="text-[10px] text-white/30">Obrigatório quando há referência de personagem. Se houver mais de uma pessoa na foto, descreva exatamente quem é o personagem-alvo.</span></label>}
          <label className="grid gap-2 text-xs text-white/45"><span>Personagens recorrentes</span><textarea rows={5} value={value.characters} onChange={e => patch({ characters: e.target.value })} placeholder="Quem deve aparecer e quantas pessoas devem existir em cada cena." className="resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm leading-6 text-white outline-none"/></label>
          <label className="grid gap-2 text-xs text-white/45"><span>Ambiente recorrente</span><textarea rows={5} value={value.environment} onChange={e => patch({ environment: e.target.value })} placeholder="Escritório, arquitetura, luz, horário e elementos constantes." className="resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm leading-6 text-white outline-none"/></label>
          <label className="grid gap-2 text-xs text-white/45"><span>Figurino e aparência</span><textarea rows={4} value={value.wardrobe} onChange={e => patch({ wardrobe: e.target.value })} placeholder="O que deve permanecer igual entre as cenas." className="resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm leading-6 text-white outline-none"/></label>
          <label className="grid gap-2 text-xs text-white/45"><span>Regras visuais e câmera</span><textarea rows={4} value={value.visualRules} onChange={e => patch({ visualRules: e.target.value })} placeholder="Lente, iluminação, paleta, ritmo e direção de câmera." className="resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm leading-6 text-white outline-none"/></label>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-white/30">Salvar não consome créditos. A referência de identidade deixa de ser tratada silenciosamente como primeiro frame.</p><button onClick={save} disabled={!!busy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-300/20 bg-violet-300/[.07] px-4 py-2.5 text-xs font-semibold text-violet-100 disabled:opacity-40">{busy === "save" ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Save className="h-3.5 w-3.5"/>}Salvar continuidade</button></div>
    </section>
    <StudioVisualBiblePanel projectId={projectId}/>
  </>;
}
