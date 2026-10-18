export const cloudMethods=[['sfm','SfM'],['mvs','MVS'],['voxel','복셀']];
export const reconstructionMethods=[...cloudMethods,['wall','벽면'],['floor','바닥']];

export function groupClouds(items,surfaces=[]){
 const groups=new Map();
 for(const cloud of items){
  if(!groups.has(cloud.siteId))groups.set(cloud.siteId,{id:'site-'+cloud.siteId,site:cloud.site,siteId:cloud.siteId,variants:[],unavailable:[]});
  groups.get(cloud.siteId).variants.push({id:cloud.methodId,label:cloud.method,cloud});
 }
 for(const surface of surfaces){
  const site=groups.get(surface.siteId);
  if(site)site.variants.push({id:surface.methodId,label:surface.methodId==='wall'?'벽면':'바닥',surface});
 }
 for(const site of groups.values()){
  site.variants.sort((a,b)=>reconstructionMethods.findIndex(([id])=>id===a.id)-reconstructionMethods.findIndex(([id])=>id===b.id));
  site.unavailable=cloudMethods.filter(([id])=>!site.variants.some(v=>v.id===id)).map(([id,label])=>({id,label,reason:label+' 원본 미확인'}));
 }
 return [...groups.values()];
}

export function wrapVariant(index,count){return count?((index%count)+count)%count:0;}

// Opaque surfaces must write depth again after their transition finishes.
// Point clouds retain their original transparent rendering throughout.
export function blendLayer(layer){
 for(const f of layer.materials){
  const fading=layer.mix<.999;
  f.material.opacity=f.opacity*layer.mix;
  f.material.depthWrite=!fading&&f.depthWrite;
  const transparent=fading||f.transparent;
  if(f.material.transparent!==transparent){f.material.transparent=transparent;f.material.needsUpdate=true;}
 }
}
