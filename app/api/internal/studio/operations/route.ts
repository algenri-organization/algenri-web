import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getAdminDb } from "@/lib/firebase/admin";

function summarize(project:Record<string,any>){
  const history=Array.isArray(project.generation?.sceneVersions)?project.generation.sceneVersions:Array.isArray(project.generation?.sceneJobs)?project.generation.sceneJobs:[];
  const actual=history.reduce((sum:number,j:any)=>sum+(typeof j.actualCredits==="number"?j.actualCredits:0),0);
  const estimated=history.reduce((sum:number,j:any)=>sum+(typeof j.estimatedCredits==="number"?j.estimatedCredits:0),0);
  return {actual,estimated,jobs:history.length};
}

export async function GET(request:Request){
  try{
    const user=await requireAlgenriInternalUser(request);const db=await getAdminDb();const snapshot=await db.collection("studioProjects").where("ownerUid","==",user.uid).get();
    const projects=snapshot.docs.map(doc=>{const data=doc.data() as Record<string,any>;const costs=summarize(data);return {id:doc.id,name:data.name||"Projeto",clientName:data.commercialLink?.clientName||null,status:data.operations?.approvalStatus||"internal_review",portalEnabled:Boolean(data.operations?.portal?.enabled),billableValue:typeof data.operations?.billableValue==="number"?data.operations.billableValue:null,currency:data.operations?.currency||"BRL",actualCredits:costs.actual,estimatedCredits:costs.estimated,jobs:costs.jobs,updatedAt:data.operations?.updatedAt||null};});
    const totals=projects.reduce((acc,p)=>({actualCredits:acc.actualCredits+p.actualCredits,estimatedCredits:acc.estimatedCredits+p.estimatedCredits,billableValue:acc.billableValue+(p.billableValue||0),projects:acc.projects+1}),{actualCredits:0,estimatedCredits:0,billableValue:0,projects:0});
    const statuses=projects.reduce((acc:Record<string,number>,p)=>{acc[p.status]=(acc[p.status]||0)+1;return acc;},{});
    return Response.json({ok:true,totals,statuses,projects});
  }catch(error){const auth=internalAuthResponse(error);if(auth)return auth;console.error("studio_operations_dashboard_failed",error);return Response.json({ok:false,error:"studio_operations_dashboard_failed"},{status:500});}
}
