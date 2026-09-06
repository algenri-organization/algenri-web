import type { Query } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { getClient, getProject } from "@/lib/client-flow/store";
import { getProjectDossier } from "@/lib/dossiers/store";

const PROPOSALS = "commercial_proposals";
const COUNTERS = "counters";
const TENANT = process.env.ALGENRI_TENANT_ID ?? "algenri";

export type ProposalStatus = "draft"|"in_review"|"ready_to_send"|"sent"|"negotiation"|"approved"|"rejected"|"expired"|"archived";
export type ProposalSection = { id:string; key:string; title:string; content:string; order:number; source:"system"|"dossier"|"manual"|"ai"; editable:boolean };
export type InvestmentItem = { id:string; description:string; quantity:number; unitValue:number; totalValue:number; billingType:"one_time"|"recurring"; recurrence:"monthly"|"annual"|"custom"|null; order:number };
export type OptionalItem = { id:string; description:string; value:number; billingType:"one_time"|"recurring"; recurrence:"monthly"|"annual"|"custom"|null; selected:boolean; order:number };
export type CommercialProposalRecord = {
  id:string; tenantId:string; clientId:string; clientName:string; projectId:string; projectName:string;
  sourceDossierId:string|null; sourceDossierVersion:string|null; proposalGroupId:string; proposalNumber:string; version:string; previousVersionId:string|null;
  status:ProposalStatus; title:string; summary:string; sections:ProposalSection[]; investmentItems:InvestmentItem[]; optionalItems:OptionalItem[];
  subtotal:number; discountType:"none"|"fixed"|"percentage"; discountValue:number; total:number; recurringMonthly:number; recurringAnnual:number;
  paymentTerms:string; validityDate:string; validityDays:number; commercialConditions:string; observations:string;
  createdBy:string; createdAt:string; updatedBy:string; updatedAt:string; sentAt:string|null; approvedAt:string|null; rejectedAt:string|null; archivedAt:string|null;
};

