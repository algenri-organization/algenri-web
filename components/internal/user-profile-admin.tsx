"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, sendPasswordResetEmail, updateProfile, type User } from "firebase/auth";
import { Camera, KeyRound, Save, ShieldCheck, UserRound, X } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function initials(user: User | null) {
  const label = user?.displayName?.trim() || user?.email?.split("@")[0] || "AL";
  const parts = label.split(/[._\-\s]+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : label.slice(0, 2)).toUpperCase();
}

async function profilePhotoRequest(user: User, method: "POST" | "DELETE", file?: File) {
  const token = await user.getIdToken();
  const body = file ? (() => { const data = new FormData(); data.append("file", file); return data; })() : undefined;
  const response = await fetch("/api/internal/profile/photo", {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "photo_request_failed");
  return payload as { ok: true; photoURL?: string };
}

export default function UserProfileAdmin() {
  const [user, setUser] = useState<User | null>(firebaseAuth.currentUser);
  const [ready, setReady] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(firebaseAuth, (current) => {
    setUser(current);
    setDisplayName(current?.displayName ?? "");
    setPhotoURL(current?.photoURL ?? "");
    setReady(true);
  }), []);

  async function saveProfile() {
    if (!user) return;
    setSaving(true); setMessage(""); setError("");
    try {
      let nextPhotoURL = photoURL.trim() || null;
      if (photoFile) {
        if (!ALLOWED_PHOTO_TYPES.has(photoFile.type)) throw new Error("Selecione uma imagem JPG, PNG ou WebP.");
        if (photoFile.size > MAX_PHOTO_SIZE) throw new Error("A foto deve ter no máximo 5 MB.");
        const uploaded = await profilePhotoRequest(user, "POST", photoFile);
        if (!uploaded.photoURL) throw new Error("Não foi possível obter a URL da foto enviada.");
        nextPhotoURL = uploaded.photoURL;
      }
      await updateProfile(user, { displayName: displayName.trim() || null, photoURL: nextPhotoURL });
      setPhotoFile(null);
      setPhotoURL(nextPhotoURL ?? "");
      setMessage("Perfil atualizado com sucesso. A área interna será recarregada para aplicar a nova identificação.");
      window.setTimeout(() => window.location.reload(), 900);
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      setError(code === "photo_upload_failed" ? "Não foi possível enviar a foto. Verifique a configuração do armazenamento e tente novamente." : code || "Não foi possível atualizar o perfil.");
    } finally {
      setSaving(false);
    }
  }

  async function removePhoto() {
    if (!user) return;
    setSaving(true); setMessage(""); setError("");
    try {
      await profilePhotoRequest(user, "DELETE");
      await updateProfile(user, { photoURL: null });
      setPhotoURL(""); setPhotoFile(null);
      setMessage("Foto removida. A área interna será recarregada.");
      window.setTimeout(() => window.location.reload(), 700);
    } catch {
      setError("Não foi possível remover a foto.");
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword() {
    if (!user?.email) return;
    setMessage(""); setError("");
    try {
      await sendPasswordResetEmail(firebaseAuth, user.email);
      setMessage("Enviamos um e-mail para redefinição da senha desta conta.");
    } catch {
      setError("Não foi possível enviar o e-mail de redefinição de senha.");
    }
  }

  if (!ready) return <main className="min-h-screen bg-[#040c17] grid place-items-center text-white">Carregando…</main>;
  if (!user) return null;

  const preview = photoFile ? URL.createObjectURL(photoFile) : photoURL;
  const input = "w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/40";

  return (
    <main className="min-h-screen bg-[#040c17] px-5 pb-20 pt-28 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="border-b border-white/10 pb-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.25em] text-cyan-300"><UserRound className="h-4 w-4" /> Usuários e acesso</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">Meu perfil</h1>
          <p className="mt-3 max-w-2xl leading-7 text-white/55">Gerencie sua identificação na Área Interna, foto de perfil e recuperação de senha. A gestão de múltiplos usuários e permissões ficará separada para quando a equipe precisar.</p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/[.025] p-6">
            <div className="flex flex-col items-center text-center">
              <div className="grid h-28 w-28 overflow-hidden place-items-center rounded-[28px] border border-cyan-300/20 bg-cyan-300/[.06] text-2xl font-bold text-cyan-200">
                {preview ? <img src={preview} alt="Foto do perfil" className="h-full w-full object-cover" /> : initials(user)}
              </div>
              <p className="mt-4 font-semibold">{user.displayName || "Usuário ALGENRI"}</p>
              <p className="mt-1 break-all text-xs text-white/40">{user.email}</p>
              <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[.05] px-3 py-1 text-[10px] uppercase tracking-[.12em] text-emerald-200"><ShieldCheck className="h-3 w-3" /> Conta autenticada</span>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[.025] p-6">
            <h2 className="text-lg font-semibold">Dados do perfil</h2>
            <div className="mt-5 space-y-4">
              <label className="block"><span className="mb-2 block text-xs font-medium text-white/50">Nome de exibição</span><input className={input} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nome que aparecerá na Área Interna" /></label>
              <label className="block"><span className="mb-2 block text-xs font-medium text-white/50">E-mail de acesso</span><input className={`${input} opacity-60`} value={user.email ?? ""} disabled /></label>
              <div>
                <span className="mb-2 block text-xs font-medium text-white/50">Foto de perfil</span>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-300/20 bg-cyan-300/[.025] px-4 py-4 text-sm text-cyan-100 transition hover:bg-cyan-300/[.05]"><Camera className="h-4 w-4" />{photoFile ? photoFile.name : "Selecionar imagem do computador"}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} /></label>
                <p className="mt-2 text-xs text-white/30">JPG, PNG ou WebP. Máximo de 5 MB. O envio passa pelo backend autenticado da ALGENRI.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button disabled={saving} onClick={saveProfile} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Salvando…" : "Salvar perfil"}</button>
              {(photoURL || photoFile) && <button disabled={saving} onClick={removePhoto} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/50 hover:text-white"><X className="h-4 w-4" />Remover foto</button>}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[.025] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><div className="flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4 text-cyan-300" /> Segurança da conta</div><p className="mt-2 text-sm leading-6 text-white/42">A senha não é exibida nem armazenada pela ALGENRI. A redefinição é feita pelo fluxo seguro do Firebase Authentication.</p></div>
            <button onClick={resetPassword} className="shrink-0 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/65 transition hover:bg-white/5 hover:text-white">Redefinir senha</button>
          </div>
        </section>

        {(message || error) && <p className={`mt-5 rounded-xl border px-4 py-3 text-sm ${error ? "border-rose-400/20 bg-rose-400/5 text-rose-100" : "border-emerald-400/20 bg-emerald-400/5 text-emerald-100"}`}>{error || message}</p>}
      </div>
    </main>
  );
}
