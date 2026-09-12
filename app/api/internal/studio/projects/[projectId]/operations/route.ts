import { randomBytes } from "node:crypto";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireStudioProjectOwner, studioApiError } from "@/lib/studio/project-auth";

const saveSchema = z.object({
  action: z.enum(["save", "enable_portal", "disable_portal"]),
  approvalStatus: z.enum(["internal_review", "ready_for_client", "changes_requested", "approved"]).optional(),
  internalNotes: z.string().max(6000).optional(),
  clientNotes: z.string().max(6000).optional(),
  billableValue: z.number().min(0).max(100000000).optional(),
  currency: z.string().trim().min(3).max(8).optional(),
});

function summarizeCosts(project: Record<string, any>) {
  const history = Array.isArray(project.generation?.sceneVersions) ? project.generation.sceneVersions : Array.isArray(project.generation?.sceneJobs) ? project.generation.sceneJobs : [];
  const rows = history.map((job: any) => ({ provider: String(job.provider || "unknown"), credits: typeof job.actualCredits === "number" ? job.actualCredits : 0, estimatedCredits: typeof job.estimatedCredits === "number" ? job.estimatedCredits : 0 }));
  const byProvider: Record<string, { actualCredits:number; estimatedCredits:number; jobs:number }> = {};
  for (const row of rows) {
    const current = byProvider[row.provider] || { actualCredits:0, estimatedCredits:0, jobs:0 };
    current.actualCredits += row.credits; current.estimatedCredits += row.estimatedCredits; current.jobs += 1; byProvider[row.provider] = current;
  }
  return {
    actualCredits: rows.reduce((sum:number,row:any)=>sum+row.credits,0),
    estimatedCredits: rows.reduce((sum:number,row:any)=>sum+row.estimatedCredits,0),
    jobs: rows.length,
    byProvider,
  };
}

export async function GET(request: Request, context:{params:Promise<{projectId:string}>}) {
  try {
    const {projectId}=await context.params; const auth=await requireStudioProjectOwner(request,projectId); if(!auth.ok)return auth.response;
    const ops=auth.project.operations||{};
    return Response.json({ok:true,operations:ops,costs:summarizeCosts(auth.project)});
  } catch(error) {
    return studioApiError(error,"studio_operations_load_failed");
  }
}

export async function POST(request: Request, context:{params:Promise<{projectId:string}>}) {
  try {
    const {projectId}=await context.params; const auth=await requireStudioProjectOwner(request,projectId); if(!auth.ok)return auth.response;
    const parsed=saveSchema.safeParse(await request.json().catch(()=>({}))); if(!parsed.success)return Response.json({ok:false,error:"invalid_request",issues:parsed.error.issues},{status:400});
    const db=await getAdminDb(); const current=auth.project.operations||{}; const action=parsed.data.action;
    let portal=current.portal||{enabled:false,token:null,enabledAt:null};
    if(action==="enable_portal") portal={enabled:true,token:portal.token||randomBytes(24).toString("hex"),enabledAt:new Date().toISOString()};
    if(action==="disable_portal") portal={...portal,enabled:false};
    const next={
      approvalStatus:parsed.data.approvalStatus??current.approvalStatus??"internal_review",
      internalNotes:parsed.data.internalNotes??current.internalNotes??"",
      clientNotes:parsed.data.clientNotes??current.clientNotes??"",
      billableValue:parsed.data.billableValue??current.billableValue??null,
      currency:parsed.data.currency??current.currency??"BRL",
      portal,
      updatedAt:new Date().toISOString(),
    };
    await db.collection("studioProjects").doc(projectId).set({operations:next,updatedAt:FieldValue.serverTimestamp()},{merge:true});
    return Response.json({ok:true,operations:next,costs:summarizeCosts(auth.project)});
  } catch(error) {
    return studioApiError(error,"studio_operations_save_failed");
  }
}
