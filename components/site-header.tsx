"use client";

import { ArrowRight, ChevronDown, Menu, MessageSquareText, Smartphone, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "./brand-logo";

const navigation = [
  { href: "/solucoes", label: "Soluções" },
  { href: "/planos", label: "Evolução Digital" },
  { href: "/diagnostico", label: "Diagnóstico" },
  { href: "/contato", label: "Contato" },
];

const products = [
  {
    href: "/psico-algenri",
    label: "Psico ALGENRI",
    description: "Gestão clínica simples para psicólogos.",
    status: "Em lançamento",
    icon: Smartphone,
  },
  {
    href: "#",
    label: "ALGENRI Atendimento Inteligente",
    description: "WhatsApp, site e IA para atendimento automatizado.",
    status: "Em desenvolvimento",
    icon: MessageSquareText,
  },
  {
    href: "#",
    label: "Novos Apps ALGENRI",
    description: "Aplicativos enxutos para rotinas profissionais e negócios.",
    status: "Em desenvolvimento",
    icon: Sparkles,
  },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-[200] overflow-visible border-b border-white/[0.08] bg-[#06111f]/88 backdrop-blur-2xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6 lg:px-8">
        <a href="/" className="group flex items-center" aria-label="ALGENRI - página inicial">
          <BrandLogo className="h-auto w-[188px] sm:w-[204px]" priority />
        </a>

        <nav className="hidden items-center gap-7 overflow-visible text-sm text-white/64 md:flex" aria-label="Navegação principal">
          <a href="/solucoes" className="transition hover:text-white">Soluções</a>

          <div className="group relative z-[220]">
            <button type="button" className="inline-flex items-center gap-1.5 py-7 transition hover:text-white" aria-haspopup="true">
              Produtos <ChevronDown className="h-3.5 w-3.5 transition group-hover:rotate-180" />
            </button>
            <div className="invisible absolute left-1/2 top-[66px] z-[240] w-[420px] -translate-x-1/2 translate-y-2 rounded-[26px] border border-white/10 bg-[#071522]/[.99] p-3 opacity-0 shadow-[0_30px_100px_rgba(0,0,0,.65)] backdrop-blur-2xl transition duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <div className="px-3 pb-2 pt-1 text-[11px] font-medium uppercase tracking-[.16em] text-cyan-200/65">Produtos ALGENRI</div>
              {products.map(({ href, label, description, status, icon: Icon }) => {
                const disabled = href === "#";
                return (
                  <a
                    key={label}
                    href={href}
                    onClick={(event) => disabled && event.preventDefault()}
                    className={`flex gap-3 rounded-2xl p-3 transition ${disabled ? "cursor-default opacity-70" : "hover:bg-white/[0.055]"}`}
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-300/[.05] text-cyan-200"><Icon className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-white/90">{label}</span>
                        <span className="shrink-0 rounded-full border border-white/10 bg-white/[.035] px-2 py-0.5 text-[10px] text-white/45">{status}</span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-white/42">{description}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {navigation.slice(1).map((item) => (
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
        <div className="relative z-[230] border-t border-white/10 bg-[#06111f]/98 px-6 py-5 backdrop-blur-2xl md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Navegação móvel">
            <a href="/solucoes" onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 text-white/72 transition hover:bg-white/6 hover:text-white">Soluções</a>

            <button
              type="button"
              onClick={() => setProductsOpen((value) => !value)}
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-left text-white/72 transition hover:bg-white/6 hover:text-white"
              aria-expanded={productsOpen}
            >
              Produtos <ChevronDown className={`h-4 w-4 transition ${productsOpen ? "rotate-180" : ""}`} />
            </button>
            {productsOpen && (
              <div className="mb-2 ml-2 space-y-1 border-l border-cyan-300/15 pl-3">
                {products.map(({ href, label, status }) => {
                  const disabled = href === "#";
                  return (
                    <a
                      key={label}
                      href={href}
                      onClick={(event) => { if (disabled) event.preventDefault(); else setOpen(false); }}
                      className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm ${disabled ? "cursor-default text-white/38" : "text-white/68 hover:bg-white/5 hover:text-white"}`}
                    >
                      <span>{label}</span><span className="text-[10px] text-white/30">{status}</span>
                    </a>
                  );
                })}
              </div>
            )}

            {navigation.slice(1).map((item) => (
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
