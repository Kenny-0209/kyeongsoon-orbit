import * as THREE from 'three';
import {createProduct,createTexturedWorkstation} from './product-models.js?v=slotsMatte7';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
import {matteProducts} from './product-surface.js?v=surfaces1';
import {makeWater,makeStructure,makeCafe} from './gallery.js?v=surfaces1';
import {blendLayer,intersectVariants} from './variants.js?v=surfaces2';
import {monitorSpecs} from './rig-data.js?v=slotsMatte7';
import {DeskRig} from './rig.js?v=caseButton1';

const TAU=Math.PI*2,mod=(n,m)=>((n%m)+m)%m;
const material=(color,metalness=.45,roughness=.45,extra={})=>new THREE.MeshStandardMaterial({color,metalness,roughness,...extra});
function normalize(raw){raw.updateMatrixWorld(true);const b=raw.userData.fitBounds;const box=b?new THREE.Box3(new THREE.Vector3(...b.min),new THREE.Vector3(...b.max)):new THREE.Box3().setFromObject(raw);const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());const extent=Math.max(size.x,size.y,size.z,.001);const unit=new THREE.Group();raw.position.sub(center);unit.add(raw);unit.scale.setScalar(1/extent);unit.userData.normalScale=1/extent;return {unit,height:size.y/extent};}
function lineCurve(points,color,opacity=1){return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:true,opacity}));}

