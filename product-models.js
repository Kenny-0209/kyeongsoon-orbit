import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {products} from './product-data.js';
import {prepareProductSurface} from './product-surface.js?v=slotsMatte7';
import {createMountedCooler} from './cooler-model.js?v=slotsMatte7';
import {boardLayout,cpuPosition,cpuSize,pumpMount,ramSize,ramPositions,gpuSize,gpuPosition,storageMounts,layoutSources,pcUnitsPerMm,dimmAnchors,gpuSlot} from './pc-layout.js?v=slotsMatte7';

// One parsed source per file, at most two concurrent transfers. Clones share
// geometry and images, including two RAM modules and the two Rift sensors.
const loader=new GLTFLoader(),cache=new Map(),pending=[];
let active=0,readFile=file=>loader.loadAsync(new URL(file,import.meta.url).href);
export function setProductLoaderForCheck(callback){readFile=callback;cache.clear();}
function drain(){while(active<2&&pending.length){const job=pending.shift();active++;readFile(job.file).then(gltf=>prepareProductSurface(gltf,job.file)).then(job.resolve,job.reject).finally(()=>{active--;drain();});}}
function source(file){if(!cache.has(file)){const promise=new Promise((resolve,reject)=>{pending.push({file,resolve,reject});drain();}).catch(error=>{cache.delete(file);throw error;});cache.set(file,promise);}return cache.get(file);}
const orientation={loomi:[0,-Math.PI/2,0],wrist:[0,Math.PI/2,0],board:[Math.PI/2,0,0],ram:[0,Math.PI/2,Math.PI/2],ssd9902:[0,Math.PI/2,0]};
export const deskUnitsPerMm=18/1590;
export const modelNote='실제 사진으로 생성한 형상·텍스처와 사용자 제공 GLB입니다. 미관측 면과 문자, 내부 배치는 전시용 추정값입니다.';
const descriptions={desk:'화이트 모션데스크 · 나의 작업 환경을 받치는 베이스',chair:'블랙 의자 · 메쉬 등판과 헤드레스트',stand:'검정 2단 거치대 · 위쪽 LOOMI와 아래쪽 VM87',loomi:'네이비 실버 · 거치대 위쪽의 키보드',cover:'LOOMI용 검정 루프 · 살짝 비치는 반투명 재질',vm87:'거치대 아래쪽의 자석축 키보드',hyzen:'정면의 스페이스 그레이 키보드',wrist:'Hyzen과 같은 스페이스 그레이 팜레스트',pad:'검정 FX ZERO · 둥근 모서리와 2mm 두께',infinity:'Angry Miao의 타공 셸 마우스',scyrox:'SCYROX V8 무선 마우스',lift:'Logitech Lift 세로형 마우스',supermix:'오른쪽 원본과 반사해 만든 왼쪽 이어피스',p600s:'Phanteks P600S 본체 케이스',cpu:'연구·개발용 워크스테이션의 프로세서',board:'MSI Z690 메인보드 · DDR4 메모리 사용',ram:'16GB 모듈 두 개 · 총 32GB',gpu:'워크스테이션의 RTX 3090 Ti · 24GB',ssd980250:'운영체제·자료 저장용 NVMe SSD · 250GB',ssd9801:'Samsung 980 NVMe SSD · 1TB',ssd9901:'Samsung 990 PRO NVMe SSD · 1TB',ssd9902:'Samsung 990 PRO NVMe SSD · 2TB',hdd:'Seagate 하드디스크 · 2TB',orin:'본체 곁에서 사용하는 Jetson AGX Orin 개발 키트',aoc:'중앙의 27형 QHD 모니터',s61b:'왼쪽에서 세로로 사용하는 27형 모니터',q2775ce:'오른쪽의 래안텍 27형 모니터','rift-head':'Oculus Rift CV1 헤드셋','rift-sense':'모니터 양옆에 놓인 외부 센서 두 개','touch-L':'Oculus Touch 왼손 컨트롤러','touch-R':'Oculus Touch 오른손 컨트롤러',x73:'NZXT Kraken X73 수랭 쿨러'};
const officialUrls={cpu:'https://www.intel.com/content/www/us/en/products/sku/134595/intel-core-i712700kf-processor-25m-cache-up-to-5-00-ghz/specifications.html',board:'https://www.msi.com/Motherboard/MAG-Z690-TOMAHAWK-WIFI-DDR4',ram:'https://www.gskill.com/product/165/166/1536654621/F4-3200C16D-32GTZR',gpu:'https://www.gigabyte.com/Graphics-Card/GV-N309TGAMING-OC-24GD',p600s:'https://phanteks.com/product/eclipse-p600s-tg-black/',x73:'https://support.nzxt.com/hc/en-us/articles/37948576723355-Kraken-X3-Series-Specs',orin:'https://docs.nvidia.com/jetson/agx-orin-devkit/user-guide/1.0/hardware-layout.html',loomi:'https://smartstore.naver.com/spmshop/products/12906788507'};

