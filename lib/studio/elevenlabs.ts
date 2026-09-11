import "server-only";

const BASE_URL="https://api.elevenlabs.io/v1";
export const ELEVENLABS_DEFAULT_MODEL="eleven_multilingual_v2";

export function getElevenLabsIntegrationStatus(){
 const configured=Boolean(process.env.ELEVENLABS_API_KEY);
 return {configured,environmentVariable:"ELEVENLABS_API_KEY",baseUrl:BASE_URL,defaultModel:ELEVENLABS_DEFAULT_MODEL,serverSideOnly:true};
}

function apiKey(){const key=process.env.ELEVENLABS_API_KEY;if(!key)throw new Error("elevenlabs_not_configured");return key;}

export async function listElevenLabsVoices(){
 const response=await fetch(`${BASE_URL}/voices`,{headers:{"xi-api-key":apiKey()},cache:"no-store"});
 const payload=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(`elevenlabs_api_${response.status}`);
 return Array.isArray(payload.voices)?payload.voices:[];
}

export async function generateElevenLabsSpeech(input:{text:string;voiceId:string;modelId?:string;stability?:number;similarityBoost?:number;style?:number;speed?:number;pronunciationDictionaryLocators?:Array<{pronunciation_dictionary_id:string;version_id:string}>}){
 const response=await fetch(`${BASE_URL}/text-to-speech/${encodeURIComponent(input.voiceId)}`,{
  method:"POST",headers:{"xi-api-key":apiKey(),"Content-Type":"application/json","Accept":"audio/mpeg"},
  body:JSON.stringify({text:input.text,model_id:input.modelId||ELEVENLABS_DEFAULT_MODEL,voice_settings:{stability:input.stability??0.5,similarity_boost:input.similarityBoost??0.75,style:input.style??0,speed:input.speed??1,use_speaker_boost:true},...(input.pronunciationDictionaryLocators?.length?{pronunciation_dictionary_locators:input.pronunciationDictionaryLocators}:{})}),
 });
 if(!response.ok){const text=await response.text().catch(()=>"");throw new Error(`elevenlabs_api_${response.status}:${text.slice(0,300)}`);}
 return Buffer.from(await response.arrayBuffer());
}
