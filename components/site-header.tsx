"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

const navigation = [
  { href: "/solucoes", label: "Soluções" },
  { href: "/planos", label: "Planos" },
  { href: "/diagnostico", label: "Diagnóstico" },
  { href: "/contato", label: "Contato" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#07111f]/72 backdrop-blur-2xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6 lg:px-8">
        <a href="/" className="group flex items-center gap-3" aria-label="ALGENRI - página inicial">
          <span className="brand-mark" aria-hidden>AG</span>
          <span>
            <span className="block text-sm font-semibold tracking-[0.20em]">ALGENRI</span>
            <span className="hidden text-[10px] uppercase tracking-[0.16em] text-white/35 sm:block">Digital · AI · Automation</span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 text-sm text-white/66 md:flex" aria-label="Navegação principal">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <a href="/diagnostico" className="button-secondary text-sm">Solicitar diagnóstico</a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/5 md:hidden"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#07111f]/96 px-6 py-5 backdrop-blur-2xl md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Navegação móvel">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-4 py-3 text-white/72 transition hover:bg-white/6 hover:text-white"
              >
                {item.label}
              </a>
            ))}
            <a href="/diagnostico" onClick={() => setOpen(false)} className="button-primary mt-3 text-center">
              Solicitar diagnóstico
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
