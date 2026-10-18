import * as THREE from 'three';
import {createProduct,createTexturedWorkstation,productInfo,deskUnitsPerMm,waitForProducts,modelNote} from './product-models.js?v=slotsMatte7';

export function createDeskAssembly(){
 const root=new THREE.Group();root.name='THE-RIG';root.userData.modelNote=modelNote;root.userData.floorY=-8.26;
 const equipment=[];Object.defineProperty(root.userData,'equipment',{value:equipment,enumerable:false});
 function add(id,modelId,group,raw,pos,rotation=[0,0,0],extra={},parent=root){
  const wrapper=new THREE.Group();wrapper.name=id;wrapper.userData.rigId=id;wrapper.add(raw);wrapper.position.set(...pos);wrapper.rotation.set(...rotation);parent.add(wrapper);
  const p=modelId?productInfo(modelId):{};
  const item={id,modelId,title:p.name||'나의 워크스테이션',group,raw,wrapper,modelUrl:p.modelUrl,downloads:p.downloads,subtitle:p.description||'',productUrl:p.productUrl,fields:[],...extra};equipment.push(item);return item;
 }
 const floorY=root.userData.floorY;
 add('motion-desk','desk','furniture',createProduct('desk',{size:[18,8.26,8.5],stretch:true}),[0,floorY,0],[0,0,0],{subtitle:'화이트 · 실제 제품 모델',fields:[['상판','1590 × 770 mm'],['색상','화이트 · 사용자 확인']]});
 add('desk-chair','chair','furniture',createProduct('chair',{size:[6.6,11.7,6.5]}),[-6.3,floorY,8.1],[0,Math.PI+.12,0],{subtitle:'블랙 · 헤드레스트와 메쉬 등판'});
 const stand=add('keyboard-stand','stand','input',createProduct('stand',{size:[1.7,4.415,1.925]}),[-6.65,.015,.05],[0,0,0],{subtitle:'검정 · 위쪽 LOOMI, 아래쪽 VM87',fields:[['색상','검정 · 사용자 확인']]});
 for(const [i,id]of ['loomi','vm87'].entries()){
  const raw=createProduct(id,{size:[4.2,.65,1.78]});raw.rotation.x=1.35;raw.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(raw),center=box.getCenter(new THREE.Vector3());
  const surface=i===0?219*deskUnitsPerMm+.07:18*deskUnitsPerMm+.07;
  raw.position.set(-center.x,surface-box.min.y,170*deskUnitsPerMm/2-.12-center.z);
  add('keyboard-'+id,id,'input',raw,stand.wrapper.position.toArray(),[0,0,0],{subtitle:i===0?'위쪽 거치대 · 네이비 실버':'아래쪽 거치대 · 자석축'});
  if(id==='loomi')add('keyboard-cover','cover','input',createProduct('cover',{size:[4.36,.66,1.82],stretch:true}),[0,.045,0],[0,0,0],{subtitle:'LOOMI 위 · 검정 반투명',fields:[['불투명도','78% · 사용자 요청 반영']]},raw);
 }
 add('keyboard-hyzen','hyzen','input',createProduct('hyzen',{size:[3.85,.55,1.72]}),[-1.4,.02,1.75],[0,0,0],{subtitle:'정면 · 스페이스 그레이'});
 add('wrist-rest','wrist','input',createProduct('wrist',{size:[3.85,.30,.80]}),[-1.4,.015,3.12],[0,0,0],{subtitle:'Hyzen과 같은 스페이스 그레이'});
 const padHeight=2*deskUnitsPerMm;
 add('mouse-pad','pad','input',createProduct('pad',{size:[5.15,padHeight,4.12],stretch:true,exactHeight:padHeight}),[3.65,.012,1.35],[0,0,0],{subtitle:'블랙 · 둥근 모서리 · 두께 2mm',fields:[['두께','2mm · 사용자 지정'],['가로세로 · 경도','소유 제품 옵션 미확정']]});
 for(const [i,id]of ['infinity','scyrox','lift'].entries())add('mouse-'+id,id,'input',createProduct(id,{size:[.80,id==='lift'?.80:.56,1.28]}),[2+i*1.55,.012+padHeight,1.0]);
 for(const [id,model,x,portrait]of [['monitor-1','s61b',-4.15,true],['monitor-0','aoc',-.25,false],['monitor-2','q2775ce',4.35,false]])add(id,model,'display',createProduct(model,{size:portrait?[3.1,6.4,2.2]:[5.30,4.9,2.7],portrait}),[x,.02,-2.95],[0,model==='s61b'?.09:model==='q2775ce'?-.1:0,0],{subtitle:(model==='s61b'?'왼쪽 · 세로':model==='aoc'?'중앙 · 가로':'오른쪽 · 가로')+' · 27형 QHD',fields:[['방향',portrait?'세로 · 화면만 회전':'가로']]});
 const pc=createTexturedWorkstation();pc.scale.setScalar(1.35);
 const workstation=add('workstation',null,'compute',pc,[11.35,floorY,.1],[0,-.25,0],{title:'나의 워크스테이션',subtitle:'P600S · Kraken X73 · RTX 3090 Ti',detailProject:'workstation',fields:[['CPU','Intel Core i7-12700KF'],['GPU','GIGABYTE RTX 3090 Ti GAMING OC · 24GB'],['메모리','G.SKILL Trident Z RGB · 16GB × 2'],['저장장치','980 250GB·1TB / 990 PRO 1TB·2TB / HDD 2TB']]});
 for(const part of pc.userData.partGroups){const id=part.userData.productId,p=productInfo(id);part.userData.rigId='pc-'+id;equipment.push({id:'pc-'+id,modelId:id,title:p.name,group:'components',raw:part,wrapper:part,modelUrl:p.modelUrl,downloads:p.downloads,productUrl:p.productUrl,subtitle:id==='ram'?'동일 모듈 두 개':p.description,fields:[...(id==='ram'?[['구성','16GB × 2'],['장착 슬롯','DIMMA2 · DIMMB2 · Windows 확인']]:part.userData.slot?[['장착 슬롯',part.userData.slot]]:[]),...(part.userData.slotNote?[['위치 근거',part.userData.slotNote]]:[])],detailProject:'workstation',pcPart:true});}
 add('jetson','orin','compute',createProduct('orin',{size:[1.55,.8,1.55]}),[7.4,.02,-1.5],[0,-.15,0],{subtitle:'본체 옆 · Jetson AGX Orin 64GB',detailProject:'jetson'});
 const earphones=new THREE.Group();earphones.userData.gearPart=productInfo('supermix');
 for(const side of ['left','right']){const raw=createProduct('supermix',{file:productInfo('supermix').downloads.find(f=>f.label.startsWith(side==='left'?'왼쪽':'오른쪽')).url,size:[.6,.55,.65]});raw.position.set(side==='left'?-.43:.43,0,side==='left'?-.2:.2);raw.rotation.y=side==='left'?-.4:.4;earphones.add(raw);}
 add('earphones','supermix','audio',earphones,[-4.05,.02,2.7],[0,-.3,0],{subtitle:'사용자 제공 오른쪽 유닛과 반사한 왼쪽 유닛',fields:[['유닛','오른쪽 원본 · 왼쪽 X축 반사본']]});
 for(const [id,model,title,pos,size,yaw]of [
  ['rift-sensor-left','rift-sense','Oculus Rift · 왼쪽 센서',[-6,.02,-3.35],[1.1,2.5,1.5],0],
  ['rift-sensor-right','rift-sense','Oculus Rift · 오른쪽 센서',[7.15,.02,-3.35],[1.1,2.5,1.5],0],
  ['rift-headset','rift-head','Oculus Rift CV1 · 헤드셋',[7.4,.02,1.05],[2.2,1.8,2.3],Math.PI+.2],
  ['rift-touch-left','touch-L','Oculus Touch · 왼손',[6.4,.02,3.05],[1.1,1.3,1.4],-.2],
  ['rift-touch-right','touch-R','Oculus Touch · 오른손',[8,.02,3.05],[1.4,1.3,1.2],.2]
 ])add(id,model,'vr',createProduct(model,{size}),pos,[0,yaw,0],{title,subtitle:model==='rift-sense'?'스탠드형 외부 센서':title,detailProject:'vr'});
 root.updateMatrixWorld(true);Object.defineProperty(root.userData,'ready',{value:waitForProducts(root),enumerable:false});Object.defineProperty(root.userData,'workstation',{value:workstation,enumerable:false});return root;
}
