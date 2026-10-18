import * as THREE from 'three';
import {createDeskAssembly} from './rig-assembly.js?v=slotsMatte7';
import {productStatus,waitForProducts} from './product-models.js?v=slotsMatte7';
import {coolerPoseEntries,updateCoolerHoses,openCooler,disposeCoolerHoses} from './cooler-model.js?v=slotsMatte7';
export {createDeskAssembly} from './rig-assembly.js?v=slotsMatte7';

export class DeskRig{
 constructor(callbacks){
  this.callbacks=callbacks;this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#070b13');this.scene.fog=new THREE.FogExp2('#070b13',.008);
  this.camera=new THREE.PerspectiveCamera(43,1,.1,180);this.assembly=createDeskAssembly();this.scene.add(this.assembly);this.equipment=this.assembly.userData.equipment;this.inspection=new THREE.Group();this.inspection.visible=false;this.scene.add(this.inspection);this.scene.environmentIntensity=.4;
  this.scene.add(new THREE.AmbientLight('#ffffff',1));this.scene.add(new THREE.HemisphereLight('#d7e7fa','#252336',2.4));const key=new THREE.DirectionalLight('#fff6e9',3.1);key.position.set(-8,16,14);this.scene.add(key);
  for(const [color,power,pos]of [['#61dae8',160,[-12,5,-5]],['#b395ff',220,[13,8,-8]]]){const light=new THREE.PointLight(color,power,50,2);light.position.set(...pos);this.scene.add(light);}
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(130,130),new THREE.MeshStandardMaterial({color:'#070c12',metalness:0,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=this.assembly.userData.floorY-.08;this.scene.add(floor);
  const grid=new THREE.GridHelper(100,50,'#284354','#172838');grid.position.y=floor.position.y+.01;this.scene.add(grid);
  const arc=new THREE.EllipseCurve(0,0,18,14,0,Math.PI*2,false,0);const points=arc.getPoints(120).map(p=>new THREE.Vector3(p.x,floor.position.y+.03,p.y+2));this.scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:'#4c8fa0',transparent:true,opacity:.35})));
  this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.target=new THREE.Vector3(1,-1,1);this.desiredTarget=this.target.clone();this.yaw=.28;this.pitch=.48;this.radius=39;this.goal={yaw:.28,pitch:.48,radius:39};this.mobile=false;this.drag=null;this.hoverTime=0;
  this.highlight=new THREE.Box3Helper(new THREE.Box3(),0x58e9df);this.highlight.visible=false;this.scene.add(this.highlight);this.preset('overview',true);
 }
 resize(w,h){this.mobile=w<761;this.camera.aspect=w/h;this.camera.fov=this.mobile?48:43;this.camera.updateProjectionMatrix();if(this.inspection.visible){if(this.pcInspection)this.goal.radius=this.exploded?Math.max(19,19/this.camera.aspect):(this.mobile?17:12.5);}else if(this.presetId==='overview')this.preset('overview',true);}
 preset(id,instant=false){
  this.inspection.visible=false;this.assembly.visible=true;this.callbacks.onRigInspection?.(false);this.setExploded(false,true);
  const presets={overview:{target:[2,-1.6,1],yaw:.28,pitch:.48,radius:this.mobile?76:39},desktop:{target:[0,.8,.2],yaw:.05,pitch:.83,radius:this.mobile?36:24},inputs:{target:[-.6,.7,1.2],yaw:.04,pitch:.95,radius:this.mobile?27:17},compute:{target:[10.5,-3.5,0],yaw:.34,pitch:.2,radius:this.mobile?25:17},vr:{target:[5.4,1,-.2],yaw:.35,pitch:.65,radius:this.mobile?29:20}};
  const p=presets[id]||presets.overview;this.presetId=id;this.desiredTarget.set(...p.target);this.goal={yaw:p.yaw,pitch:p.pitch,radius:p.radius};if(instant){this.target.copy(this.desiredTarget);Object.assign(this,{yaw:p.yaw,pitch:p.pitch,radius:p.radius});}this.selected=null;this.highlight.visible=false;this.updateCamera();
 }
 focus(id){
  const item=this.equipment.find(p=>p.id===id);if(!item)return;
  if(id!=='workstation'){this.exploded=false;this.callbacks.onRigExploded?.(false);}
  this.selected=item;this.showInspection(item);this.desiredTarget.set(0,0,0);
  this.goal={yaw:item.modelId==='ram'?Math.PI/2:.08,pitch:['mouse-pad','keyboard-cover','keyboard-hyzen','wrist-rest','pc-gpu'].includes(id)?.95:id==='pc-x73'?.35:item.pcPart||id.startsWith('monitor')?.18:id==='desk-chair'?.25:.55,radius:this.mobile?12.5:8.8};
  if(id==='workstation')this.setExploded(this.exploded,true);
  this.highlight.visible=false;this.pauseUntil=performance.now()+1800;this.callbacks.onRigInspection?.(true);this.callbacks.onRigPick?.(item,null);
  if(productStatus(item.raw).ready<productStatus(item.raw).total)waitForProducts(item.raw).then(()=>{if(this.selected===item&&this.inspection.visible){this.showInspection(item);if(id==='workstation')this.setExploded(this.exploded,true);}});
 }
 showInspection(item){
  this.pcInspection=null;disposeCoolerHoses(this.inspection);this.inspection.clear();this.inspection.rotation.set(0,0,0);
  const copy=item.raw.clone(true);copy.position.set(0,0,0);copy.userData.rigId=item.id;if(item.modelId==='x73')openCooler(copy);this.inspection.add(copy);this.inspection.updateMatrixWorld(true);
  let box=new THREE.Box3().setFromObject(copy);const size=box.getSize(new THREE.Vector3()),span=Math.max(size.x,size.y,size.z,.001);copy.scale.multiplyScalar(4.8/span);box=new THREE.Box3().setFromObject(copy);copy.position.sub(box.getCenter(new THREE.Vector3()));
  if(item.id==='workstation')this.pcInspection={root:copy,parts:item.raw.userData.partGroups.map(original=>{
   const object=copy.children.find(p=>p.name===original.name),id=original.userData.productId;
   const part={object,id,base:original.userData.basePosition.clone(),open:original.userData.openPosition.clone(),baseQuaternion:object.quaternion.clone(),openQuaternion:new THREE.Quaternion().setFromEuler(new THREE.Euler(id==='gpu'?-.9:id==='hdd'?Math.PI/2:0,0,0))};
   if(id==='ram')part.modules=object.children.map((object,i)=>({object,base:object.position.clone(),open:new THREE.Vector3(i*.75,0,0),baseQuaternion:object.quaternion.clone(),openQuaternion:new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2)}));
   if(id==='x73')part.modules=coolerPoseEntries(object);
   return part;
  })};
  this.assembly.visible=false;this.inspection.visible=true;
 }
 setExploded(value,instant=false){
  // Animate the visible inspection itself. The desk and home case always retain
  // their assembled parts, and reversing mid-flight starts from the current pose.
  if(value&&this.selected?.id!=='workstation')this.focus('workstation');
  this.exploded=value;
  if(this.pcInspection){
   if(instant){this.inspection.rotation.set(0,0,0);this.alignCase=false;}else{this.inspection.rotation.y=THREE.MathUtils.euclideanModulo(this.inspection.rotation.y+Math.PI,Math.PI*2)-Math.PI;this.alignCase=true;}
   const parts=this.pcInspection.parts;
   for(const [i,p]of parts.entries()){
    for(const pose of [p,...(p.modules||[])]){pose.from=pose.object.position.clone();pose.to=(value?pose.open:pose.base).clone();pose.fromQuaternion=pose.object.quaternion.clone();pose.toQuaternion=(value?pose.openQuaternion:pose.baseQuaternion).clone();pose.fromScale=pose.object.scale.clone();pose.toScale=(value?pose.openScale:pose.baseScale)?.clone()||pose.fromScale.clone();if(instant){pose.object.position.copy(pose.to);pose.object.quaternion.copy(pose.toQuaternion);pose.object.scale.copy(pose.toScale);}}
    p.elapsed=0;p.delay=(value?i:parts.length-1-i)*.045;p.duration=.95;p.moving=!instant;
    if(instant&&p.id==='x73')updateCoolerHoses(p.object);
   }
   this.desiredTarget.set(value?-1.35:0,value?.6:.75,0);
   this.goal={yaw:value?.02:-.25,pitch:value?.12:.14,radius:value?Math.max(19,19/this.camera.aspect):(this.mobile?17:12.5)};
   this.pauseUntil=performance.now()+1800;
  }
  this.callbacks.onRigExploded?.(value);
 }
 updateParts(dt,reduced){
  if(!this.pcInspection)return;
  if(this.alignCase){this.inspection.rotation.y*=reduced?0:Math.exp(-dt*7);if(Math.abs(this.inspection.rotation.y)<1e-5){this.inspection.rotation.y=0;this.alignCase=false;}}
  for(const p of this.pcInspection.parts){
   if(!p.moving)continue;p.elapsed+=dt;const t=THREE.MathUtils.clamp((p.elapsed-p.delay)/p.duration,0,1),ease=1-Math.pow(1-t,3);
   for(const pose of [p,...(p.modules||[])]){pose.object.position.lerpVectors(pose.from,pose.to,reduced?1:ease);pose.object.quaternion.slerpQuaternions(pose.fromQuaternion,pose.toQuaternion,reduced?1:ease);pose.object.scale.lerpVectors(pose.fromScale,pose.toScale,reduced?1:ease);}
   if(!reduced&&p.id!=='p600s')p.object.position.z+=Math.sin(Math.PI*ease)*1.5;
   if(reduced||t===1){for(const pose of [p,...(p.modules||[])]){pose.object.position.copy(pose.to);pose.object.quaternion.copy(pose.toQuaternion);pose.object.scale.copy(pose.toScale);}p.moving=false;}
   if(p.id==='x73')updateCoolerHoses(p.object);
  }
 }
 layoutLabels(){
  if(!this.callbacks.onRigLayout)return;
  const labels=[],names={p600s:'P600S',board:'MSI Z690',cpu:'i7-12700KF',x73:'Kraken X73',ram:'Trident Z · 16GB × 2',gpu:'RTX 3090 Ti',ssd980250:'980 · 250GB',ssd9801:'980 · 1TB',ssd9901:'990 PRO · 1TB',ssd9902:'990 PRO · 2TB',hdd:'HDD · 2TB'};
  if(this.inspection.visible&&this.pcInspection&&this.exploded){
   this.inspection.updateMatrixWorld(true);
   for(const p of this.pcInspection.parts){const box=new THREE.Box3().setFromObject(p.object),point=new THREE.Vector3((box.min.x+box.max.x)/2,box.min.y-.17,(box.min.z+box.max.z)/2).project(this.camera);labels.push({id:p.id,name:names[p.id],x:(point.x+1)*innerWidth/2,y:(1-point.y)*innerHeight/2,visible:point.z<1&&Math.abs(point.x)<1&&Math.abs(point.y)<1});}
  }
  this.callbacks.onRigLayout(labels);
 }
 layoutCaseAction(){
  if(!this.callbacks.onRigCaseAnchor)return;
  const subject=this.inspection.visible?this.pcInspection?.parts.find(p=>p.id==='p600s')?.object:this.assembly.userData.workstation.raw.userData.partGroups.find(p=>p.userData.productId==='p600s');
  if(!subject){this.callbacks.onRigCaseAnchor(null);return;}
  subject.updateWorldMatrix(true,true);
  const box=this.caseActionBox??=new THREE.Box3(),point=this.caseActionPoint??=new THREE.Vector3();box.setFromObject(subject);
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity,inFront=true;
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
   point.set(x,y,z).project(this.camera);inFront&&=point.z>-1&&point.z<1;
   const px=(point.x+1)*innerWidth/2,py=(1-point.y)*innerHeight/2;
   left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py);
  }
  this.callbacks.onRigCaseAnchor({left,right,top,bottom,visible:inFront&&right>0&&left<innerWidth&&bottom>0&&top<innerHeight});
 }
 hit(e){this.pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const hits=this.raycaster.intersectObject(this.inspection.visible?this.inspection:this.assembly,true);for(const h of hits){if(h.object.userData.pickThrough)continue;let node=h.object,part=null,id=null;while(node){part||=node.userData.gearPart;if(node.userData.rigId){id=node.userData.rigId;break;}node=node.parent;}if(id){if(id==='pc-p600s'&&!this.exploded)id='workstation';return {item:this.equipment.find(p=>p.id===id),part};}}return null;}
 down(e){this.pauseUntil=performance.now()+4000;this.drag={x:e.clientX,y:e.clientY,yaw:this.goal.yaw,pitch:this.goal.pitch,moved:false};}
 move(e){this.pointerPixels={x:e.clientX,y:e.clientY};if(!this.drag)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;if(Math.hypot(dx,dy)>6)this.drag.moved=true;if(this.drag.moved){this.goal.yaw=this.drag.yaw-dx*.006;this.goal.pitch=THREE.MathUtils.clamp(this.drag.pitch+dy*.005,.08,1.38);}}
 up(e){const d=this.drag;this.drag=null;this.pauseUntil=performance.now()+4000;if(!d||d.moved)return;const h=this.hit(e);if(h)this.focus(h.item.id);}
 wheel(e){this.goal.radius=THREE.MathUtils.clamp(this.goal.radius*Math.exp(e.deltaY*.001),4.5,85);}
 updateCamera(){const r=this.radius*Math.cos(this.pitch);this.camera.position.set(this.target.x+Math.sin(this.yaw)*r,this.target.y+Math.sin(this.pitch)*this.radius,this.target.z+Math.cos(this.yaw)*r);this.camera.lookAt(this.target);}
 update(dt,time,reduced){const k=reduced?1:1-Math.exp(-dt*7);this.target.lerp(this.desiredTarget,k);for(const key of ['yaw','pitch','radius'])this[key]+=(this.goal[key]-this[key])*k;this.updateParts(dt,reduced);if(this.inspection.visible&&!this.exploded&&!reduced&&!this.drag&&time>(this.pauseUntil||0))this.inspection.rotation.y+=dt*.12;this.updateCamera();this.layoutLabels();this.layoutCaseAction();if(time-(this.lastStatusAt||0)>250){this.lastStatusAt=time;const status=productStatus(this.assembly),key=JSON.stringify(status);if(this.lastStatus!==key){this.lastStatus=key;this.callbacks.onRigProgress?.(status);}}if(time-this.hoverTime>180&&!this.drag&&this.pointerPixels&&!document.querySelector('dialog[open]')){this.hoverTime=time;const h=this.hit({clientX:this.pointerPixels.x,clientY:this.pointerPixels.y});this.callbacks.onHover?.(h?{name:h.item.title}:null,this.pointerPixels);}}
}
