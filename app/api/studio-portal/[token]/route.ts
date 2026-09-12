import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";

const feedbackSchema=z.object({action:z.enum(["approve","request_changes","comment"]),comment:z.string().trim().max(4000).optional()});

async function findProject(token:string){
  const db=await getAdminDb();
  const snapshot=await db.collection("studioProjects").where("operations.portal.token","==",token).limit(1).get();
  if(snapshot.empty)return null;
  const doc=snapshot.docs[0]; const data=doc.data() as Record<string,any>;
  if(!data.operations?.portal?.enabled)return null;
  return {id:doc.id,data};
}

function publicPayload(project:{id:string;data:Record<string,any>}){
  const p=project.data; const finalRender=p.finalRender||{}; const operations=p.operations||{};
  return {
    id:project.id,
    name:p.name||"Projeto Studio",
    clientName:p.commercialLink?.clientName||null,
    destination:p.briefing?.destination||null,
    durationSeconds:p.briefing?.durationSeconds||null,
    aspectRatio:p.briefing?.aspectRatio||null,
    approvalStatus:operations.approvalStatus||"internal_review",
    clientNotes:operations.clientNotes||"",
    outputUrl:finalRender.state==="completed"?finalRender.outputUrl||null:null,
    delivery:p.delivery?{variants:p.delivery.variants||[],captions:p.delivery.captions||null}:null,
    feedback:Array.isArray(operations.feedback)?operations.feedback.map((item:any)=>({action:item.action,comment:item.comment||"",createdAt:item.createdAt||null})):[],
  };
}

export async function GET(_request:Request,context:{params:Promise<{token:string}>}){
  try{const {token}=await context.params;const project=await findProject(token);if(!project)return Response.json({ok:false,error:"not_found"},{status:404});return Response.json({ok:true,project:publicPayload(project)});}catch(error){console.error("studio_portal_load_failed",error);return Response.json({ok:false,error:"studio_portal_load_failed"},{status:500});}
}

export async function POST(request:Request,context:{params:Promise<{token:string}>}){
  try{
    const {token}=await context.params;const project=await findProject(token);if(!project)return Response.json({ok:false,error:"not_found"},{status:404});
    const parsed=feedbackSchema.safeParse(await request.json().catch(()=>({})));if(!parsed.success)return Response.json({ok:false,error:"invalid_request"},{status:400});
    const current=project.data.operations||{};const feedback=Array.isArray(current.feedback)?current.feedback:[];
    const entry={action:parsed.data.action,comment:parsed.data.comment||"",createdAt:new Date().toISOString()};
    const approvalStatus=parsed.data.action==="approve"?"approved":parsed.data.action==="request_changes"?"changes_requested":current.approvalStatus||"ready_for_client";
    const db=await getAdminDb();await db.collection("studioProjects").doc(project.id).set({operations:{...current,approvalStatus,feedback:[...feedback,entry],updatedAt:new Date().toISOString()},updatedAt:FieldValue.serverTimestamp()},{merge:true});
    return Response.json({ok:true,approvalStatus,entry});
  }catch(error){console.error("studio_portal_feedback_failed",error);return Response.json({ok:false,error:"studio_portal_feedback_failed"},{status:500});}
}