export class OrbitStage {
 constructor(callbacks){this.callbacks=callbacks;this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#070b14');this.scene.fog=new THREE.FogExp2('#0a1120',.012);this.camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.1,160);this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.setSize(innerWidth,innerHeight);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;document.querySelector('#scene').append(this.renderer.domElement);this.cache=new Map();this.items=[];this.position=0;this.target=0;this.mode='home';this.autoRotate=true;this.reduced=false;this.exploded=false;this.pointer=new THREE.Vector2();this.raycaster=new THREE.Raycaster();this.raycaster.params.Points.threshold=.08;this.drag=null;this.userPitch=0;this.userYaw=0;this.hoverTime=0;this.lastFrame=0;this.loadCounter=0;this.portals=[];this.buildRoom();const studio=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(this.renderer);this.environmentTarget=pmrem.fromScene(studio,.04);this.scene.environment=this.environmentTarget.texture;this.scene.environmentIntensity=.4;studio.dispose();pmrem.dispose();this.bindEvents();this.resize();requestAnimationFrame(t=>this.frame(t));}
 buildRoom(){const s=this.scene;const dark=material('#1c2839',.6,.39),black=material('#0c121d',.3,.65),steel=material('#4a627a',.85,.31),cyan=new THREE.MeshBasicMaterial({color:'#54deda'}),violet=new THREE.MeshBasicMaterial({color:'#a78bff'});s.add(new THREE.HemisphereLight('#b6c9e7','#101721',2.4));const key=new THREE.DirectionalLight('#e1eaff',3.8);key.position.set(-8,12,14);s.add(key);for(const [c,intensity,pos]of [['#54e7ed',135,[-8,4,7]],['#a47fff',165,[10,6,-4]],['#d0d9ff',75,[0,10,-8]]]){const light=new THREE.PointLight(c,intensity,70,2);light.position.set(...pos);s.add(light);}
 const box=(size,pos,mat=dark)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);m.position.set(...pos);s.add(m);return m;};
 box([38,.45,24],[0,-2.04,10]);box([37.8,.06,23.8],[0,-1.79,10],material('#243548',.7,.32));box([37,.025,.035],[0,-1.75,-1.8],cyan);box([.035,.025,23],[-18.3,-1.75,10],violet);box([.035,.025,23],[18.3,-1.75,10],cyan);
 box([72,29,.5],[0,9,-28],material('#111b2b',.3,.7));for(let i=-15;i<=15;i++)box([.07,24,.35],[i*2.2,8,-27.6],i%4===0?steel:black);box([47,.035,.04],[0,7,-27.2],violet);box([17,.025,.03],[-14,2,-27.1],cyan);box([21,.025,.03],[15,2,-27.1],violet);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),material('#101b29',.55,.5));floor.rotation.x=-Math.PI/2;floor.position.y=-4.6;s.add(floor);
 const grid=new THREE.GridHelper(75,35,'#253c54','#16283c');grid.position.y=-4.59;s.add(grid);
 const keyboard=createProduct('loomi',{size:[7.5,1,3.0]});keyboard.position.set(-2.6,-1.7,9.6);keyboard.rotation.y=Math.PI;keyboard.scale.setScalar(.83);s.add(keyboard);
 const mouse=createProduct('infinity',{size:[1.6,1.05,3.0]});mouse.position.set(3.55,-1.7,9.3);mouse.rotation.y=Math.PI;mouse.scale.setScalar(.65);s.add(mouse);
 const pc=createTexturedWorkstation();pc.scale.setScalar(.83);pc.position.set(12.3,-1.7,4.1);pc.rotation.y=-.3;s.add(pc);const jetson=createProduct('orin',{size:[2.2,1.1,2.1]});jetson.position.set(8.65,-1.7,4.65);jetson.rotation.y=-.15;jetson.scale.setScalar(.66);s.add(jetson);
 this.permanentPC=pc;const display=createProduct('aoc',{size:[6.1,5.2,2.7]});display.scale.setScalar(.72);display.position.set(-12.1,-1.7,2.8);display.rotation.y=.4;s.add(display);
 const dialBase=new THREE.Mesh(new THREE.CylinderGeometry(.68,.73,.23,48),black);dialBase.position.set(0,-1.58,5.9);s.add(dialBase);const dial=new THREE.Mesh(new THREE.CylinderGeometry(.59,.62,.16,48),steel);dial.position.set(0,-1.38,5.9);s.add(dial);this.dial=dial;const ring=new THREE.Mesh(new THREE.TorusGeometry(.65,.015,8,64),cyan);ring.rotation.x=-Math.PI/2;ring.position.set(0,-1.28,5.9);s.add(ring);
 const beamPoints=[new THREE.Vector3(0,-1.3,5.9),new THREE.Vector3(0,-.5,4),new THREE.Vector3(0,1,2.8)];const curve=new THREE.CatmullRomCurve3(beamPoints);this.beam=lineCurve(curve.getPoints(28),'#60d8da',.25);s.add(this.beam);
 this.ring=new THREE.Group();const path=[];for(let i=0;i<=180;i++){const a=i/180*TAU;path.push(this.ringPoint(a));}this.ring.add(lineCurve(path,'#64e7e3',.65));this.ring.add(lineCurve(path.map(p=>p.clone().add(new THREE.Vector3(0,-.12,0))),'#a78bff',.24));for(let i=0;i<48;i++){const a=i/48*TAU;const p=this.ringPoint(a);const marker=new THREE.Mesh(new THREE.SphereGeometry(i%4===0?.055:.023,6,4),i%4===0?cyan:steel);marker.position.copy(p);this.ring.add(marker);}s.add(this.ring);this.ring.visible=false;
 this.homeGroup=new THREE.Group();s.add(this.homeGroup);
 }
 ringPoint(angle){return new THREE.Vector3(Math.sin(angle)*8.3,1.1-Math.cos(angle)*.65,-3.8+Math.cos(angle)*4.6);}
 async buildPortals(gallery){const defs=[['lab',makeWater(2025),'#ba9df4'],['research',null,'#58f6f1'],['personal',makeCafe(),'#ffbd79']];for(let i=0;i<defs.length;i++){const [id,ready,color]=defs[i];let raw=ready;if(!raw){const c=gallery.research.find(p=>p.variantKind==='cloud');const v=c?.variants.find(v=>v.id==='mvs')||c?.variants[0];try{raw=v?await v.factory():makeStructure();}catch{raw=makeStructure();}}const root=new THREE.Group();root.position.set((i-1)*7.25,2.75,-3.0+Math.abs(i-1)*-.4);root.rotation.y=(i-1)*-.12;root.userData.theme=id;const backing=new THREE.Mesh(new THREE.BoxGeometry(5.55,3.7,.14),material('#111e2e',.65,.4,{transparent:true,opacity:.82}));backing.userData.theme=id;root.add(backing);const edges=new THREE.LineSegments(new THREE.EdgesGeometry(backing.geometry),new THREE.LineBasicMaterial({color,transparent:true,opacity:.7}));edges.position.z=.08;root.add(edges);matteProducts(raw);const n=normalize(raw);n.unit.scale.multiplyScalar(id==='personal'?3.55:4.0);n.unit.position.set(0,.15,.55);n.unit.rotation.y=.35;root.add(n.unit);const glow=new THREE.Mesh(new THREE.BoxGeometry(5.0,.025,.045),new THREE.MeshBasicMaterial({color}));glow.position.set(0,-1.65,.13);root.add(glow);this.homeGroup.add(root);this.portals.push({id,root,model:n.unit,labelPoint:new THREE.Vector3(0,-2.45,.8)});} }
 setRig(){this.mode='rig';this.items=[];this.drag=null;this.homeGroup.visible=false;this.ring.visible=false;for(const e of this.cache.values())e.root.visible=false;this.rig??=new DeskRig(this.callbacks);this.rig.scene.environment=this.scene.environment;this.rig.preset('overview',true);this.resize();this.callbacks.onLoading?.(false);this.callbacks.onHover?.(null);return this.rig;}
 setHome(){this.mode='home';this.homeGroup.visible=true;this.ring.visible=false;for(const e of this.cache.values())e.root.visible=false;this.items=[];this.drag=null;this.resize();this.callbacks.onHover?.(null);this.callbacks.onLoading?.(false);}
 async setItems(items){this.mode='gallery';this.callbacks.onLoading?.(false);this.homeGroup.visible=false;this.ring.visible=true;for(const e of this.cache.values())e.root.visible=false;this.items=items;this.position=0;this.target=0;this.exploded=false;this.userPitch=0;this.userYaw=0;this.resize();this.callbacks.onFocus?.(items[0],0,items.length);await this.ensureWindow();}
 setTarget(value){if(!this.items.length)return;this.callbacks.onLoading?.(false);this.target=value;this.exploded=false;this.userPitch=0;this.userYaw=0;const index=mod(Math.round(value),this.items.length);this.callbacks.onFocus?.(this.items[index],index,this.items.length);this.ensureWindow();}
 get selected(){return this.items[mod(Math.round(this.target),this.items.length)]||null;}
 get selectedEntry(){return this.selected?this.cache.get(this.selected.id):null;}
 async ensureWindow(){if(!this.items.length)return;const current=mod(Math.round(this.target),this.items.length);const wanted=[0,-1,1,-2,2,-3,3].map(d=>this.items[mod(current+d,this.items.length)]);await this.ensureItem(wanted[0]);for(const item of [...new Map(wanted.slice(1).map(p=>[p.id,p])).values()])this.ensureItem(item);}
 async ensureItem(item){
  if(this.cache.has(item.id))return this.cache.get(item.id).promise;
  const root=new THREE.Group(),asset=new THREE.Group();root.add(asset);this.scene.add(root);
  const entry={item,root,asset,raw:null,spin:0,height:1,normalScale:1,variantIndex:0,requestedVariant:0,layers:new Map(),variantPromises:new Map(),request:0};this.cache.set(item.id,entry);
  if(this.selected?.id===item.id)this.callbacks.onLoading?.(true);
  entry.promise=(async()=>{try{
   const layer=await this.loadVariant(entry,0);this.activateVariant(entry,0,false);
   if(this.selected?.id===item.id)this.callbacks.onAssetReady?.(item,layer.raw);
   return entry;
  }catch(error){entry.error=error.message;this.callbacks.onError?.(item,error);}finally{if(this.selected?.id===item.id)this.callbacks.onLoading?.(false);}})();
  return entry.promise;
 }
 async loadVariant(entry,index){
  if(entry.variantPromises.has(index))return entry.variantPromises.get(index);
  const promise=(async()=>{const definition=entry.item.variantKind==='cloud'?entry.item.variants[index]:entry.item;
   const raw=await definition.factory();matteProducts(raw);const n=normalize(raw);
   const layer={raw,unit:n.unit,height:n.height,mix:0,target:0,materials:[]};
   if(entry.item.variantKind==='cloud'){const unique=new Set();raw.traverse(o=>{for(const m of (Array.isArray(o.material)?o.material:o.material?[o.material]:[]))unique.add(m);});for(const material of unique){layer.materials.push({material,opacity:material.opacity,transparent:material.transparent,depthWrite:raw.userData.surface?material.depthWrite:false});}blendLayer(layer);}
   n.unit.visible=false;entry.asset.add(n.unit);entry.layers.set(index,layer);
   if(raw.userData.partGroups)for(const part of raw.userData.partGroups)part.userData.basePosition=part.position.clone();
   return layer;
  })();entry.variantPromises.set(index,promise);
  try{return await promise;}catch(error){entry.variantPromises.delete(index);throw error;}
 }
 activateVariant(entry,index,animate=true){
  const layer=entry.layers.get(index);if(!layer)return;
  for(const [i,l]of entry.layers){l.target=i===index?1:0;if(!animate||this.reduced)l.mix=l.target;l.unit.visible=l.mix>.001||l.target>0;blendLayer(l);}
  entry.raw=layer.raw;entry.height=layer.height;entry.variantIndex=index;entry.requestedVariant=index;
  entry.baseRotation=entry.item.viewRotation||layer.raw.userData.baseRotation||[0,.35,0];
  if(entry.item.variantKind==='mask')layer.raw.userData.setVariant?.(index,!animate||this.reduced);
  if(this.selected?.id===entry.item.id)this.callbacks.onVariant?.(entry.item,entry.item.variants?.[index],index,entry.raw);
 }
 async setVariant(index){
  const entry=this.selectedEntry,item=this.selected;if(!entry?.raw||!item?.variants?.length)return;
  const next=((index%item.variants.length)+item.variants.length)%item.variants.length;
  entry.requestedVariant=next;const request=++entry.request;
  if(item.variantKind==='mask'){entry.variantIndex=next;entry.raw?.userData.setVariant?.(next,this.reduced);this.callbacks.onVariant?.(item,item.variants[next],next,entry.raw);return;}
  if(next===entry.variantIndex){this.callbacks.onLoading?.(false);return;}
  this.callbacks.onLoading?.(true);
  try{await this.loadVariant(entry,next);if(entry.request!==request)return;this.activateVariant(entry,next,true);}
  catch(error){if(entry.request===request){entry.requestedVariant=entry.variantIndex;this.callbacks.onError?.(item,error);}}
  finally{if(entry.request===request&&this.selected?.id===item.id)this.callbacks.onLoading?.(false);}
 }
 stepVariant(direction){const e=this.selectedEntry;if(e)this.setVariant((e.requestedVariant??e.variantIndex)+direction);}
 setAutoRotate(value){this.autoRotate=value;}
 setReduced(value){this.reduced=value;}
 setExploded(value){this.exploded=value;}
 resetModel(){if(this.mode==='rig'){this.rig.preset('overview');return;}this.userPitch=0;this.userYaw=0;const e=this.selectedEntry;if(e)e.spin=0;this.exploded=false;}
 getPart(hit){let obj=hit.object;while(obj){if(obj.userData.gearPart)return obj.userData.gearPart;obj=obj.parent;}return null;}
 hits(){this.raycaster.setFromCamera(this.pointer,this.camera);if(this.mode==='home')return this.raycaster.intersectObject(this.homeGroup,true);return intersectVariants(this.raycaster,this.cache.values());}
 entryFor(object){for(const e of this.cache.values()){let o=object;while(o){if(o===e.root)return e;o=o.parent;}}return null;}
 bindEvents(){const ui=e=>e.target.closest('button,a,dialog,#part-inspector,#rig-inventory');window.addEventListener('pointerdown',e=>{if(e.button!==0||ui(e)||document.querySelector('dialog[open]'))return;if(this.mode==='rig'){this.rig.down(e);return;}this.updatePointer(e);const hits=this.hits();let hit=hits.find(h=>!h.object.userData.pickThrough);const entry=hit?this.entryFor(hit.object):null;this.drag={x:e.clientX,y:e.clientY,lastX:e.clientX,lastTime:performance.now(),velocity:0,moved:false,start:this.target,rotate:entry?.item.id===this.selected?.id,hit,entry,startYaw:this.userYaw,startPitch:this.userPitch};});window.addEventListener('pointermove',e=>{if(this.mode==='rig'){this.rig.move(e);return;}this.updatePointer(e);if(!this.drag)return;const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;if(Math.hypot(dx,dy)>6)this.drag.moved=true;if(this.drag.moved){if(this.drag.rotate){this.userYaw=this.drag.startYaw+dx*.009;this.userPitch=THREE.MathUtils.clamp(this.drag.startPitch+dy*.006,-.65,.65);this.pauseUntil=performance.now()+2800;}else{this.target=this.drag.start-dx/Math.min(280,innerWidth*.62);const now=performance.now();this.drag.velocity=(e.clientX-this.drag.lastX)/Math.max(12,now-this.drag.lastTime);this.drag.lastX=e.clientX;this.drag.lastTime=now;}}});window.addEventListener('pointerup',e=>{if(this.mode==='rig'){this.rig.up(e);return;}const d=this.drag;if(!d)return;if(d.moved){if(!d.rotate)this.setTarget(Math.round(this.target-Math.max(-1.2,Math.min(1.2,d.velocity*.35))));}else if(d.hit){if(this.mode==='home'){let o=d.hit.object;while(o&&!o.userData.theme)o=o.parent;if(o)this.callbacks.onTheme?.(o.userData.theme);}else if(d.entry?.item.id===this.selected?.id){const part=this.getPart(d.hit)||d.entry.raw?.userData.gearPart;if(part)this.callbacks.onPickPart?.(part);}else if(d.entry){const idx=this.items.findIndex(p=>p.id===d.entry.item.id);this.setTarget(idx);}}this.drag=null;});window.addEventListener('pointercancel',()=>{if(this.rig)this.rig.drag=null;this.drag=null;if(this.items.length)this.setTarget(Math.round(this.target));});let wheel=0;window.addEventListener('wheel',e=>{if(this.mode==='rig'){if(document.querySelector('dialog[open]')||e.target.closest('#part-inspector,#rig-inventory'))return;e.preventDefault();this.rig.wheel(e);return;}if(this.mode!=='gallery'||document.querySelector('dialog[open]')||e.target.closest('#part-inspector'))return;const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;if(Math.abs(delta)<8)return;e.preventDefault();if(performance.now()-wheel>360){this.setTarget(Math.round(this.target)+Math.sign(delta));wheel=performance.now();}},{passive:false});window.addEventListener('resize',()=>this.resize());window.addEventListener('pagehide',()=>this.renderer.dispose(),{once:true});}
 updatePointer(e){this.pointer.set((e.clientX/innerWidth)*2-1,-(e.clientY/innerHeight)*2+1);this.pointerPixels={x:e.clientX,y:e.clientY};}
 resize(){if(this.mode==='rig'){this.renderer.setSize(innerWidth,innerHeight);this.rig.resize(innerWidth,innerHeight);return;}const mobile=innerWidth<761,home=this.mode==='home';this.camera.aspect=innerWidth/innerHeight;this.camera.fov=mobile?48:43;this.camera.position.set(0,mobile?(home?7.4:6.1):5.3,mobile&&home?30:19);this.camera.lookAt(0,mobile?2.5:2.0,-3.0);this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);this.homeGroup.scale.setScalar(mobile?.7:1);this.portalMobile=mobile;}
 project(point){const p=point.clone().project(this.camera);return {x:(p.x*.5+.5)*innerWidth,y:(-.5*p.y+.5)*innerHeight,visible:p.z<1&&p.z>-1};}
 frame(time){requestAnimationFrame(t=>this.frame(t));if(document.hidden||time-this.lastFrame<32)return;const dt=Math.min(.08,(time-this.lastFrame)/1000);this.lastFrame=time;if(this.mode==='rig'){this.rig.update(dt,time,this.reduced);this.renderer.render(this.rig.scene,this.rig.camera);return;}if(this.mode==='home'){const positions=[];for(let i=0;i<this.portals.length;i++){const portal=this.portals[i];if(this.portalMobile){portal.root.position.x=(i-1)*6.1;portal.root.position.z=-3-Math.abs(i-1)*.5;}else portal.root.position.x=(i-1)*7.25;if(!this.reduced)portal.model.rotation.y+=dt*.11;const world=portal.root.localToWorld(portal.labelPoint.clone());positions.push({id:portal.id,...this.project(world)});}this.callbacks.onPortalPositions?.(positions);}else{const ease=this.reduced?1:1-Math.exp(-dt*8);this.position+=(this.target-this.position)*ease;const count=this.items.length,labels=[];let occluder=null;for(const e of this.cache.values()){const idx=this.items.findIndex(p=>p.id===e.item.id);if(idx<0||!e.raw){e.root.visible=false;continue;}let delta=idx-this.position;while(delta>count/2)delta-=count;while(delta<-count/2)delta+=count;e.root.visible=Math.abs(delta)<3.45;if(!e.root.visible)continue;const a=delta*TAU/Math.max(count,3);const ringPosition=this.ringPoint(a);const focus=Math.exp(-Math.pow(delta*1.6,2));const size=(1.9+focus*4.5)*(this.portalMobile?Math.min(1,e.item.displayScale||1):(e.item.displayScale||1));const centerY=ringPosition.y+.9+focus*.5;e.root.position.set(ringPosition.x,centerY+(this.reduced?0:Math.sin(time*.00065+idx)*.035),ringPosition.z);
 if(!e.normalScale)e.normalScale=e.asset.userData.normalScale||e.asset.scale.x/size;e.asset.scale.setScalar(size*e.normalScale);
 if(Math.abs(delta)<.4&&this.autoRotate&&e.item.autoRotate!==false&&!this.reduced&&!this.drag&&performance.now()>(this.pauseUntil||0))e.spin+=dt*.17;
 for(const layer of e.layers?.values()||[]){layer.mix+=(layer.target-layer.mix)*(this.reduced?1:1-Math.exp(-dt*7));layer.unit.visible=layer.mix>.002||layer.target>0;blendLayer(layer);}e.raw?.userData.update?.(dt);
 const selected=e.item.id===this.selected?.id;e.asset.rotation.set(e.baseRotation[0]+(selected?this.userPitch:0),e.baseRotation[1]+e.spin+(selected?this.userYaw:0),e.baseRotation[2]);
 if(e.raw?.userData.partGroups){for(const pg of e.raw.userData.partGroups){const base=pg.userData.basePosition||new THREE.Vector3();const exp=selected&&this.exploded?pg.userData.explode||[0,0,0]:[0,0,0];const desired=base.clone().add(new THREE.Vector3(...exp));pg.position.lerp(desired,1-Math.exp(-dt*7));}}
 if(selected&&e.item.variantKind==='mask'){const b=e.raw.userData.fitBounds;const corners=[[b.min[0],b.min[1]],[b.min[0],b.max[1]],[b.max[0],b.min[1]],[b.max[0],b.max[1]]].map(([x,y])=>this.project(e.raw.localToWorld(new THREE.Vector3(x,y,0))));occluder={left:Math.min(...corners.map(p=>p.x)),right:Math.max(...corners.map(p=>p.x)),top:Math.min(...corners.map(p=>p.y)),bottom:Math.max(...corners.map(p=>p.y))};}
 const anchor=e.root.position.clone();anchor.y-=size*e.height*.52+.2;labels.push({id:e.item.id,title:e.item.title,selected,...this.project(anchor)});
 }this.callbacks.onModelPositions?.(labels,occluder);this.dial.rotation.y=this.position*.35;}
 if(time-this.hoverTime>130&&!this.drag&&!document.querySelector('dialog[open]')){this.hoverTime=time;if(this.mode==='gallery'&&this.selectedEntry?.raw&&!this.selectedEntry.raw.userData.cloud){const hit=this.hits().find(h=>this.entryFor(h.object)?.item.id===this.selected?.id&&!h.object.userData.pickThrough);const p=hit?this.getPart(hit):null;this.callbacks.onHover?.(p,this.pointerPixels);}else this.callbacks.onHover?.(null);}
 this.callbacks.onTick?.(time);this.renderer.render(this.scene,this.camera);}
}
