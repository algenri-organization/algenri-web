"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Mic2, Plus, Save, Sparkles } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type VoiceProfile = {
  id?: string;
  name: string;
  providerPreference: "undecided" | "elevenlabs" | "minimax";
  language: string;
  voiceReference: string;
  tone: string;
  emotion: string;
  pace: "slow" | "natural" | "dynamic";
  pronunciationNotes: string;
  directionNotes: string;
  usageNotes: string;
  isDefault: boolean;
};

const emptyProfile: VoiceProfile = {
  name: "",
  providerPreference: "undecided",
  language: "Português (Brasil)",
  voiceReference: "",
  tone: "",
  emotion: "",
  pace: "natural",
  pronunciationNotes: "ALGENRI: AL - GEN - RI",
  directionNotes: "",
  usageNotes: "",
  isDefault: false,
};

const box = "rounded-[24px] border border-white/10 bg-white/[.025] p-5";
const input = "mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-cyan-300/25";

export default function StudioVoiceProfilesPage() {
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [form, setForm] = useState<VoiceProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const canSave = useMemo(() => form.name.trim().length >= 2, [form.name]);

  async function token() {
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error("Sua sessão expirou. Entre novamente na Área Interna.");
    return user.getIdToken();
  }

  async function load() {
    setLoading(true); setMessage("");
    try {
      const auth = await token();
      const response = await fetch("/api/internal/studio/voice-profiles", { headers: { Authorization: `Bearer ${auth}` } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível carregar os perfis.");
      setProfiles(payload.profiles || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível carregar os perfis.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function save() {
    if (!canSave || saving) return;
    setSaving(true); setMessage("");
    try {
      const auth = await token();
      const response = await fetch("/api/internal/studio/voice-profiles", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Não foi possível salvar o perfil.");
      setMessage("Perfil salvo sem consumir créditos de voz.");
      setForm(emptyProfile);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o perfil.");
    } finally { setSaving(false); }
  }

  function edit(profile: VoiceProfile) { setForm(profile); window.scrollTo({ top: 0, behavior: "smooth" }); }

  return <main className="min-h-screen bg-[#040c17] px-5 pb-24 pt-24 text-white sm:px-6 lg:px-8">
    <div className="mx-auto max-w-6xl">
      <a href="/interno/lab/studio" className="inline-flex items-center gap-2 text-xs text-white/45 hover:text-white"><ArrowLeft className="h-4 w-4"/>Voltar ao Studio</a>
      <header className="mt-5 border-b border-white/10 pb-7">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-cyan-200"><Mic2 className="h-4 w-4"/>ALGENRI Studio · Voz</div>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Biblioteca de Vozes</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-white/50">Defina perfis reutilizáveis de narração antes de qualquer chamada paga. O perfil registra direção, pronúncia e preferência de provedor, mas não gera áudio automaticamente.</p>
      </header>

      <section className="mt-7 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className={box}>
          <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-cyan-200"/><h2 className="font-semibold">{form.id ? "Editar perfil" : "Novo perfil de voz"}</h2></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-xs text-white/55">Nome do perfil<input className={input} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ex.: Institucional premium — feminino"/></label>
            <label className="text-xs text-white/55">Idioma<input className={input} value={form.language} onChange={e=>setForm({...form,language:e.target.value})}/></label>
            <label className="text-xs text-white/55">Provedor preferido<select className={input} value={form.providerPreference} onChange={e=>setForm({...form,providerPreference:e.target.value as VoiceProfile["providerPreference"]})}><option value="undecided">A definir após comparação</option><option value="elevenlabs">ElevenLabs</option><option value="minimax">MiniMax</option></select></label>
            <label className="text-xs text-white/55">Referência de voz<input className={input} value={form.voiceReference} onChange={e=>setForm({...form,voiceReference:e.target.value})} placeholder="Nome interno, ID futuro ou descrição"/></label>
            <label className="text-xs text-white/55">Tom<input className={input} value={form.tone} onChange={e=>setForm({...form,tone:e.target.value})} placeholder="Ex.: seguro, sofisticado, próximo"/></label>
            <label className="text-xs text-white/55">Emoção<input className={input} value={form.emotion} onChange={e=>setForm({...form,emotion:e.target.value})} placeholder="Ex.: entusiasmo controlado"/></label>
            <label className="text-xs text-white/55">Ritmo<select className={input} value={form.pace} onChange={e=>setForm({...form,pace:e.target.value as VoiceProfile["pace"]})}><option value="slow">Calmo</option><option value="natural">Natural</option><option value="dynamic">Dinâmico</option></select></label>
            <label className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-300/15 bg-emerald-300/[.03] px-4 py-3 text-xs text-white/60"><input type="checkbox" checked={form.isDefault} onChange={e=>setForm({...form,isDefault:e.target.checked})}/><span>Usar como perfil padrão do Studio</span></label>
          </div>
          <label className="mt-4 block text-xs text-white/55">Dicionário / pronúncias especiais<textarea rows={4} className={input} value={form.pronunciationNotes} onChange={e=>setForm({...form,pronunciationNotes:e.target.value})}/></label>
          <label className="mt-4 block text-xs text-white/55">Direção de interpretação<textarea rows={4} className={input} value={form.directionNotes} onChange={e=>setForm({...form,directionNotes:e.target.value})} placeholder="Pausas, ênfases, intenção, energia, dicção e observações de gravação."/></label>
          <label className="mt-4 block text-xs text-white/55">Quando usar este perfil<textarea rows={3} className={input} value={form.usageNotes} onChange={e=>setForm({...form,usageNotes:e.target.value})} placeholder="Ex.: vídeos institucionais, anúncios premium, apresentação de soluções."/></label>
          <div className="mt-5 flex flex-wrap gap-2"><button type="button" disabled={!canSave||saving} onClick={save} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[.08] px-4 py-3 text-sm font-semibold text-cyan-100 disabled:opacity-40"><Save className="h-4 w-4"/>{saving?"Salvando...":"Salvar perfil"}</button><button type="button" onClick={()=>setForm(emptyProfile)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/55"><Plus className="h-4 w-4"/>Novo</button></div>
          {message&&<p className="mt-4 text-xs text-emerald-200">{message}</p>}
        </div>

        <aside className={box}>
          <h2 className="font-semibold">Perfis salvos</h2><p className="mt-2 text-xs leading-5 text-white/40">Nenhum item desta biblioteca gera áudio ou consome créditos.</p>
          <div className="mt-4 space-y-3">{loading?<p className="text-xs text-white/35">Carregando...</p>:profiles.length===0?<p className="text-xs text-white/35">Nenhum perfil cadastrado.</p>:profiles.map(profile=><button key={profile.id} type="button" onClick={()=>edit(profile)} className="w-full rounded-2xl border border-white/10 bg-white/[.02] p-4 text-left transition hover:border-cyan-300/20"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{profile.name}</p><p className="mt-1 text-[11px] text-white/35">{profile.language} · {profile.providerPreference==="undecided"?"provedor a definir":profile.providerPreference}</p></div>{profile.isDefault&&<CheckCircle2 className="h-4 w-4 text-emerald-200"/>}</div><p className="mt-3 text-xs leading-5 text-white/45">{profile.tone||profile.emotion||profile.directionNotes||"Direção ainda não detalhada."}</p></button>)}</div>
        </aside>
      </section>
    </div>
  </main>;
}
