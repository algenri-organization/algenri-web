"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { ArrowLeft, Loader2, LockKeyhole, LogIn, ShieldCheck } from "lucide-react";
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

  useEffect(() => {
    const publicHeader = document.querySelector("body > header") as HTMLElement | null;
    const previousHeaderDisplay = publicHeader?.style.display ?? "";
    const previousOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    if (!ready || !user) {
      if (publicHeader) publicHeader.style.display = "none";
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      if (publicHeader) publicHeader.style.display = previousHeaderDisplay;
      document.documentElement.style.overflow = previousOverflow;
      document.body.style.overflow = previousBodyOverflow;
    }

    return () => {
      if (publicHeader) publicHeader.style.display = previousHeaderDisplay;
      document.documentElement.style.overflow = previousOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [ready, user]);

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
    return (
      <main className="fixed inset-0 z-[100] grid h-[100svh] place-items-center overflow-hidden bg-[#040c17] text-white">
        <div className="flex items-center gap-3 text-white/60"><Loader2 className="h-5 w-5 animate-spin" />Carregando área interna…</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="fixed inset-0 z-[100] h-[100svh] overflow-hidden bg-[#040c17] text-white">
        <div className="grid h-full lg:grid-cols-[1.08fr_.92fr]">
          <section className="relative min-h-0 overflow-hidden border-b border-white/10 lg:border-b-0 lg:border-r">
            <img src="/hero-art.webp.jpeg" alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,12,23,.22)_0%,rgba(4,12,23,.72)_62%,rgba(4,12,23,.96)_100%)] lg:bg-[linear-gradient(90deg,rgba(4,12,23,.12)_0%,rgba(4,12,23,.48)_58%,rgba(4,12,23,.92)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(103,232,249,.14),transparent_34%)]" />

            <div className="relative flex h-full flex-col justify-between p-5 sm:p-7 lg:p-10 xl:p-12">
              <a href="/" className="w-fit"><img src="/algenri-logo.webp" alt="ALGENRI" className="h-auto w-[170px] sm:w-[205px]" /></a>

              <div className="max-w-xl pb-1 lg:pb-5">
                <div className="hidden w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.22em] text-cyan-100 sm:inline-flex">
                  <ShieldCheck className="h-3.5 w-3.5" /> Ambiente corporativo
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-[-.04em] sm:text-3xl lg:mt-5 lg:text-5xl">Área Interna ALGENRI</h1>
                <p className="mt-2 max-w-lg text-xs leading-5 text-white/65 sm:text-sm sm:leading-6 lg:mt-4 lg:text-base lg:leading-7">Gestão comercial, operacional e estratégica das soluções digitais. Centralize leads, propostas, contratos e projetos em um único ambiente.</p>
              </div>
            </div>
          </section>

          <section className="relative flex min-h-0 items-center justify-center overflow-hidden bg-[#06111f] px-5 py-4 sm:px-8 lg:px-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(34,211,238,.09),transparent_28%)]" />
            <div className="relative w-full max-w-[430px]">
              <div className="mb-4 flex items-center justify-between lg:mb-7">
                <a href="/" className="inline-flex items-center gap-2 text-xs text-white/38 transition hover:text-white/70"><ArrowLeft className="h-3.5 w-3.5" /> Voltar ao site</a>
                <span className="text-[10px] uppercase tracking-[.2em] text-white/22">Acesso restrito</span>
              </div>

              <form onSubmit={login} className="rounded-[26px] border border-white/10 bg-white/[.04] p-5 shadow-[0_28px_90px_rgba(0,0,0,.34)] backdrop-blur-xl sm:p-6 lg:p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/[.06]"><LockKeyhole className="h-5 w-5 text-cyan-300" /></div>
                <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.24em] text-cyan-300 sm:mt-5 sm:text-xs">Área interna</p>
                <h2 className="mt-1.5 text-2xl font-semibold tracking-[-.04em] sm:text-3xl">Acesso ALGENRI</h2>
                <p className="mt-2 text-xs leading-5 text-white/48 sm:text-sm sm:leading-6">Entre com sua conta corporativa para acessar o dashboard e os módulos internos.</p>

                <label className="mt-4 block text-xs text-white/65 sm:mt-5 sm:text-sm">E-mail
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#071423] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10" placeholder="nome@algenri.com.br" />
                </label>
                <label className="mt-3 block text-xs text-white/65 sm:mt-4 sm:text-sm">Senha
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#071423] px-3.5 py-3 text-sm text-white outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/10" />
                </label>

                <button disabled={busy} className="button-primary mt-4 w-full justify-center py-3 disabled:opacity-50 sm:mt-5">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}{busy ? "Entrando…" : "Entrar"}</button>
                {error && <p className="mt-3 rounded-xl border border-rose-300/15 bg-rose-300/[.05] px-3 py-2.5 text-xs text-rose-100 sm:text-sm">{error}</p>}
              </form>

              <p className="mt-3 text-center text-[10px] text-white/22 sm:mt-4 sm:text-xs">Tecnologia que impulsiona o seu amanhã.</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