export function productInfo(id){
 const p=products[id];if(!p)throw new Error('Unknown product '+id);
 return {id,name:p.name,description:descriptions[id]||p.name,productUrl:officialUrls[id]||p.url,modelId:id,modelUrl:p.files[0].file,downloads:p.files.map(f=>({url:f.file,label:f.side==='left'?'왼쪽 GLB':f.side==='right'?'오른쪽 GLB':'이 3D 모델 받기'}))};
}
function geometrySubset(geometry,indices){
 const unique=[...new Set(indices)],lookup=new Map(unique.map((v,i)=>[v,i]));const out=new THREE.BufferGeometry();
 for(const [name,attribute]of Object.entries(geometry.attributes)){
  const values=new attribute.array.constructor(unique.length*attribute.itemSize);
  for(let j=0;j<unique.length;j++)for(let k=0;k<attribute.itemSize;k++)values[j*attribute.itemSize+k]=attribute.array[unique[j]*attribute.itemSize+k];
  out.setAttribute(name,new THREE.BufferAttribute(values,attribute.itemSize,attribute.normalized));
 }
 out.setIndex(indices.map(i=>lookup.get(i)));out.userData={...geometry.userData};out.computeBoundingBox();out.computeBoundingSphere();return out;
}
// Turn only the display panel. Keep the original GLB's stand upright.
function portraitDisplay(scene){
 scene.updateMatrixWorld(true);const whole=new THREE.Box3().setFromObject(scene),cut=whole.min.y+(whole.max.y-whole.min.y)*.29;
 const result=new THREE.Group(),panel=new THREE.Group();result.add(panel);
 scene.traverse(mesh=>{
  if(!mesh.isMesh)return;const position=mesh.geometry.attributes.position,index=mesh.geometry.index?.array||Array.from({length:position.count},(_,i)=>i),upper=[],lower=[];
  const ys=Array.from({length:position.count},(_,i)=>new THREE.Vector3().fromBufferAttribute(position,i).applyMatrix4(mesh.matrixWorld).y);
  for(let i=0;i<index.length;i+=3){const ids=[index[i],index[i+1],index[i+2]];((ys[ids[0]]+ys[ids[1]]+ys[ids[2]])/3>cut?upper:lower).push(...ids);}
  for(const [indices,parent]of [[upper,panel],[lower,result]])if(indices.length){const part=new THREE.Mesh(geometrySubset(mesh.geometry,indices),mesh.material);part.applyMatrix4(mesh.matrixWorld);parent.add(part);}
 });
 const box=new THREE.Box3().setFromObject(panel),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
 for(const child of panel.children)child.position.sub(center);
 panel.rotation.z=Math.PI/2;panel.position.copy(center);panel.position.y+=(size.x-size.y)/2;
 result.userData.portraitPanelOnly=true;return result;
}

