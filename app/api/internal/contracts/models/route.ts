import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { listPublishedContractModels } from "@/lib/contracts/document-models";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(request:Request){
  try{
    await requireAlgenriInternalUser(request);
    return Response.json({ok:true,models:await listPublishedContractModels()});
  }catch(error){
    const auth=internalAuthResponse(error);if(auth)return auth;
    console.error("Contract document model list failed",error);
    return Response.json({ok:false,error:"contract_document_model_list_failed"},{status:500});
  }
}
