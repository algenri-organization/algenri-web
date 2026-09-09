"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { LockKeyhole } from "lucide-react";
import { firebaseAuth } from "@/lib/firebase/client";

type ModuleKey="commercial"|"operation"|"finance"|"settings";
type Access={role:"admin"|"member";permissions:ModuleKey[];active:boolean};

function pageModule(pathname:string):ModuleKey|null{
  if(pathname.startsWith("/interno/configuracoes/notificacoes"))return null;
  if(["/interno/leads","/interno/clientes","/interno/projetos","/interno/propostas","/interno/contratos"].some(prefix=>pathname.startsWith(prefix)))return "commercial";
  if(pathname.startsWith("/interno/briefings/instancias")||pathname.startsWith("/interno/briefings/recebidos")||pathname.startsWith("/interno/dossies"))return "operation";
  if(pathname.startsWith("/interno/financeiro"))return "finance";
  if(pathname.startsWith("/interno/configuracoes/usuarios"))return null;
  if(pathname.startsWith("/interno/configuracoes")||pathname.startsWith("/interno/prontidao")||pathname.startsWith("/interno/briefings/modelos"))return "settings";
  return null;
}

async function loadAccess(user:User){
  const token=await user.getIdToken();
  const r=await fetch("/api/internal/access",{headers:{Authorization:`Bearer ${token}`}});
  if(!r.ok)throw new Error("access_failed");
  return r.json() as Promise<Access>;
}

export default function InternalAccessGate({children}:{children:ReactNode}){
  const pathname=usePathname();
  const [user,setUser]=useState<User|null>(firebaseAuth.currentUser);
  const [access,setAccess]=useState<Access|null>(null);
  const [ready,setReady]=useState(false);

  useEffect(()=>onAuthStateChanged(firebaseAuth,setUser),[]);
  useEffect(()=>{let cancelled=false;if(!user){setReady(true);return;}setReady(false);loadAccess(user).then(data=>{if(!cancelled)setAccess(data)}).catch(()=>{if(!cancelled)setAccess(null)}).finally(()=>{if(!cancelled)setReady(true)});return()=>{cancelled=true};},[user,pathname]);

  if(!ready)return <main className="min-h-[70vh] grid place-items-center text-white/50">Verificando acesso…</main>;
  const required=pageModule(pathname);
  const allowed=!required||access?.role==="admin"||Boolean(access?.permissions?.includes(required));
  if(!allowed)return <main className="min-h-[70vh] grid place-items-center px-6 text-white"><div className="max-w-md rounded-3xl border border-white/10 bg-white/[.025] p-8 text-center"><LockKeyhole className="mx-auto h-8 w-8 text-amber-200"/><h1 className="mt-4 text-xl font-semibold">Acesso restrito</h1><p className="mt-2 text-sm leading-6 text-white/45">Seu perfil não possui permissão para este módulo. Solicite a um administrador da ALGENRI caso precise deste acesso.</p><a href="/interno" className="mt-5 inline-flex rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 hover:bg-white/5">Voltar ao dashboard</a></div></main>;
  return <>{children}</>;
}
