"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useEffect } from "react";
import { BadgeCheck, BriefcaseBusiness, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, FileSignature, FileText, FolderKanban, Gauge, Home, Inbox, LayoutDashboard, LogOut, Menu, MessageSquareText, Settings2, Users, X } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type Item = { label: string; href?: string; icon: React.ElementType; disabled?: boolean };
type Group = { label: string; icon: React.ElementType; items: Item[] };

const groups: Group[] = [
  {
    label: "Comercial",
    icon: BriefcaseBusiness,
    items: [
      { label: "Interessados", href: "/interno/leads", icon: Users },
      { label: "Clientes", href: "/interno/clientes", icon: Users },
      { label: "Projetos", href: "/interno/projetos", icon: FolderKanban },
      { label: "Propostas", href: "/interno/propostas", icon: FileText },
      { label: "Contratos", href: "/interno/contratos", icon: FileSignature },
    ],
  },
  {
    label: "Operação",
    icon: Gauge,
    items: [
      { label: "Criar / enviar briefing", href: "/interno/briefings/instancias", icon: FileText },
      { label: "Briefings recebidos", href: "/interno/briefings/recebidos", icon: Inbox },
      { label: "Dossiês de projeto", href: "/interno/dossies", icon: MessageSquareText },
    ],
  },
  {
    label: "Financeiro",
    icon: CircleDollarSign,
    items: [
      { label: "Cobranças", icon: CircleDollarSign, disabled: true },
      { label: "Recebimentos", icon: CircleDollarSign, disabled: true },
    ],
  },
  {
    label: "Configurações",
    icon: Settings2,
    items: [
      { label: "Visão geral", href: "/interno/configuracoes", icon: Settings2 },
      { label: "Prontidão", href: "/interno/prontidao", icon: BadgeCheck },
      { label: "Modelos de briefing", href: "/interno/briefings/modelos", icon: FileText },
      { label: "Integrações", icon: Settings2, disabled: true },
      { label: "Usuários", icon: Users, disabled: true },
    ],
  },
];

function userLabel(user: User | null) {
  if (!user) return "Usuário";
  if (user.displayName?.trim()) return user.displayName.trim();
  return user.email?.split("@")[0] || "Usuário";
}

function userInitials(user: User | null) {
  const label = userLabel(user);
  const parts = label.split(/[._\-\s]+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : label.slice(0, 2)).toUpperCase();
}

export default function InternalSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(firebaseAuth.currentUser);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => Object.fromEntries(groups.map((group) => [group.label, true])));

  useEffect(() => onAuthStateChanged(firebaseAuth, setUser), []);

  const activeGroup = useMemo(() => groups.find((group) => group.items.some((item) => item.href && pathname.startsWith(item.href))), [pathname]);

  function toggleGroup(label: string) {
    setOpenGroups((current) => ({ ...current, [label]: !current[label] }));
  }

  async function logout() {
    await signOut(firebaseAuth);
    window.location.href = "/interno";
  }

  const sidebar = (
    <aside className={`flex h-full flex-col border-r border-white/10 bg-[#06111f] text-white shadow-[20px_0_70px_rgba(0,0,0,.18)] transition-all duration-300 ${collapsed ? "w-[84px]" : "w-[276px]"}`}>
      <div className="flex h-[74px] items-center justify-between border-b border-white/10 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 overflow-hidden place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/[.06] text-xs font-bold text-cyan-200">
            {user?.photoURL ? <img src={user.photoURL} alt="Foto do usuário" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : userInitials(user)}
          </div>
          {!collapsed && <div className="min-w-0"><p className="truncate text-sm font-semibold">{userLabel(user)}</p><p className="truncate text-[10px] uppercase tracking-[.18em] text-white/35">Área interna</p></div>}
        </div>
        <button onClick={() => setCollapsed((value) => !value)} className="hidden rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white lg:block" aria-label={collapsed ? "Expandir menu" : "Recolher menu"}>{collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button>
        <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-white/50 lg:hidden" aria-label="Fechar menu"><X className="h-5 w-5" /></button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <a href="/interno" onClick={() => setMobileOpen(false)} className={`mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${pathname === "/interno" ? "bg-cyan-300/10 text-cyan-100 ring-1 ring-cyan-300/15" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
          <LayoutDashboard className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </a>

        {groups.map((group) => {
          const GroupIcon = group.icon;
          const isOpen = openGroups[group.label];
          const highlighted = activeGroup?.label === group.label;
          return (
            <div key={group.label} className="mb-1.5">
              <button onClick={() => toggleGroup(group.label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${highlighted ? "text-cyan-100" : "text-white/55 hover:bg-white/5 hover:text-white"}`}>
                <GroupIcon className="h-5 w-5 shrink-0" />
                {!collapsed && <><span className="flex-1 text-left">{group.label}</span><ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} /></>}
              </button>
              {isOpen && !collapsed && (
                <div className="ml-5 mt-1 space-y-1 border-l border-white/10 pl-3">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = Boolean(item.href && pathname.startsWith(item.href));
                    if (item.disabled) return <div key={item.label} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs text-white/25"><Icon className="h-4 w-4" /><span className="flex-1">{item.label}</span><span className="text-[9px] uppercase tracking-wider">em breve</span></div>;
                    return <a key={item.label} href={item.href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs transition ${active ? "bg-white/[.07] text-cyan-200" : "text-white/50 hover:bg-white/[.04] hover:text-white"}`}><Icon className="h-4 w-4" />{item.label}</a>;
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/10 bg-[#06111f] p-3">
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/55 transition hover:bg-rose-400/[.08] hover:text-rose-100"><LogOut className="h-5 w-5 shrink-0" />{!collapsed && <span>Sair</span>}</button>
        <a href="/" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-white/45 transition hover:bg-white/5 hover:text-white"><Home className="h-5 w-5 shrink-0" />{!collapsed && <span>Voltar ao site</span>}</a>
      </div>
    </aside>
  );

  return (
    <>
      <button onClick={() => setMobileOpen(true)} className="fixed left-4 top-[86px] z-40 grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-[#06111f]/95 text-white shadow-xl backdrop-blur-xl lg:hidden" aria-label="Abrir menu"><Menu className="h-5 w-5" /></button>
      <div className="fixed bottom-0 left-0 top-[72px] z-50 hidden lg:block">{sidebar}</div>
      {mobileOpen && <><button className="fixed inset-0 top-[72px] z-50 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" /><div className="fixed bottom-0 left-0 top-[72px] z-[60] lg:hidden">{sidebar}</div></>}
      <div className={`hidden lg:block transition-all duration-300 ${collapsed ? "w-[84px]" : "w-[276px]"}`} aria-hidden />
    </>
  );
}
