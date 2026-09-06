import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { createProposalVersion } from "@/lib/proposals/store";
export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function POST(request:Request,context:{params:Promise<{id:string}>}){ try{ const user=await requireAlgenriInternalUser(request); const {id}=await context.params; const proposal=await createProposalVersion(id,user.email??user.uid); return Response.json({ok:true,proposal},{status:201}); }catch(error){ const auth=internalAuthResponse(error); if(auth)return auth; const code=error instanceof Error?error.message:"proposal_version_failed"; return Response.json({ok:false,error:code},{status:code==="proposal_not_found"?404:500}); } }
