"use client";

import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "./brand-logo";

const navigation = [
  { href: "/solucoes", label: "Soluções" },
  { href: "/planos", label: "Planos" },
  { href: "/diagnostico", label: "Diagnóstico" },
  { href: "/contato", label: "Contato" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.08] bg-[#06111f]/88 backdrop-blur-2xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6 lg:px-8">
        <a href="/" className="group flex items-center" aria-label="ALGENRI - página inicial">
          <BrandLogo className="h-auto w-[188px] sm:w-[204px]" priority />
        </a>

        <nav className="hidden items-center gap-8 text-sm text-white/64 md:flex" aria-label="Navegação principal">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <a href="/contato" className="inline-flex items-center gap-2 rounded-full border border-cyan-300/45 bg-white/[0.035] px-5 py-2.5 text-sm font-medium text-white shadow-[0_0_28px_rgba(0,229,255,.08)] transition hover:border-cyan-200 hover:bg-white/[0.07]">
            Fale com um especialista <ArrowRight className="h-4 w-4" />
          </a>
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
        <div className="border-t border-white/10 bg-[#06111f]/98 px-6 py-5 backdrop-blur-2xl md:hidden">
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
            <a href="/contato" onClick={() => setOpen(false)} className="button-primary mt-3 text-center">
              Fale com um especialista
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
