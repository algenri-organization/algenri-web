import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { getAdminDb } from "@/lib/firebase/admin";

const createSchema=z.object({title:z.string().trim().min(2).max(180),source:z.string().trim().min(2).max(180),category:z.string().trim().min(2).max(120),summary:z.string().trim().min(3).max(5000),application:z.string().trim().max(5000).optional(),tags:z.array(z.string().trim().min(1).max(60)).max(12).default([])});
function iso(value:any){if(!value)return null;if(typeof value==="string")return value;if(typeof value?.toDate==="function")return value.toDate().toISOString();return null;}

export async function GET(request:Request){
 try{const user=await requireAlgenriInternalUser(request);const db=await getAdminDb();const snapshot=await db.collection("labLearnings").where("ownerUid","==",user.uid).get();const items=snapshot.docs.map(doc=>{const d=doc.data();return{id:doc.id,title:d.title,source:d.source,category:d.category,summary:d.summary,application:d.application||"",tags:Array.isArray(d.tags)?d.tags:[],createdAt:iso(d.createdAt),updatedAt:iso(d.updatedAt)}}).sort((a,b)=>String(b.updatedAt||b.createdAt||"").localeCompare(String(a.updatedAt||a.createdAt||"")));return Response.json({ok:true,items});}
 catch(error){const auth=internalAuthResponse(error);if(auth)return auth;return Response.json({ok:false,error:"lab_learnings_load_failed"},{status:500});}
}

export async function POST(request:Request){
 try{const user=await requireAlgenriInternalUser(request);const parsed=createSchema.safeParse(await request.json().catch(()=>({})));if(!parsed.success)return Response.json({ok:false,error:"invalid_request",issues:parsed.error.issues},{status:400});const db=await getAdminDb();const ref=db.collection("labLearnings").doc();await ref.set({...parsed.data,ownerUid:user.uid,ownerEmail:user.email??null,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});return Response.json({ok:true,id:ref.id},{status:201});}
 catch(error){const auth=internalAuthResponse(error);if(auth)return auth;return Response.json({ok:false,error:"lab_learning_create_failed"},{status:500});}
}
