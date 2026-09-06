"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Eye, FileDown } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

async function authFetch(user: User, url: string, init?: RequestInit) {
  const token = await user.getIdToken();
  return fetch(url, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` } });
}

export default function ProposalDocumentActions({ id }: { id: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => onAuthStateChanged(firebaseAuth, setUser), []);

  function preview() {
    window.open(`/interno/propostas/${encodeURIComponent(id)}/visualizar`, "_blank", "noopener,noreferrer");
  }

  async function generatePdf() {
    if (!user || busy) return;
    setBusy(true);
    try {
      await authFetch(user, `/api/internal/proposals/${id}/pdf-generated`, { method: "POST" });
      window.open(`/interno/propostas/${encodeURIComponent(id)}/visualizar?print=1`, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  }

  return <div className="fixed bottom-5 right-5 z-40 flex gap-2 print:hidden">
    <button onClick={preview} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-[#071423]/95 px-4 py-2.5 text-sm font-semibold text-white shadow-xl backdrop-blur"><Eye size={16}/>Visualizar proposta</button>
    <button disabled={!user||busy} onClick={generatePdf} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-xl disabled:opacity-50"><FileDown size={16}/>{busy?"Preparando…":"Gerar PDF"}</button>
  </div>;
}