export function createProduct(id,options={}){
 const info=productInfo(id),root=new THREE.Group(),content=new THREE.Group();root.name='product-'+id;root.add(content);
 const size=options.size||[1,1,1],placeholder=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshBasicMaterial({color:'#547583',wireframe:true,transparent:true,opacity:.12}));placeholder.position.y=size[1]/2;content.add(placeholder);
 Object.assign(root.userData,{isProductSlot:true,productId:id,gearPart:info,modelUrl:info.modelUrl,assetState:'loading',modelNote,targetDimensions:size,portrait:!!options.portrait});
 let ready;
 const load=()=>{
  root.userData.assetState='loading';root.userData.assetError=null;
  ready=source(options.file||info.modelUrl).then(gltf=>{
   let raw=gltf.scene.clone(true);if(options.portrait)raw=portraitDisplay(raw);
   const posed=new THREE.Group();posed.add(options.coolerMount?createMountedCooler(raw,options.coolerMount):raw);posed.rotation.set(...(options.rotation||orientation[id]||[0,0,0]));
   const fit=new THREE.Group();fit.add(posed);let box=new THREE.Box3().setFromObject(posed),extent=box.getSize(new THREE.Vector3());
   if(options.coolerMount)fit.scale.setScalar(1);
   else if(options.stretch)fit.scale.set(...size.map((v,i)=>v/Math.max(extent.getComponent(i),1e-8)));
   else fit.scale.setScalar(Math.min(...size.map((v,i)=>v/Math.max(extent.getComponent(i),1e-8))));
   box=new THREE.Box3().setFromObject(fit);
   if(options.exactHeight)fit.scale.y*=options.exactHeight/Math.max(box.max.y-box.min.y,1e-8);
   box=new THREE.Box3().setFromObject(fit);const center=box.getCenter(new THREE.Vector3());if(!options.coolerMount)fit.position.set(-center.x,-box.min.y,-center.z);
   fit.traverse(mesh=>{if(mesh.isMesh){mesh.userData.gearPart=info;mesh.userData.productId=id;mesh.castShadow=false;mesh.receiveShadow=false;if(id==='cover'){mesh.renderOrder=4;for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])m.depthWrite=false;}}});
   content.clear();content.add(fit);placeholder.geometry.dispose();placeholder.material.dispose();root.userData.assetState='ready';root.userData.actualDimensions=new THREE.Box3().setFromObject(content).getSize(new THREE.Vector3()).toArray();return root;
  }).catch(error=>{root.userData.assetState='error';root.userData.assetError=error.message;placeholder.material.color.set('#a86c5c');placeholder.material.opacity=.5;throw error;});
  // A failed transfer is visible and retryable, never silently called complete.
  ready.catch(()=>{});return ready;
 };
 Object.defineProperty(root.userData,'ready',{get:()=>ready,enumerable:false});Object.defineProperty(root.userData,'retry',{value:load,enumerable:false});load();return root;
}

