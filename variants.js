export const cloudMethods=[['sfm','SfM'],['mvs','MVS'],['voxel','복셀']];

export function groupClouds(items){
 const groups=new Map();
 for(const cloud of items){
  if(!groups.has(cloud.siteId))groups.set(cloud.siteId,{id:'site-'+cloud.siteId,site:cloud.site,siteId:cloud.siteId,variants:[],unavailable:[]});
  groups.get(cloud.siteId).variants.push({id:cloud.methodId,label:cloud.method,cloud});
 }
 for(const site of groups.values()){
  site.variants.sort((a,b)=>cloudMethods.findIndex(([id])=>id===a.id)-cloudMethods.findIndex(([id])=>id===b.id));
  site.unavailable=cloudMethods.filter(([id])=>!site.variants.some(v=>v.id===id)).map(([id,label])=>({id,label,reason:label+' 원본 미확인'}));
 }
 return [...groups.values()];
}

export function wrapVariant(index,count){return count?((index%count)+count)%count:0;}
