import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { buildContractDocument } from "@/lib/contracts/document";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  try{
    await requireAlgenriInternalUser(request);
    const {id}=await params;
    const document=await buildContractDocument(id);
    return Response.json({ok:true,document});
  }catch(error){
    const auth=internalAuthResponse(error);if(auth)return auth;
    const code=error instanceof Error?error.message:"contract_document_failed";
    const status=code==="contract_not_found"?404:code==="contract_context_not_found"?409:500;
    return Response.json({ok:false,error:code},{status});
  }
}
