import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { Sandbox } from "@vercel/sandbox";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import { getStudioProject } from "@/lib/studio/project-store";
import type { StudioFinalRenderManifest, StudioFinalRenderScene } from "@/lib/studio/final-render";

const RENDER_TIMEOUT_MS=12*60*1000;
const SIGNED_URL_TTL_MS=25*60*1000;
const FAILURE_GRACE_MS=14*60*1000;
const BRAND_LOGO_STORAGE_PATH="studio/brand/algenri-logo.webp";

function shQuote(value:string){return `'${value.replace(/'/g, `'"'"'`)}'`;}
function dimensions(aspectRatio:StudioFinalRenderManifest["aspectRatio"]){if(aspectRatio==="9:16")return{width:1080,height:1920};if(aspectRatio==="1:1")return{width:1080,height:1080};return{width:1920,height:1080};}
function normalizeComparable(value:string){return value.trim().toLocaleLowerCase("pt-BR").replace(/\s+/g," ");}
function clamp(value:number,min:number,max:number){return Math.min(max,Math.max(min,value));}
function wrapText(value:string,maxChars:number,maxLines:number){const words=value.trim().split(/\s+/).filter(Boolean);const lines:string[]=[];let line="";for(const rawWord of words){const word=rawWord.length>maxChars?`${rawWord.slice(0,Math.max(1,maxChars-1))}…`:rawWord;const next=line?`${line} ${word}`:word;if(next.length>maxChars&&line){lines.push(line);line=word;if(lines.length===maxLines)break;}else line=next;}if(lines.length<maxLines&&line)lines.push(line);return lines.join("\n");}
function textFileLine(filePath:string,text:string){const encoded=Buffer.from(text,"utf8").toString("base64");return `printf %s ${shQuote(encoded)} | base64 -d > ${shQuote(filePath)}`;}
function drawText(input:string,output:string,textPath:string,options:{x:string;y:string;size:number;bold?:boolean;box?:boolean;boxColor?:string}){const font=options.bold?"/usr/share/fonts/dejavu-sans-fonts/DejaVuSans-Bold.ttf":"/usr/share/fonts/dejavu-sans-fonts/DejaVuSans.ttf";const box=options.box===false?"box=0":`box=1:boxcolor=${options.boxColor||"0x0b2536@0.82"}:boxborderw=14`;return `${input}drawtext=fontfile='${font}':textfile='${textPath}':fontcolor=white:fontsize=${options.size}:${box}:x=${options.x}:y=${options.y}:line_spacing=10${output}`;}

function sceneLayout(scene:StudioFinalRenderScene,manifest:StudioFinalRenderManifest){
  const vertical=manifest.aspectRatio==="9:16";const square=manifest.aspectRatio==="1:1";const safe=vertical?0.08:square?0.07:0.06;const preset=manifest.preset||"editorial";
  const panelHeight=preset==="commercial"?(vertical?0.34:0.32):preset==="minimal"?(vertical?0.24:0.22):(vertical?0.31:0.30);
  const panelWidth=clamp(Number(scene.overlay.widthPercent??84)/100,0.28,0.94);
  const baseX=scene.overlay.align==="center"?(1-panelWidth)/2:scene.overlay.align==="right"?1-safe-panelWidth:safe;
  const panelX=clamp(baseX+Number(scene.overlay.offsetX??0)/100,0.02,0.98-panelWidth);
  const baseTop=scene.overlay.position==="top"?(vertical?0.12:0.10):scene.overlay.position==="bottom"?0.98-panelHeight:(vertical?0.34:0.33);
  const panelY=clamp(baseTop+Number(scene.overlay.offsetY??0)/100,0.02,0.98-panelHeight);
  const padding=vertical?0.025:0.018;
  const textX=scene.overlay.align==="center"?`w*${(panelX+panelWidth/2).toFixed(4)}-text_w/2`:scene.overlay.align==="right"?`w*${(panelX+panelWidth-padding).toFixed(4)}-text_w`:`w*${(panelX+padding).toFixed(4)}`;
  const scale=clamp(Number(scene.overlay.scalePercent??100)/100,0.50,1.50);
  const panelOpacity=clamp(Number(scene.overlay.panelOpacity??58)/100,0,0.90);
  const logoBaseWidth=vertical?0.22:square?0.19:0.16;
  const logoWidth=clamp(logoBaseWidth*(Number(scene.overlay.logoScalePercent??100)/100),0.06,0.48);
  const logoX=clamp(safe+Number(scene.overlay.logoOffsetX??0)/100,0.02,0.98-logoWidth);
  const logoY=clamp((vertical?0.04:0.035)+Number(scene.overlay.logoOffsetY??0)/100,0.02,0.90);
  return{vertical,preset,panelHeight,panelWidth,panelX,panelY,padding,textX,scale,panelOpacity,logoWidth,logoX,logoY};
}

function buildRenderScript(manifest:StudioFinalRenderManifest,sceneUrls:string[],brandLogoUrl:string,outputUrl:string,statusUrl:string){
  const {width,height}=dimensions(manifest.aspectRatio);
  const lines=["set -euo pipefail","cd /tmp",`STATUS_URL=${shQuote(statusUrl)}`,"STEP=bootstrap","report_failed() { code=$?; detail=$( (tail -c 1800 /tmp/bootstrap.log 2>/dev/null || true; tail -c 2200 /tmp/render.log 2>/dev/null || true) | tr '\\n' ' ' | tr -cd '[:print:]' ); printf 'failed:%s:%s:%s' \"$code\" \"${STEP:-unknown}\" \"$detail\" | curl -fsS --retry 2 -X PUT -H 'Content-Type: text/plain' --data-binary @- \"$STATUS_URL\" >/dev/null 2>&1 || true; exit \"$code\"; }","trap report_failed ERR","FFMPEG=$(command -v ffmpeg || true)","if [ -z \"$FFMPEG\" ]; then","  ARCH=$(uname -m)","  case \"$ARCH\" in","    x86_64|amd64) FFMPEG_ARCH=linux64 ;;","    aarch64|arm64) FFMPEG_ARCH=linuxarm64 ;;","    *) echo \"unsupported architecture: $ARCH\" >/tmp/bootstrap.log; false ;;","  esac","  sudo dnf install -y xz dejavu-sans-fonts >/tmp/bootstrap.log 2>&1","  FFMPEG_URL=\"https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-${FFMPEG_ARCH}-gpl.tar.xz\"","  curl -fL --retry 3 --connect-timeout 20 \"$FFMPEG_URL\" -o /tmp/ffmpeg.tar.xz >>/tmp/bootstrap.log 2>&1","  rm -rf /tmp/ffmpeg-dist && mkdir -p /tmp/ffmpeg-dist","  tar -xJf /tmp/ffmpeg.tar.xz --strip-components=1 -C /tmp/ffmpeg-dist >>/tmp/bootstrap.log 2>&1","  FFMPEG=/tmp/ffmpeg-dist/bin/ffmpeg","fi","sudo dnf install -y dejavu-sans-fonts >>/tmp/bootstrap.log 2>&1 || true","FFPROBE=\"$(dirname \"$FFMPEG\")/ffprobe\"","if [ ! -x \"$FFPROBE\" ]; then FFPROBE=$(command -v ffprobe || true); fi","test -x \"$FFMPEG\"","test -x \"$FFPROBE\"","test -f /usr/share/fonts/dejavu-sans-fonts/DejaVuSans.ttf","STEP=verify_ffmpeg","\"$FFMPEG\" -hide_banner -filters > /tmp/filters.txt 2>/tmp/render.log","grep -q ' drawtext ' /tmp/filters.txt","STEP=download_brand_logo",`curl -fsSL --retry 3 ${shQuote(brandLogoUrl)} -o /tmp/brand-logo`];
  sceneUrls.forEach((url,index)=>{const duration=Math.max(1,Number(manifest.scenes[index]?.durationSeconds||1));lines.push(`STEP=download_scene_${index}`,`curl -fsSL --retry 3 ${shQuote(url)} -o ${shQuote(`scene-${index}.mp4`)}`,`STEP=prepare_audio_${index}`,`\"$FFPROBE\" -v error -select_streams a:0 -show_entries stream=index -of csv=p=0 ${shQuote(`/tmp/scene-${index}.mp4`)} > ${shQuote(`/tmp/audio-probe-${index}.txt`)} 2>/tmp/render.log || true`,`if grep -q . ${shQuote(`/tmp/audio-probe-${index}.txt`)}; then`,`  \"$FFMPEG\" -hide_banner -loglevel error -y -i ${shQuote(`/tmp/scene-${index}.mp4`)} -map 0:a:0 -vn -ac 2 -ar 48000 -af ${shQuote(`atrim=duration=${duration},asetpts=PTS-STARTPTS`)} ${shQuote(`/tmp/audio-${index}.wav`)} 2>>/tmp/render.log`,`else`,`  \"$FFMPEG\" -hide_banner -loglevel error -y -f lavfi -i anullsrc=r=48000:cl=stereo -t ${duration} -c:a pcm_s16le ${shQuote(`/tmp/audio-${index}.wav`)} 2>>/tmp/render.log`,`fi`);});

  const filters:string[]=[];const sceneOutputs:string[]=[];const audioOutputs:string[]=[];const sceneCount=manifest.scenes.length;const brandInputIndex=sceneCount*2;
  const brandedSceneIndices=manifest.scenes.map((scene,index)=>scene.overlay.enabled&&scene.overlay.showBrand&&(manifest.brand.mode==="algenri"||manifest.brand.mode==="asset")?index:-1).filter(index=>index>=0);
  if(brandedSceneIndices.length===1){filters.push(`[${brandInputIndex}:v]format=rgba[logobase${brandedSceneIndices[0]}]`);}else if(brandedSceneIndices.length>1){filters.push(`[${brandInputIndex}:v]format=rgba,split=${brandedSceneIndices.length}${brandedSceneIndices.map(index=>`[logobase${index}]`).join("")}`);}
  for(const index of brandedSceneIndices){const layout=sceneLayout(manifest.scenes[index],manifest);filters.push(`[logobase${index}]scale=${Math.round(width*layout.logoWidth)}:-1[logo${index}]`);}

  manifest.scenes.forEach((scene,index)=>{
    const duration=Math.max(1,Number(scene.durationSeconds||1));let current=`[base${index}]`;filters.push(`[${index}:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},fps=30,format=yuv420p,trim=duration=${duration},setpts=PTS-STARTPTS[base${index}]`);
    const layout=sceneLayout(scene,manifest);
    if(scene.overlay.enabled){
      const panelStart=`[panel${index}]`;const accent=`[accent${index}]`;filters.push(`${current}drawbox=x=iw*${layout.panelX.toFixed(4)}:y=ih*${layout.panelY.toFixed(4)}:w=iw*${layout.panelWidth.toFixed(4)}:h=ih*${layout.panelHeight.toFixed(4)}:color=0x061522@${layout.panelOpacity.toFixed(2)}:t=fill${panelStart}`);filters.push(`${panelStart}drawbox=x=iw*${layout.panelX.toFixed(4)}:y=ih*${layout.panelY.toFixed(4)}:w=iw*${layout.preset==="minimal"?0.004:0.008}:h=ih*${layout.panelHeight.toFixed(4)}:color=0x22d3ee@0.90:t=fill${accent}`);current=accent;
      if(brandedSceneIndices.includes(index)){const branded=`[brand${index}]`;filters.push(`${current}[logo${index}]overlay=x=main_w*${layout.logoX.toFixed(4)}:y=main_h*${layout.logoY.toFixed(4)}:format=auto:shortest=1${branded}`);current=branded;}
      const brandComparable=normalizeComparable(manifest.brand.name||"");const duplicateBrand=brandComparable&&[scene.overlay.eyebrow,scene.overlay.headline].some(value=>normalizeComparable(value||"")===brandComparable);
      const widthFactor=clamp(layout.panelWidth/0.84,0.55,1.12);
      const configs=layout.vertical?{eyebrow:{chars:Math.round(24*widthFactor),lines:2,size:0.017,gap:0.020},headline:{chars:Math.round(22*widthFactor),lines:3,size:layout.preset==="commercial"?0.034:0.031,gap:0.025},body:{chars:Math.round(30*widthFactor),lines:3,size:0.018,gap:0.022},cta:{chars:Math.round(24*widthFactor),lines:2,size:0.018,gap:0.020}}:{eyebrow:{chars:Math.round(36*widthFactor),lines:2,size:0.021,gap:0.016},headline:{chars:Math.round(34*widthFactor),lines:3,size:layout.preset==="commercial"?0.041:0.038,gap:0.022},body:{chars:Math.round(48*widthFactor),lines:3,size:0.021,gap:0.018},cta:{chars:Math.round(36*widthFactor),lines:2,size:0.020,gap:0.018}};
      const rawFields=[{key:"eyebrow",text:duplicateBrand?"":scene.overlay.eyebrow,bold:true,box:false},{key:"headline",text:scene.overlay.headline,bold:true,box:false},{key:"body",text:scene.overlay.body,bold:false,box:false},{key:"cta",text:scene.overlay.cta,bold:true,box:true}] as const;
      let yCursor=layout.panelY+(layout.vertical?0.022:0.020);let stage=0;let previousComparable="";
      for(const field of rawFields){const comparable=normalizeComparable(field.text||"");if(!comparable||comparable===previousComparable)continue;previousComparable=comparable;const config=configs[field.key];const wrapped=wrapText(field.text,Math.max(10,config.chars),config.lines);const lineCount=Math.max(1,wrapped.split("\n").length);const textPath=`/tmp/scene-${index}-${field.key}.txt`;lines.push(textFileLine(textPath,wrapped));const next=`[s${index}t${stage}]`;filters.push(drawText(current,next,textPath,{x:layout.textX,y:`h*${yCursor.toFixed(4)}`,size:Math.round(height*config.size*layout.scale),bold:field.bold,box:field.box,boxColor:field.key==="cta"?"0x0891b2@0.88":undefined}));current=next;yCursor+=(config.size*layout.scale*1.34*lineCount)+config.gap;stage+=1;}
    }
    const finalLabel=`[scene${index}]`;if(manifest.transition==="fade"&&duration>=1.2)filters.push(`${current}fade=t=in:st=0:d=0.35,fade=t=out:st=${Math.max(0.4,duration-0.35).toFixed(2)}:d=0.35${finalLabel}`);else filters.push(`${current}null${finalLabel}`);sceneOutputs.push(finalLabel);const audioLabel=`[audio${index}]`;filters.push(`[${sceneCount+index}:a]atrim=duration=${duration},asetpts=PTS-STARTPTS${audioLabel}`);audioOutputs.push(audioLabel);
  });

  filters.push(`${sceneOutputs.join("")}concat=n=${sceneOutputs.length}:v=1:a=0[outv]`,`${audioOutputs.join("")}concat=n=${audioOutputs.length}:v=0:a=1[outa]`);
  const videoInputs=manifest.scenes.map((_,index)=>`-i ${shQuote(`/tmp/scene-${index}.mp4`)}`).join(" ");const audioInputs=manifest.scenes.map((_,index)=>`-i ${shQuote(`/tmp/audio-${index}.wav`)}`).join(" ");const inputs=`${videoInputs} ${audioInputs} -loop 1 -i /tmp/brand-logo`;
  lines.push("STEP=ffmpeg_render",`\"$FFMPEG\" -hide_banner -loglevel error -y ${inputs} -filter_complex ${shQuote(filters.join(";"))} -map '[outv]' -map '[outa]' -c:v libx264 -preset veryfast -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -movflags +faststart /tmp/final.mp4 2>/tmp/render.log`,"STEP=upload_output",`curl -fsS --retry 3 -X PUT -H 'Content-Type: video/mp4' --upload-file /tmp/final.mp4 ${shQuote(outputUrl)}`,"STEP=complete_status",`printf completed | curl -fsS --retry 3 -X PUT -H 'Content-Type: text/plain' --data-binary @- ${shQuote(statusUrl)}`,"trap - ERR","echo ALGENRI_RENDER_OK");
  return lines.join("\n");
}

async function persist(projectId:string,manifest:StudioFinalRenderManifest){await (await getAdminDb()).collection("studioProjects").doc(projectId).set({finalRender:manifest,updatedAt:FieldValue.serverTimestamp()},{merge:true});}
async function ensureAlgenriBrandLogo(bucket:any){const file=bucket.file(BRAND_LOGO_STORAGE_PATH);const[exists]=await file.exists();if(!exists){const buffer=await readFile(path.join(process.cwd(),"public","algenri-logo.webp"));await file.save(buffer,{resumable:false,metadata:{contentType:"image/webp",cacheControl:"public,max-age=31536000,immutable"}});}return file;}

export async function startStudioSandboxRender(projectId:string):Promise<StudioFinalRenderManifest>{
  const project=await getStudioProject(projectId);if(!project)throw new Error("studio_project_not_found");const manifest=project.finalRender as StudioFinalRenderManifest|undefined;if(!manifest||manifest.state!=="prepared")throw new Error("studio_final_render_not_prepared");
  const storage=await getAdminStorage();const bucket=storage.bucket();const expires=Date.now()+SIGNED_URL_TTL_MS;
  const sceneUrls=await Promise.all(manifest.scenes.map(async scene=>(await bucket.file(scene.storagePath).getSignedUrl({version:"v4",action:"read",expires}))[0]));
  const brandLogoFile=manifest.brand.mode==="asset"&&manifest.brand.logoStoragePath?bucket.file(manifest.brand.logoStoragePath):await ensureAlgenriBrandLogo(bucket);
  const[brandLogoExists]=await brandLogoFile.exists();if(!brandLogoExists)throw new Error("studio_brand_asset_missing");
  const[brandLogoUrl]=await brandLogoFile.getSignedUrl({version:"v4",action:"read",expires});
  const outputStoragePath=`studio/projects/${projectId}/final/video-final.mp4`;const statusStoragePath=`studio/projects/${projectId}/final/render-status.txt`;
  await Promise.all([bucket.file(outputStoragePath).delete({ignoreNotFound:true}).catch(()=>undefined),bucket.file(statusStoragePath).delete({ignoreNotFound:true}).catch(()=>undefined)]);
  const[outputUploadUrl]=await bucket.file(outputStoragePath).getSignedUrl({version:"v4",action:"write",expires,contentType:"video/mp4"});const[statusUploadUrl]=await bucket.file(statusStoragePath).getSignedUrl({version:"v4",action:"write",expires,contentType:"text/plain"});const startedAt=new Date().toISOString();let sandbox:Sandbox;
  try{sandbox=await Sandbox.create({name:`algenri-render-${projectId.slice(0,8)}-${Date.now()}`,runtime:"node24",resources:{vcpus:2},timeout:RENDER_TIMEOUT_MS,persistent:false,tags:{app:"algenri-studio",project:projectId.slice(0,50)}});}catch(error){const message=error instanceof Error?error.message:String(error);throw new Error(`studio_sandbox_create_failed: ${message.slice(0,900)}`);}
  const script=buildRenderScript(manifest,sceneUrls,brandLogoUrl,outputUploadUrl,statusUploadUrl);let commandId="";try{const command=await sandbox.runCommand({cmd:"bash",args:["-lc",script],cwd:"/tmp",detached:true});commandId=command.cmdId;}catch(error){await sandbox.stop().catch(()=>undefined);const message=error instanceof Error?error.message:String(error);throw new Error(`studio_sandbox_command_start_failed: ${message.slice(0,900)}`);}if(!commandId)throw new Error("studio_sandbox_command_id_missing");
  const rendering:StudioFinalRenderManifest={...manifest,state:"rendering",renderEngine:"vercel-sandbox",startedAt,completedAt:null,outputStoragePath,outputUrl:null,sizeBytes:null,contentType:"video/mp4",error:null,worker:{provider:"vercel-sandbox",sandboxName:sandbox.name,commandId,statusStoragePath,startedAt}};await persist(projectId,rendering);return rendering;
}

export async function refreshStudioSandboxRender(projectId:string):Promise<StudioFinalRenderManifest|null>{
  const project=await getStudioProject(projectId);if(!project)return null;const manifest=project.finalRender as StudioFinalRenderManifest|undefined;if(!manifest||manifest.state!=="rendering"||manifest.renderEngine!=="vercel-sandbox"||!manifest.worker?.statusStoragePath)return manifest??null;const storage=await getAdminStorage();const bucket=storage.bucket();const statusFile=bucket.file(manifest.worker.statusStoragePath);const[statusExists]=await statusFile.exists();if(statusExists){const[statusBuffer]=await statusFile.download();const status=statusBuffer.toString("utf8").trim();const finishedAt=new Date().toISOString();if(status.startsWith("failed")){const failed:StudioFinalRenderManifest={...manifest,state:"failed",completedAt:finishedAt,error:`studio_sandbox_render_${status}`.slice(0,3200),worker:{...manifest.worker,exitCode:status.split(":")[1]||"1",finishedAt}};await persist(projectId,failed);return failed;}if(status==="completed"){const outputFile=bucket.file(manifest.outputStoragePath||`studio/projects/${projectId}/final/video-final.mp4`);const[exists]=await outputFile.exists();if(!exists)return manifest;const[metadata]=await outputFile.getMetadata();const completed:StudioFinalRenderManifest={...manifest,state:"completed",completedAt:finishedAt,outputUrl:`/api/internal/studio/projects/${projectId}/final-render/download`,contentType:metadata.contentType||"video/mp4",sizeBytes:Number(metadata.size||0)||null,error:null,worker:{...manifest.worker,exitCode:"0",finishedAt}};await persist(projectId,completed);return completed;}}
  const startedMs=Date.parse(manifest.startedAt||manifest.worker.startedAt||"");if(Number.isFinite(startedMs)&&Date.now()-startedMs>FAILURE_GRACE_MS){const finishedAt=new Date().toISOString();const failed:StudioFinalRenderManifest={...manifest,state:"failed",completedAt:finishedAt,error:"studio_sandbox_render_timeout_no_status",worker:{...manifest.worker,exitCode:"timeout",finishedAt}};await persist(projectId,failed);return failed;}return manifest;
}
