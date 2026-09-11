import { z } from "zod";
import { internalAuthResponse, requireAlgenriInternalUser } from "@/lib/briefing/internal-auth";
import { generateElevenLabsSpeech, getElevenLabsIntegrationStatus } from "@/lib/studio/elevenlabs";
import { generateMiniMaxSpeech, getMiniMaxAudioIntegrationStatus } from "@/lib/studio/minimax-audio";

const schema=z.object({provider:z.enum(["elevenlabs","minimax"]),text:z.string().trim().min(1).max(1200),voiceId:z.string().trim().min(1).max(240),model:z.string().trim().max(120).optional(),speed:z.number().min(0.5).max(2).optional(),stability:z.number().min(0).max(1).optional(),similarityBoost:z.number().min(0).max(1).optional(),style:z.number().min(0).max(1).optional(),volume:z.number().min(0.1).max(10).optional(),pitch:z.number().min(-12).max(12).optional(),emotion:z.string().trim().max(40).optional()});

export async function GET(request:Request){
 try{await requireAlgenriInternalUser(request);return Response.json({ok:true,providers:{elevenlabs:getElevenLabsIntegrationStatus(),minimax:getMiniMaxAudioIntegrationStatus()}});}catch(error){const auth=internalAuthResponse(error);if(auth)return auth;return Response.json({ok:false,error:"studio_voice_status_failed"},{status:500});}
}

export async function POST(request:Request){
 try{await requireAlgenriInternalUser(request);const parsed=schema.safeParse(await request.json().catch(()=>({})));if(!parsed.success)return Response.json({ok:false,error:"invalid_request",issues:parsed.error.issues},{status:400});const input=parsed.data;let audio:Buffer;if(input.provider==="elevenlabs")audio=await generateElevenLabsSpeech({text:input.text,voiceId:input.voiceId,modelId:input.model,stability:input.stability,similarityBoost:input.similarityBoost,style:input.style,speed:input.speed});else audio=await generateMiniMaxSpeech({text:input.text,voiceId:input.voiceId,model:input.model,speed:input.speed,volume:input.volume,pitch:input.pitch,emotion:input.emotion,format:"mp3"});const bytes=new Uint8Array(audio);return new Response(bytes,{headers:{"Content-Type":"audio/mpeg","Cache-Control":"no-store","Content-Disposition":"inline; filename=studio-voice-preview.mp3"}});}
 catch(error){const auth=internalAuthResponse(error);if(auth)return auth;const code=error instanceof Error?error.message:"studio_voice_preview_failed";console.error("studio_voice_preview_failed",error);const status=code.includes("not_configured")?409:502;return Response.json({ok:false,error:code},{status});}
}
