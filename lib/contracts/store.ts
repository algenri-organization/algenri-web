import type { Query } from "firebase-admin/firestore";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import { getCommercialProposal } from "@/lib/proposals/store";
import { getClient, getProject, updateProject } from "@/lib/client-flow/store";

const CONTRACTS="commercial_contracts";
const COUNTERS="counters";
const TENANT=process.env.ALGENRI_TENANT_ID??"algenri";

export type ContractStatus="draft"|"awaiting_signature"|"signed"|"cancelled";
export type ContractRecord={
  id:string;tenantId:string;contractNumber:string;clientId:string;clientName:string;projectId:string;projectName:string;proposalId:string;proposalNumber:string;proposalVersion:string;
  status:ContractStatus;title:string;startDate:string;endDate:string;notes:string;
  initialValue:number;recurringMonthly:number;recurringAnnual:number;paymentTerms:string;
  signedFileName:string|null;signedFilePath:string|null;signedFileUploadedAt:string|null;signedFileUploadedBy:string|null;
  createdAt:string;createdBy:string;updatedAt:string;updatedBy:string;signedAt:string|null;cancelledAt:string|null;
};
const text=(v:unknown)=>typeof v==="string"?v.trim():"";

export async function listContracts(filters?:{projectId?:string;clientId?:string}){
  const db=await getAdminDb(); let q:Query=db.collection(CONTRACTS).where("tenantId","==",TENANT);
  if(filters?.projectId)q=q.where("projectId","==",filters.projectId); if(filters?.clientId)q=q.where("clientId","==",filters.clientId);
  const snap=await q.get(); return snap.docs.map(d=>d.data() as ContractRecord).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
}
export async function getContract(id:string){const db=await getAdminDb();const doc=await db.collection(CONTRACTS).doc(id).get();if(!doc.exists)return null;const data=doc.data() as ContractRecord;return data.tenantId===TENANT?data:null;}
export async function createContract(input:{proposalId:string;title?:string;startDate?:string;endDate?:string;notes?:string},createdBy:string){
  const proposal=await getCommercialProposal(input.proposalId); if(!proposal)throw new Error("proposal_not_found"); if(proposal.status!=="approved")throw new Error("proposal_not_approved");
  const project=await getProject(proposal.projectId); const client=await getClient(proposal.clientId); if(!project||!client)throw new Error("project_or_client_not_found");
  const existing=(await listContracts({projectId:proposal.projectId})).find(c=>c.proposalId===proposal.id&&c.status!=="cancelled"); if(existing)return existing;
  const db=await getAdminDb();const ref=db.collection(CONTRACTS).doc();const now=new Date();const iso=now.toISOString();const year=now.getFullYear();const counterRef=db.collection(COUNTERS).doc(`contract_${year}`);let record!:ContractRecord;
  await db.runTransaction(async tx=>{const c=await tx.get(counterRef);const next=(c.data()?.value??0)+1;record={id:ref.id,tenantId:TENANT,contractNumber:`CONT-${year}-${String(next).padStart(4,"0")}`,clientId:proposal.clientId,clientName:proposal.clientName,projectId:proposal.projectId,projectName:proposal.projectName,proposalId:proposal.id,proposalNumber:proposal.proposalNumber,proposalVersion:proposal.version,status:"draft",title:text(input.title)||`Contrato — ${proposal.projectName}`,startDate:text(input.startDate),endDate:text(input.endDate),notes:text(input.notes),initialValue:proposal.total,recurringMonthly:proposal.recurringMonthly,recurringAnnual:proposal.recurringAnnual,paymentTerms:proposal.paymentTerms,signedFileName:null,signedFilePath:null,signedFileUploadedAt:null,signedFileUploadedBy:null,createdAt:iso,createdBy,updatedAt:iso,updatedBy:createdBy,signedAt:null,cancelledAt:null};tx.set(counterRef,{value:next,updatedAt:iso},{merge:true});tx.set(ref,record);});
  if(project.status!=="contract")await updateProject(project.id,{status:"contract"});
  return record;
}
export async function updateContract(id:string,input:Record<string,unknown>,updatedBy:string){const current=await getContract(id);if(!current)return null;if(current.status==="signed"||current.status==="cancelled")throw new Error("contract_locked");const now=new Date().toISOString();const patch={title:text(input.title)||current.title,startDate:text(input.startDate),endDate:text(input.endDate),notes:text(input.notes),updatedAt:now,updatedBy};const db=await getAdminDb();await db.collection(CONTRACTS).doc(id).set(patch,{merge:true});return getContract(id);}
export async function changeContractStatus(id:string,status:ContractStatus,updatedBy:string){const current=await getContract(id);if(!current)return null;const allowed:ContractStatus[]=["draft","awaiting_signature","signed","cancelled"];if(!allowed.includes(status))throw new Error("invalid_status");if(status==="signed"&&!current.signedFilePath)throw new Error("signed_file_required");const now=new Date().toISOString();const patch:any={status,updatedAt:now,updatedBy};if(status==="signed")patch.signedAt=now;if(status==="cancelled")patch.cancelledAt=now;const db=await getAdminDb();await db.collection(CONTRACTS).doc(id).set(patch,{merge:true});if(status==="signed")await updateProject(current.projectId,{status:"development"});return getContract(id);}
export async function uploadSignedContract(id:string,file:File,uploadedBy:string){const current=await getContract(id);if(!current)throw new Error("contract_not_found");if(current.status==="cancelled")throw new Error("contract_locked");if(file.type!=="application/pdf")throw new Error("pdf_required");if(file.size>15*1024*1024)throw new Error("file_too_large");const storage=await getAdminStorage();const safeName=file.name.replace(/[^a-zA-Z0-9._-]+/g,"-");const path=`contracts/${TENANT}/${current.id}/${Date.now()}-${safeName}`;const buffer=Buffer.from(await file.arrayBuffer());await storage.bucket().file(path).save(buffer,{contentType:"application/pdf",metadata:{cacheControl:"private, max-age=0"}});const now=new Date().toISOString();const db=await getAdminDb();await db.collection(CONTRACTS).doc(id).set({signedFileName:file.name,signedFilePath:path,signedFileUploadedAt:now,signedFileUploadedBy:uploadedBy,updatedAt:now,updatedBy:uploadedBy},{merge:true});return getContract(id);}
export async function getSignedContractDownloadUrl(id:string){const current=await getContract(id);if(!current||!current.signedFilePath)return null;const storage=await getAdminStorage();const [url]=await storage.bucket().file(current.signedFilePath).getSignedUrl({action:"read",expires:Date.now()+10*60*1000});return url;}