export function createTexturedWorkstation(){
 const root=new THREE.Group();root.name='textured-workstation';root.userData.parts=[];const parts=[];
 function add(id,size,pos,explode,options={}){
  const group=new THREE.Group();group.name='pc-'+id;group.userData.gearPart=productInfo(id);group.userData.productId=id;group.userData.basePosition=new THREE.Vector3(...pos);group.userData.explode=explode;group.position.set(...pos);
  group.add(createProduct(id,{size,...options}));root.add(group);parts.push(group);root.userData.parts.push(group.userData.gearPart);return group;
 }
 add('p600s',[4.8,5.06,2.3],[0,0,0],[0,.1,-2.1],{stretch:true});
 const board=add('board',[boardLayout.width,boardLayout.height,boardLayout.depth],[boardLayout.left+boardLayout.width/2,boardLayout.bottom,boardLayout.front-boardLayout.depth/2],[-2.15,.5,-.4],{stretch:true});
 add('cpu',cpuSize,cpuPosition,[-2.8,1.8,1.8],{stretch:true});
 add('x73',[3.3,.9,1.8],[0,0,0],[0,2,0],{coolerMount:{pump:pumpMount}});
 const ram=add('ram',ramSize,ramPositions[0],[2.1,1.0,1.6],{stretch:true});const second=createProduct('ram',{size:ramSize,stretch:true});second.position.x=ramPositions[1][0]-ramPositions[0][0];ram.add(second);ram.userData.slot='DIMMA2 · DIMMB2';
 const gpu=add('gpu',gpuSize,gpuPosition,[0,-.15,2.4],{rotation:[Math.PI,0,0],stretch:true});gpu.userData.slot='PCI_E1';
 for(const mount of storageMounts){const ssd=add(mount.id,mount.size,mount.position,[0,0,2.7],{stretch:true});Object.assign(ssd.userData,{slot:mount.slot,slotConfidence:mount.confidence,slotNote:mount.note});}
 add('hdd',[147*pcUnitsPerMm,26.1*pcUnitsPerMm,101.6*pcUnitsPerMm],[1.25,.15,-.1],[2.6,-.1,1.5],{rotation:[-Math.PI/2,0,0],stretch:true});
 // Visible connector bodies share the motherboard's selection and move with it.
 const connectors=new THREE.Group();connectors.name='motherboard-connectors';board.add(connectors);
 function socket(name,size,position){const geometry=new THREE.BoxGeometry(...size);geometry.userData.smoothSurface=true;const mesh=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({color:'#20272c',side:THREE.DoubleSide}));mesh.material.userData.displayFinish='matte-diffuse';mesh.name=name;mesh.position.set(position[0]-board.position.x,position[1]-board.position.y,position[2]-board.position.z);mesh.userData.gearPart=productInfo('board');mesh.userData.productId='board';connectors.add(mesh);}
 for(const anchor of dimmAnchors)socket(anchor.slot,[.052,ramSize[1]+.06,.04],[anchor.position[0],anchor.position[1],boardLayout.front+.02]);
 socket('PCI_E1',[89*pcUnitsPerMm,.035,.055],[...gpuSlot.position.slice(0,2),boardLayout.front+.025]);
 for(const mount of storageMounts)socket(mount.slot,[.04,mount.size[1],.035],[mount.connector[0],mount.connector[1],boardLayout.front+.0175]);
 root.userData.layoutSources=layoutSources;
 const arranged={p600s:[-5.1,0,0],board:[-.75,2.1,0],x73:[3,4.5,0],gpu:[3,2.7,0],cpu:[-.7,.8,0],ram:[.8,.4,0],hdd:[3.5,.75,0],ssd980250:[-1.4,-.7,0],ssd9801:[0,-.7,0],ssd9901:[1.4,-.7,0],ssd9902:[2.8,-.7,0]};
 for(const part of parts)part.userData.openPosition=new THREE.Vector3(...arranged[part.userData.productId]);
 Object.defineProperty(root.userData,'partGroups',{value:parts,enumerable:false});root.userData.dimensions={width:4.8,height:5.06,depth:2.3};return root;
}

export function productStatus(root){
 const grouped=new Map();root.traverse(o=>{if(o.userData.isProductSlot){const id=o.userData.productId;if(!grouped.has(id))grouped.set(id,[]);grouped.get(id).push(o.userData.assetState);}});
 const ready=[...grouped].filter(([,states])=>states.every(s=>s==='ready')).map(([id])=>id),failed=[...grouped].filter(([,states])=>states.includes('error')).map(([id])=>id);
 return {ready:ready.length,total:grouped.size,failed,ids:[...grouped.keys()]};
}
export function waitForProducts(root){const promises=[];root.traverse(o=>{if(o.userData.isProductSlot)promises.push(o.userData.ready);});return Promise.allSettled(promises).then(()=>productStatus(root));}
