import "server-only";

const BASE_URL=process.env.MINIMAX_API_BASE_URL||"https://api.minimax.io";
export const MINIMAX_DEFAULT_MODEL=process.env.MINIMAX_TTS_MODEL||"speech-2.8-hd";

export function getMiniMaxAudioIntegrationStatus(){
 const configured=Boolean(process.env.MINIMAX_API_KEY);
 return {configured,environmentVariable:"MINIMAX_API_KEY",baseUrl:BASE_URL,defaultModel:MINIMAX_DEFAULT_MODEL,serverSideOnly:true};
}

function apiKey(){const key=process.env.MINIMAX_API_KEY;if(!key)throw new Error("minimax_not_configured");return key;}

export async function generateMiniMaxSpeech(input:{text:string;voiceId:string;model?:string;speed?:number;volume?:number;pitch?:number;emotion?:string;format?:"mp3"|"wav"|"flac"|"pcm"}){
 const response=await fetch(`${BASE_URL}/v1/t2a_v2`,{
  method:"POST",headers:{Authorization:`Bearer ${apiKey()}`,"Content-Type":"application/json"},
  body:JSON.stringify({model:input.model||MINIMAX_DEFAULT_MODEL,text:input.text,stream:false,language_boost:"Portuguese",output_format:"hex",voice_setting:{voice_id:input.voiceId,speed:input.speed??1,vol:input.volume??1,pitch:input.pitch??0,...(input.emotion?{emotion:input.emotion}:{})},audio_setting:{format:input.format||"mp3",sample_rate:32000,bitrate:128000,channel:1}}),
 });
 const payload=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(`minimax_api_${response.status}`);
 const statusCode=payload?.base_resp?.status_code;
 if(statusCode!==undefined&&statusCode!==0)throw new Error(`minimax_api_${statusCode}:${String(payload?.base_resp?.status_msg||"")}`);
 const audio=payload?.data?.audio;
 if(typeof audio!=="string"||!audio)throw new Error("minimax_audio_missing");
 return Buffer.from(audio,"hex");
}