const DEFAULT_SECTIONS:[string,string][] = [
  ["company_presentation","Apresentação da ALGENRI"],["project_context","Contexto do Projeto"],["proposal_objective","Objetivo da Proposta"],["scope","Escopo dos Serviços"],["deliverables","Entregáveis"],["exclusions","Itens Não Incluídos"],["schedule","Cronograma Estimado"],["client_responsibilities","Premissas e Responsabilidades do Cliente"],["commercial_conditions","Condições Comerciais"],["next_steps","Próximos Passos"]
];
const text=(v:unknown)=>typeof v==="string"?v.trim():"";
const num=(v:unknown)=>Number.isFinite(Number(v))?Number(v):0;
function recalc(items:InvestmentItem[], discountType:CommercialProposalRecord["discountType"], discountValue:number){
  const oneTime=items.filter(i=>i.billingType==="one_time").reduce((s,i)=>s+i.totalValue,0);
  const monthly=items.filter(i=>i.billingType==="recurring"&&i.recurrence==="monthly").reduce((s,i)=>s+i.totalValue,0);
  const annual=items.filter(i=>i.billingType==="recurring"&&i.recurrence==="annual").reduce((s,i)=>s+i.totalValue,0);
  const subtotal=oneTime; const discount=discountType==="fixed"?Math.min(discountValue,subtotal):discountType==="percentage"?subtotal*Math.min(Math.max(discountValue,0),100)/100:0;
  return { subtotal, total:Math.max(0,subtotal-discount), recurringMonthly:monthly, recurringAnnual:annual };
}
function normalizeItems(raw:unknown):InvestmentItem[]{ return Array.isArray(raw)?raw.map((x:any,i)=>{const q=Math.max(0,num(x.quantity)||1),u=Math.max(0,num(x.unitValue));return { id:text(x.id)||`item-${i+1}`,description:text(x.description),quantity:q,unitValue:u,totalValue:q*u,billingType:x.billingType==="recurring"?"recurring":"one_time",recurrence:x.billingType==="recurring"?(x.recurrence||"monthly"):null,order:i }}):[]; }
function defaultSections(dossier?:Awaited<ReturnType<typeof getProjectDossier>>):ProposalSection[]{
  const source=new Map((dossier?.sections??[]).map(s=>[s.key,s.content]));
  return DEFAULT_SECTIONS.map(([key,title],order)=>({id:key,key,title,content:source.get(key)||source.get(key==="project_context"?"client_context":key==="scope"?"recommended_scope":key)||"",order,source:source.has(key)?"dossier":"system",editable:true}));
}
export async function listCommercialProposals(filters?:{projectId?:string;clientId?:string}){
  const db=await getAdminDb(); let q:Query=db.collection(PROPOSALS).where("tenantId","==",TENANT); if(filters?.projectId)q=q.where("projectId","==",filters.projectId); if(filters?.clientId)q=q.where("clientId","==",filters.clientId);
  const snap=await q.get(); return snap.docs.map(d=>d.data() as CommercialProposalRecord).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
}
export async function getCommercialProposal(id:string){ const db=await getAdminDb(); const doc=await db.collection(PROPOSALS).doc(id).get(); if(!doc.exists)return null; const p=doc.data() as CommercialProposalRecord; return p.tenantId===TENANT?p:null; }
export async function createCommercialProposal(input:{projectId:string;dossierId?:string;title?:string;validityDays?:number}, createdBy:string){
  const project=await getProject(input.projectId); if(!project)throw new Error("project_not_found"); const client=await getClient(project.clientId); if(!client)throw new Error("client_not_found");
  const dossier=input.dossierId?await getProjectDossier(input.dossierId):null; if(input.dossierId&&(!dossier||dossier.projectId!==project.id))throw new Error("dossier_not_found");
  const db=await getAdminDb(); const ref=db.collection(PROPOSALS).doc(); const groupId=ref.id; const now=new Date(); const iso=now.toISOString(); const year=now.getFullYear(); const counterRef=db.collection(COUNTERS).doc(`proposal_${year}`);
  const validityDays=Math.max(1,Number(input.validityDays)||15); const validity=new Date(now); validity.setDate(validity.getDate()+validityDays);
  let record!:CommercialProposalRecord;
  await db.runTransaction(async tx=>{ const counter=await tx.get(counterRef); const next=(counter.data()?.value??0)+1; const proposalNumber=`PROP-${year}-${String(next).padStart(4,"0")}`; record={
    id:ref.id,tenantId:TENANT,clientId:client.id,clientName:client.tradeName||client.legalName,projectId:project.id,projectName:project.name,sourceDossierId:dossier?.id??null,sourceDossierVersion:dossier?.version??null,
    proposalGroupId:groupId,proposalNumber,version:"1.0",previousVersionId:null,status:"draft",title:text(input.title)||`Proposta Comercial — ${project.name}`,summary:"",sections:defaultSections(dossier),investmentItems:[],optionalItems:[],subtotal:0,discountType:"none",discountValue:0,total:0,recurringMonthly:0,recurringAnnual:0,paymentTerms:"",validityDate:validity.toISOString().slice(0,10),validityDays,commercialConditions:"",observations:"",createdBy,createdAt:iso,updatedBy:createdBy,updatedAt:iso,sentAt:null,approvedAt:null,rejectedAt:null,archivedAt:null}; tx.set(counterRef,{value:next,updatedAt:iso},{merge:true}); tx.set(ref,record); }); return record;
}
export async function updateCommercialProposal(id:string,input:Record<string,unknown>,updatedBy:string){
  const current=await getCommercialProposal(id); if(!current)return null; if(!["draft","in_review"].includes(current.status))throw new Error("proposal_locked");
  const items=normalizeItems(input.investmentItems??current.investmentItems); const discountType=(text(input.discountType)||current.discountType) as CommercialProposalRecord["discountType"]; const discountValue=Math.max(0,num(input.discountValue??current.discountValue)); const totals=recalc(items,discountType,discountValue);
  const sections=Array.isArray(input.sections)?(input.sections as any[]).map((s,i)=>({...s,order:i,id:text(s.id)||`section-${i+1}`,title:text(s.title),content:text(s.content),source:s.source||"manual",editable:true})):current.sections;
  const patch:CommercialProposalRecord={...current,title:text(input.title)||current.title,summary:text(input.summary),sections,investmentItems:items,optionalItems:Array.isArray(input.optionalItems)?input.optionalItems as OptionalItem[]:current.optionalItems,discountType,discountValue,...totals,paymentTerms:text(input.paymentTerms),validityDate:text(input.validityDate)||current.validityDate,commercialConditions:text(input.commercialConditions),observations:text(input.observations),updatedBy,updatedAt:new Date().toISOString()};
  const db=await getAdminDb(); await db.collection(PROPOSALS).doc(id).set(patch); return patch;
}
export async function changeProposalStatus(id:string,status:ProposalStatus,updatedBy:string){
  const current=await getCommercialProposal(id); if(!current)return null; const now=new Date().toISOString(); const patch:any={status,updatedBy,updatedAt:now}; if(status==="sent")patch.sentAt=current.sentAt??now; if(status==="approved")patch.approvedAt=now; if(status==="rejected")patch.rejectedAt=now; if(status==="archived")patch.archivedAt=now;
  const db=await getAdminDb(); await db.collection(PROPOSALS).doc(id).set(patch,{merge:true}); return getCommercialProposal(id);
}
function bumpVersion(v:string){ const [maj,min]=v.split(".").map(Number); return `${Number.isFinite(maj)?maj:1}.${(Number.isFinite(min)?min:0)+1}`; }
export async function createProposalVersion(id:string,createdBy:string){ const current=await getCommercialProposal(id); if(!current)throw new Error("proposal_not_found"); const db=await getAdminDb(); const ref=db.collection(PROPOSALS).doc(); const now=new Date().toISOString(); const next:CommercialProposalRecord={...current,id:ref.id,version:bumpVersion(current.version),previousVersionId:current.id,status:"draft",createdBy,createdAt:now,updatedBy:createdBy,updatedAt:now,sentAt:null,approvedAt:null,rejectedAt:null,archivedAt:null}; await ref.set(next); return next; }
