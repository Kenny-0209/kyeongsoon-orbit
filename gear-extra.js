import * as THREE from 'three';

// Small reference-derived desk accessories. No remote textures or dependencies.
// Y-up, front -Z, grounded at Y0 and centred in XZ. Dimensions are display units.
const URL={pad:'https://artisan-jp.com/global/fx-zero',rest:'https://www.lofree.co/pages/hyzen',earphones:'https://www.linsoul.com/products/simgot-supermix-4'};
const mat=(color,metalness=0,roughness=.5)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
const part=(kind,name,description)=>({name,description,productUrl:URL[kind]});
function group(kind,name,description){const g=new THREE.Group();g.name=name;g.userData.gearPart=part(kind,name,description);return g;}
function add(parent,geo,material,p,pos=[0,0,0],rot=[0,0,0]){const m=new THREE.Mesh(geo,material);m.name=p.name;m.userData.gearPart=p;m.position.set(...pos);m.rotation.set(...rot);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function rect(w,d,r){const s=new THREE.Shape();s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);s.closePath();return s;}
function flat(shape,height,bevel=0){const g=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:2,steps:1,curveSegments:10});g.rotateX(-Math.PI/2);return g;}
function tube(parent,points,r,material,p,segments=48){const c=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));return add(parent,new THREE.TubeGeometry(c,segments,r,5,false),material,p);}
function cylinder(parent,r,h,material,p,pos,rot=[0,0,0]){return add(parent,new THREE.CylinderGeometry(r,r,h,20),material,p,pos,rot);}
function settle(g){const b=new THREE.Box3().setFromObject(g),c=b.getCenter(new THREE.Vector3()),offset=new THREE.Vector3(c.x,b.min.y,c.z);for(const o of g.children)o.position.sub(offset);g.userData.axes='Y-up; front -Z; bottom Y0; XZ bounding centre at origin';g.userData.modelNote='실제 제품 사진을 참고한 경량 외형 모델. 정밀 실측 CAD가 아니며 내부 구조와 작은 각인은 단순화했습니다.';g.traverse(o=>{if(o.isMesh&&!o.userData.gearPart)o.userData.gearPart=g.userData.gearPart;});return g;}
function confirmed(g,note){g.userData.colorNote=`사용자 확인 색상: ${note}.`;g.userData.colorSource='user-confirmed';g.userData.colorConfirmedOn='2026-10-17';}
function logoTexture(text,color='#b6b8b9'){
  if(typeof document==='undefined')return null;
  const c=document.createElement('canvas');c.width=512;c.height=160;const x=c.getContext('2d');if(!x)return null;
  x.fillStyle=color;x.font='italic 42px Georgia, serif';x.fillText(text,18,62);x.font='20px sans-serif';x.fillText('MADE IN JAPAN',22,108);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,side:THREE.DoubleSide});
}
export function createMousePad(){
  const g=group('pad','ARTISAN NINJA FX ZERO','검정 폴리에스터 천 표면과 가장자리 스티칭이 있는 FX ZERO 마우스패드');
  const cloth=mat('#181a1b',0,.98),base=mat('#0b0c0d',0,1),stitch=mat('#303234',0,.96);
  add(g,flat(rect(5,4,.11),.035),base,part('pad','논슬립 베이스','마우스패드 바닥의 얇은 고무 베이스'));
  add(g,flat(rect(4.98,3.98,.105),.008),cloth,part('pad','ZERO 직물 표면','공식 설명의 폴리에스터 100% 천 표면. 실제 표면 감촉과 경도는 시각 모델에서 재현하지 않았습니다.'),[0,.035,0]);
  const edge=rect(4.96,3.96,.10).getPoints(84).map(v=>[v.x,.044,-v.y]);edge.push(edge[0]);
  tube(g,edge,.009,stitch,part('pad','FX 스티치 테두리','FX 제품의 둥근 모서리와 연속된 봉제 가장자리'),160);
  const perimeter=new THREE.CatmullRomCurve3(edge.map(v=>new THREE.Vector3(...v)),true,'centripetal'),positions=[];
  for(let i=0;i<240;i++){const a=perimeter.getPoint(i/240),t=perimeter.getTangent(i/240),n=new THREE.Vector3(t.z,0,-t.x).multiplyScalar(.012);positions.push(a.x-n.x,.055,a.z-n.z,a.x+n.x,.055,a.z+n.z);}
  const stitchGeo=new THREE.BufferGeometry();stitchGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));const lines=new THREE.LineSegments(stitchGeo,new THREE.LineBasicMaterial({color:'#444548'}));lines.name='봉제선';lines.userData.gearPart=part('pad','봉제선','가장자리 스티칭의 반복 간격을 단순화했습니다.');g.add(lines);
  const logo=logoTexture('ARTISAN');if(logo)add(g,new THREE.PlaneGeometry(.58,.18),logo,part('pad','ARTISAN 표시','제품 사진의 모서리 브랜드 표시는 코드로 다시 그린 근사 각인입니다.'),[2.05,.057,-1.73],[-Math.PI/2,0,0]);
  g.userData.product='ARTISAN NINJA FX ZERO';g.userData.productUrl=URL.pad;confirmed(g,'블랙 (Black)');
  g.userData.sizeNote='표시 크기 약 5×4 world units. 실제 소유 제품의 S/M/L/XL/XXL 크기와 XSOFT/SOFT/MID 경도는 확인되지 않았습니다.';
  return settle(g);
}
export function createWristRest(){
  const g=group('rest','LOFREE Hyzen Palm Rest','사용자가 소유한 Hyzen과 같은 스페이스 그레이 색의 전용 팜레스트');
  const metal=mat('#454a51',.8,.36),edge=mat('#272b31',.68,.38),rubber=mat('#15171a',0,.95);
  const shape=rect(7,.9,.035),geo=flat(shape,.18,.012),p=geo.getAttribute('position');
  for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+(.5+p.getZ(i)/.9)*.11);geo.computeVertexNormals();
  add(g,geo,metal,part('rest','경사진 알루미늄 상판','공식 컬러 사진의 넓고 낮은 경사면과 곧게 뻗은 전면 윤곽을 참고했습니다.'),[0,.025,0]);
  add(g,flat(rect(6.98,.88,.025),.025),edge,part('rest','하부 테두리','상판 아래의 어두운 얇은 테두리'),[0,.008,0]);
  for(const x of [-2.8,2.8])for(const z of [-.25,.25])add(g,flat(rect(.35,.12,.025),.016),rubber,part('rest','미끄럼 방지 패드','바닥과 닿는 고무 발은 배치를 위한 단순 표현입니다.'),[x,0,z]);
  g.userData.product='LOFREE Hyzen Palm Rest';g.userData.productUrl=URL.rest;confirmed(g,'Hyzen과 같은 스페이스 그레이 (Space Gray)');g.userData.ownershipSource='사용자가 Hyzen과 동색 팜레스트 소유를 확인';g.userData.sizeNote='표시 폭 약7, 깊이0.9 world units. 실측 치수가 아닌 키보드 폭에 맞춘 배치용 비율입니다.';
  return settle(g);
}
function earShape(){
  const s=new THREE.Shape();s.moveTo(-.40,-.29);s.bezierCurveTo(-.58,-.12,-.40,.25,-.18,.48);s.bezierCurveTo(-.07,.63,.05,.57,.17,.40);s.bezierCurveTo(.35,.20,.55,-.12,.39,-.36);s.bezierCurveTo(.28,-.54,-.20,-.45,-.40,-.29);s.closePath();return s;
}
function earpiece(side){
  const left=side==='left',s=left?-1:1,g=group('earphones',`earpiece-${side}`,`${left?'왼쪽':'오른쪽'} SUPERMIX 4 이어피스`);
  const resin=mat('#11151a',.12,.22),face=mat('#25282c',.45,.66),gold=mat('#d7a16c',.82,.25),tip=mat('#92969b',0,.55);
  const shell=add(g,flat(earShape(),.22,.075),resin,part('earphones','블랙 레진 하우징','접사의 둥근 삼각형 외곽과 불룩한 안쪽 레진 쉘을 참고했습니다.'),[0,.12,0]);
  const plate=add(g,flat(earShape(),.028,.014),face,part('earphones','무광 금속 페이스플레이트','검정 레진 본체 위의 어두운 무광 금속 페이스플레이트'),[0,.36,0]);plate.scale.set(.94,1,.94);
  const ring=add(g,new THREE.TorusGeometry(.265,.009,5,52),gold,part('earphones','금색 원환 디테일','실제 접사의 얇은 금색 원환과 작은 검정 포트. 드라이버 단면을 뜻하지 않습니다.'),[.018,.406,-.018],[-Math.PI/2,0,0]);ring.scale.set(.93,1.13,1);
  cylinder(g,.034,.02,resin,part('earphones','페이스플레이트 포트','금색 원환 한쪽 끝의 작은 검정 포트'),[-.17,.414,.18]);
  const nozzle=group('earphones','nozzle', '귀 안쪽으로 기울어진 노즐과 회색 실리콘 이어팁');g.add(nozzle);nozzle.position.set(s*.34,.14,.12);nozzle.rotation.z=-s*Math.PI/2;nozzle.rotation.x=.2;
  cylinder(nozzle,.105,.26,resin,part('earphones','노즐','레진 쉘 안쪽에서 이어팁으로 연결되는 짧은 노즐'),[0,.10,0]);
  const dome=add(nozzle,new THREE.SphereGeometry(.205,20,12),tip,part('earphones','회색 실리콘 이어팁','제공 사진의 회색 반투명 실리콘 팁을 불투명 외형으로 단순화했습니다.'),[0,.25,0]);dome.scale.set(1,.68,1);
  add(nozzle,new THREE.TorusGeometry(.082,.024,5,18),resin,part('earphones','이어팁 개구','이어팁 중앙 소리 구멍의 테두리'),[0,.382,0],[-Math.PI/2,0,0]);
  add(g,flat(rect(.19,.12,.025),.022),mat('#777b80',.8,.3),part('earphones','0.78mm 2핀 커넥터','공식 유통 제품정보에 명시된 탈착식 0.78mm 2핀 접점. 표시 모델에서 핀 간격은 실측 비례가 아닙니다.'),[0,.26,-.49]);
  for(const x of [-.047,.047])cylinder(g,.018,.04,resin,part('earphones','2핀 단자 구멍','케이블이 꽂히는 두 접점의 외형'),[x,.294,-.49]);
  g.userData.side=side;return g;
}
function braid(parent,points,p){
  const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),materials=[mat('#bfc5ce',.65,.27),mat('#7f8895',.6,.32)];
  for(let strand=0;strand<2;strand++){
    const samples=[];
    for(let i=0;i<=108;i++){const t=i/108,v=curve.getPoint(t),tan=curve.getTangent(t),side=new THREE.Vector3(tan.z,0,-tan.x).normalize(),up=new THREE.Vector3().crossVectors(tan,side).normalize(),a=t*Math.PI*32+strand*Math.PI;v.addScaledVector(side,Math.cos(a)*.011).addScaledVector(up,Math.sin(a)*.011);samples.push(v.toArray());}
    tube(parent,samples,.013,materials[strand],p,126);
  }
}
export function createEarphones(){
  const g=group('earphones','SIMGOT SUPERMIX 4','좌우 검정 레진 이어피스와 실버 브레이드 케이블, 3.5mm 플러그의 외형');
  const left=earpiece('left'),right=earpiece('right');left.position.set(-1.10,0,-.95);left.rotation.y=-.28;right.position.set(1.10,0,-.95);right.rotation.y=.28;g.add(left,right);
  const cable=group('earphones','cable','은도금 무산소 구리 브레이드 케이블의 가벼운 외형 표현');g.add(cable);
  for(const s of [-1,1]){
    const hook=[[s*1.24,.28,-1.40],[s*1.46,.38,-1.68],[s*1.86,.22,-1.46],[s*1.94,.10,-.83],[s*1.47,.055,-.08],[s*.29,.06,.76]];
    braid(cable,hook,part('earphones',s<0?'왼쪽 이어훅 케이블':'오른쪽 이어훅 케이블','귓바퀴를 둘러가는 이어훅과 Y 분기까지 이어지는 은색 꼬임선. 케이블의 놓인 모양은 배치용 구성입니다.'));
    cylinder(cable,.039,.19,mat('#21252b',.45,.3),part('earphones','2핀 케이블 하우징','레진 쉘 윗면으로 들어가는 케이블 커넥터'),[s*1.24,.29,-1.41],[.6,0,s*.25]);
  }
  cylinder(cable,.07,.30,mat('#292d33',.7,.3),part('earphones','Y 스플리터','좌우 케이블을 모으는 짧은 검정 금속 분기부'),[0,.09,.88],[Math.PI/2,0,0]);
  braid(cable,[[0,.07,1.02],[-.36,.05,1.38],[-.22,.05,1.85],[.4,.05,1.98],[.66,.06,1.53],[.34,.07,1.35]],part('earphones','실버 브레이드 주 케이블','은도금 OFC 케이블의 외형을 두 가닥의 가벼운 기하로 근사했습니다.'));
  const plug=group('earphones','plug','유선 오디오용 3.5mm 직선형 플러그');plug.position.set(.34,.08,1.30);plug.rotation.x=Math.PI/2;g.add(plug);
  cylinder(plug,.075,.38,mat('#24282e',.7,.28),part('earphones','플러그 배럴','검정 금속 직선 플러그 하우징'),[0,0,0]);
  cylinder(plug,.035,.28,mat('#c7ad6d',.9,.23),part('earphones','3.5mm 오디오 플러그','제품정보의 3.5mm 플러그. 실제 전기 접점 규격을 재현한 도면이 아닙니다.'),[0,.32,0]);
  for(const y of [.25,.32,.39])cylinder(plug,.037,.012,mat('#1b1c20'),part('earphones','플러그 절연 링','금색 접점 사이의 얇은 검정 절연 띠'),[0,y,0]);
  g.userData.product='SIMGOT SUPERMIX 4';g.userData.productUrl=URL.earphones;g.userData.colorNote='공식 유통 제품 사진의 검정 레진·무광 금속 쉘, 회색 이어팁, 은색 케이블을 참고했습니다.';g.userData.colorSource='authorized-retailer-reference';g.userData.sizeNote='외형 실측 치수는 확인되지 않았습니다. 이어피스 두 개와 케이블 배치 비율은 표시용 근사입니다.';g.userData.setContents={earpieces:2,cable:1,plug:1};
  return settle(g);
}
