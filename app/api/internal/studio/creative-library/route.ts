import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getAdminDb } from "@/lib/firebase/admin";

const itemSchema = z.object({
  id: z.string().trim().max(120).optional(),
  kind: z.enum(["asset","character","environment","brandPreset","template"]),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(3000).default(""),
  tags: z.array(z.string().trim().max(60)).max(30).default([]),
  sourceUrl: z.string().trim().max(2000).optional(),
  storagePath: z.string().trim().max(1000).optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  isDefault: z.boolean().default(false),
  locked: z.boolean().default(false),
});

function iso(value:any){if(!value)return null;if(typeof value==="string")return value;if(typeof value?.toDate==="function")return value.toDate().toISOString();if(value instanceof Date)return value.toISOString();return null;}

export async function GET(request:Request){
  try{
    const user=await requireAlgenriInternalUser(request);
    const db=await getAdminDb();
    const snapshot=await db.collection("studioCreativeLibrary").where("ownerUid","==",user.uid).get();
    const items=snapshot.docs.map(doc=>{const data=doc.data() as Record<string,any>;return {id:doc.id,kind:data.kind,name:data.name,description:data.description||"",tags:Array.isArray(data.tags)?data.tags:[],sourceUrl:data.sourceUrl||"",storagePath:data.storagePath||"",metadata:data.metadata||{},isDefault:Boolean(data.isDefault),locked:Boolean(data.locked),createdAt:iso(data.createdAt),updatedAt:iso(data.updatedAt)}}).sort((a,b)=>String(a.kind).localeCompare(String(b.kind))||String(a.name).localeCompare(String(b.name)));
    return Response.json({ok:true,items});
  }catch(error){const auth=internalAuthResponse(error);if(auth)return auth;console.error("studio_creative_library_list_failed",error);return Response.json({ok:false,error:"studio_creative_library_list_failed"},{status:500});}
}

export async function POST(request:Request){
  try{
    const user=await requireAlgenriInternalUser(request);
    const parsed=itemSchema.safeParse(await request.json());
    if(!parsed.success)return Response.json({ok:false,error:"invalid_request",issues:parsed.error.issues},{status:400});
    const db=await getAdminDb();
    const data=parsed.data;
    const ref=data.id?db.collection("studioCreativeLibrary").doc(data.id):db.collection("studioCreativeLibrary").doc();
    if(data.id){const current=await ref.get();if(!current.exists||current.data()?.ownerUid!==user.uid)return Response.json({ok:false,error:"creative_item_not_found"},{status:404});}
    if(data.isDefault){const defaults=await db.collection("studioCreativeLibrary").where("ownerUid","==",user.uid).where("kind","==",data.kind).where("isDefault","==",true).get();await Promise.all(defaults.docs.filter(doc=>doc.id!==ref.id).map(doc=>doc.ref.set({isDefault:false,updatedAt:FieldValue.serverTimestamp()},{merge:true})));}
    await ref.set({ownerUid:user.uid,ownerEmail:user.email??null,kind:data.kind,name:data.name,description:data.description,tags:data.tags,sourceUrl:data.sourceUrl||"",storagePath:data.storagePath||"",metadata:data.metadata,isDefault:data.isDefault,locked:data.locked,updatedAt:FieldValue.serverTimestamp(),...(data.id?{}:{createdAt:FieldValue.serverTimestamp()})},{merge:true});
    return Response.json({ok:true,id:ref.id});
  }catch(error){const auth=internalAuthResponse(error);if(auth)return auth;console.error("studio_creative_library_save_failed",error);return Response.json({ok:false,error:"studio_creative_library_save_failed"},{status:500});}
}
