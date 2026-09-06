import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { changeContractStatus, type ContractStatus } from "@/lib/contracts/store";

export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{const user=await requireAlgenriInternalUser(request);const {id}=await params;const body=await request.json();const status=String(body.status??"") as ContractStatus;const contract=await changeContractStatus(id,status,user.email??user.uid);if(!contract)return Response.json({ok:false,error:"contract_not_found"},{status:404});return Response.json({ok:true,contract});}catch(error){const auth=internalAuthResponse(error);if(auth)return auth;const code=error instanceof Error?error.message:"contract_status_failed";return Response.json({ok:false,error:code},{status:["invalid_status","signed_file_required"].includes(code)?400:500});}}
