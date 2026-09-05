"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { Loader2, LockKeyhole, LogIn, LogOut } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

export default function InternalAuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => onAuthStateChanged(firebaseAuth, (nextUser) => {
    setUser(nextUser);
    setReady(true);
  }), []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      if (!credential.user.email?.toLowerCase().endsWith("@algenri.com.br")) {
        await signOut(firebaseAuth);
        setError("Este acesso é exclusivo para contas internas da ALGENRI.");
      }
    } catch {
      setError("E-mail ou senha inválidos.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return <main className="min-h-screen bg-[#040c17] grid place-items-center text-white"><div className="flex items-center gap-3 text-white/60"><Loader2 className="h-5 w-5 animate-spin" />Carregando área interna…</div></main>;
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#040c17] px-6 py-24 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center">
          <form onSubmit={login} className="w-full rounded-[28px] border border-white/10 bg-white/[.035] p-7 shadow-[0_24px_80px_rgba(0,0,0,.28)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/[.05]"><LockKeyhole className="h-5 w-5 text-cyan-300" /></div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[.25em] text-cyan-300">Área interna</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Acesso ALGENRI</h1>
            <p className="mt-3 text-sm leading-6 text-white/50">Entre com sua conta corporativa para acessar o dashboard e os módulos internos.</p>

            <label className="mt-7 block text-sm text-white/65">E-mail<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" className="mt-2 w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-3 text-white outline-none focus:border-cyan-300/50" /></label>
            <label className="mt-4 block text-sm text-white/65">Senha<input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="mt-2 w-full rounded-xl border border-white/10 bg-[#071423] px-3 py-3 text-white outline-none focus:border-cyan-300/50" /></label>

            <button disabled={busy} className="button-primary mt-6 w-full justify-center disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}{busy ? "Entrando…" : "Entrar"}</button>
            {error && <p className="mt-4 rounded-xl border border-rose-300/15 bg-rose-300/[.05] px-3 py-2.5 text-sm text-rose-100">{error}</p>}
            <a href="/" className="mt-5 block text-center text-xs text-white/35 transition hover:text-white/65">Voltar ao site</a>
          </form>
        </div>
      </main>
    );
  }

  return (
    <>
      <div className="fixed right-5 top-[86px] z-40 hidden md:block">
        <button onClick={() => signOut(firebaseAuth)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#06111f]/90 px-3 py-2 text-xs text-white/55 backdrop-blur-xl transition hover:text-white"><LogOut className="h-3.5 w-3.5" />Sair</button>
      </div>
      {children}
    </>
  );
}
