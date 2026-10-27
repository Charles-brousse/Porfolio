(() => {
"use strict";
const $=id=>document.getElementById(id),stage=$("stage"),board=$("board");
const edit=new URLSearchParams(location.search).get("edit")==="1";
let data={title:"Mon mur photographique",photos:[]},scale=1,tx=innerWidth/2,ty=innerHeight/2,panning=false,panStart=null,drag=null,moved=false;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function transform(){board.style.transform=`translate(${tx}px,${ty}px) scale(${scale})`;$("zoom").textContent=Math.round(scale*100)+" %"}
function render(){
 board.replaceChildren();const photos=data.photos||[];
 $("status").classList.toggle("hidden",photos.length>0);
 if(!photos.length){$("status").textContent="Aucune photo : vérifiez gallery.json.";return}
 const frag=document.createDocumentFragment();
 photos.forEach((p,i)=>{
  const card=document.createElement("div");card.className="photo";card.dataset.i=i;
  card.style.left=(p.x??(i%8*240))+"px";card.style.top=(p.y??(Math.floor(i/8)*200))+"px";card.style.width=(p.w??210)+"px";card.style.height=(p.h??160)+"px";
  const img=document.createElement("img");img.loading="lazy";img.decoding="async";img.src=p.thumb||p.url||"";img.alt=p.title||p.name||"Photographie";img.draggable=false;
  img.onerror=()=>{img.style.opacity=".15";img.alt="Image indisponible — vérifier l’URL"};
  card.appendChild(img);
  if(p.title||p.name){const lab=document.createElement("div");lab.className="label";lab.textContent=p.title||p.name;card.appendChild(lab)}
  const handle=document.createElement("span");handle.className="handle";card.appendChild(handle);
  card.addEventListener("pointerdown",e=>{
   if(!edit||e.button!==0)return;e.preventDefault();e.stopPropagation();
   drag=e.target===handle?{kind:"size",card,i,sx:e.clientX,sy:e.clientY,sw:p.w??210,sh:p.h??160}:{kind:"move",card,i,sx:e.clientX,sy:e.clientY,x:p.x??0,y:p.y??0};
   card.setPointerCapture(e.pointerId);
  });
  card.addEventListener("pointermove",e=>{
   if(!drag||drag.card!==card)return;const dx=(e.clientX-drag.sx)/scale,dy=(e.clientY-drag.sy)/scale;
   if(Math.abs(dx)+Math.abs(dy)>3)moved=true;
   if(drag.kind==="move"){p.x=Math.round(drag.x+dx);p.y=Math.round(drag.y+dy);card.style.left=p.x+"px";card.style.top=p.y+"px"}
   else{p.w=Math.round(clamp(drag.sw+dx,70,900));p.h=Math.round(clamp(drag.sh+dy,60,900));card.style.width=p.w+"px";card.style.height=p.h+"px"}
  });
  card.addEventListener("pointerup",()=>{drag=null;setTimeout(()=>moved=false,80)});
  card.addEventListener("click",()=>{
   if(edit||moved)return;const src=p.original||p.url||p.thumb;
   $("large").src=src;$("large").alt=p.title||p.name||"Photographie";$("caption").textContent=p.title||p.name||"";$("original").href=src||"#";$("viewer").showModal();
  });
  frag.appendChild(card);
 });
 board.appendChild(frag);transform();
}
$("minus").onclick=()=>{scale=clamp(scale/1.18,.12,3.5);transform()};
$("plus").onclick=()=>{scale=clamp(scale*1.18,.12,3.5);transform()};
$("center").onclick=()=>{scale=1;tx=innerWidth/2;ty=innerHeight/2;transform()};
stage.addEventListener("wheel",e=>{e.preventDefault();const old=scale,next=clamp(scale*(e.deltaY<0?1.1:1/1.1),.12,3.5),r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;tx=x-(x-tx)*(next/old);ty=y-(y-ty)*(next/old);scale=next;transform()},{passive:false});
stage.addEventListener("pointerdown",e=>{if(e.button!==0||e.target.closest(".photo")||e.target.closest("#editor")||e.target.closest("button"))return;panning=true;panStart={x:e.clientX,y:e.clientY,tx,ty};stage.classList.add("panning");stage.setPointerCapture(e.pointerId)});
stage.addEventListener("pointermove",e=>{if(!panning)return;tx=panStart.tx+e.clientX-panStart.x;ty=panStart.ty+e.clientY-panStart.y;transform()});
stage.addEventListener("pointerup",()=>{panning=false;stage.classList.remove("panning")});
$("close").onclick=()=>$("viewer").close();$("viewer").addEventListener("click",e=>{if(e.target===$("viewer"))$("viewer").close()});
async function init(){
 try{
  const r=await fetch("gallery.json",{cache:"no-store"});if(!r.ok)throw Error("gallery.json introuvable");data=await r.json();if(!Array.isArray(data.photos))data.photos=[];
  $("heading").textContent=data.title||"Mon mur photographique";document.title=data.title||"Mon mur photographique";
  if(edit){
   document.body.classList.add("edit");$("editor").classList.remove("hidden");$("hint").textContent="Organisation : déplacer les photos · poignée ronde pour redimensionner";
   $("title").value=data.title||"Mon mur photographique";
   $("title").addEventListener("input",e=>{data.title=e.target.value;$("heading").textContent=data.title;document.title=data.title});
   $("save").onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="gallery.json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);alert("Mise en page exportée. Remplacez ensuite gallery.json dans le dépôt du site pour publier les changements.")};
   $("exit").onclick=()=>{if(confirm("Quitter le mode organisation ? Exportez d’abord les modifications si nécessaire."))location.href=location.pathname};
  }
  render();
 }catch(e){$("status").textContent="Impossible de charger gallery.json. Consultez le guide de publication.";console.error(e)}
}
addEventListener("resize",transform);init();
})();