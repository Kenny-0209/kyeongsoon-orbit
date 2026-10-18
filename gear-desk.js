/** Photo/specification-informed display furniture. Y-up; viewer +Z, rear -Z.
 * Approximate authored geometry, not measured/manufacturer CAD. No DOM or GPU.
 */
const DESK_URL='https://fursys-store.com/product/detail.html?product_no=4426&cate_no=118&display_group=1';
const CHAIR_URL='https://fursys-store.com/product/detail.html?product_no=2580&cate_no=204&display_group=1';
const STAND_URL='https://futureterior.com/product/detail.html?product_no=584';
export const furnitureSpecs={
  desk:{id:'motion-desk',name:'퍼시스 M302+ 모션데스크 · FKD016 / FKD016N',productUrl:DESK_URL,color:'전체 화이트 · 사용자 확인',dimensionsMm:{width:1590,depth:770,heightMin:680,heightMax:1145,topThickness:22.5},dimensionNote:'지정 판매 페이지 제목은 FKD016 1600이며 상세 도표는 FKD016N, 폭 1600→1590 변경을 명시합니다.',modelDimensions:{width:18,depth:8.5,tabletopY:0,floorY:-8.2}},
  chair:{id:'desk-chair',name:'퍼시스 어라운드 · CH6200AH / 리뉴얼 CHN6200AH',productUrl:CHAIR_URL,color:'블랙 · 사용자 확인',dimensionsMm:{width:675,depth:560,heightMin:1175,heightMax:1285},dimensionNote:'지정 페이지 제목 CH6200AH, 상세 이미지 CHN6200AH. 상세 표는 H1175~1285, 같은 이미지 측면 도면은 H1170~1285로 5mm 차이가 있어 표의 값을 기록합니다.'},
  keyboardStand:{id:'keyboard-stand',name:'버니언스 X 브레스밋 · 키보드 거치대 2단',productUrl:STAND_URL,brandUrl:'https://verniance.com/',color:'소유 색상·판본 미확인. 사진을 확인한 원목형을 대표로 표현',dimensionsMm:{width:148,depth:170,height:390},dimensionNote:'원목형 상세 도표 기준입니다. 중앙 세로판과 앞뒤 두 단의 거치부로 총 4개 키보드를 받치는 구조이며, 장면에서는 앞쪽 두 단을 사용합니다.'},
  modelNote:'제품 사진과 공개 치수를 참고해 직접 작성한 근사 전시 모델입니다. 정밀 실측 CAD 또는 제조사 원본 3D 모델이 아닙니다.'
};

function helpers(THREE,name,spec){
  const root=new THREE.Group();root.name=name;root.userData.furnitureSpec=spec;root.userData.modelNote=furnitureSpecs.modelNote;root.userData.parts=[];
  const material=(color,metalness=.1,roughness=.55,extra={})=>new THREE.MeshStandardMaterial({color,metalness,roughness,...extra});
  const m={white:material(0xe7e9e6,.15,.4),whiteEdge:material(0xcdd2d1,.2,.43),black:material(0x15191d,.12,.58),blackEdge:material(0x282e34,.2,.48),rubber:material(0x0d1114,.02,.91),mesh:material(0x20282d,.05,.9,{side:THREE.DoubleSide}),chrome:material(0xc1c8cc,.84,.25),wood:material(0x765136,.05,.69),woodDark:material(0x4a3326,.03,.75),woodLight:material(0x926445,.03,.65)};
  const part=(id,name,description)=>{const p={id,name,description,productUrl:spec.productUrl};root.userData.parts.push(p);return p;};
  function mesh(geo,mat,p,parent=root){const item=new THREE.Mesh(geo,mat);item.name=p.id;item.userData.gearPart=p;item.castShadow=true;item.receiveShadow=true;parent.add(item);return item;}
  function box(w,h,d,x,y,z,mat,p,parent=root){const a=mesh(new THREE.BoxGeometry(w,h,d),mat,p,parent);a.position.set(x,y,z);return a;}
  function cyl(r,h,x,y,z,mat,p,parent=root,n=24){const a=mesh(new THREE.CylinderGeometry(r,r,h,n),mat,p,parent);a.position.set(x,y,z);return a;}
  function tube(points,r,mat,p,parent=root){const c=new THREE.CatmullRomCurve3(points.map(a=>new THREE.Vector3(...a)));return mesh(new THREE.TubeGeometry(c,24,r,7,false),mat,p,parent);}
  function rounded(w,h,r){const s=new THREE.Shape();r=Math.min(r,w*.49,h*.49);s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);s.closePath();return s;}
  function slab(w,d,h,r,x,y,z,mat,p,parent=root){const g=new THREE.ExtrudeGeometry(rounded(w,d,r),{depth:h,bevelEnabled:true,bevelSize:Math.min(.06,h*.12),bevelThickness:Math.min(.035,h*.1),bevelSegments:2,curveSegments:6});g.rotateX(-Math.PI/2);const a=mesh(g,mat,p,parent);a.position.set(x,y,z);return a;}
  function panel(w,h,d,r,x,y,z,mat,p,parent=root){const g=new THREE.ExtrudeGeometry(rounded(w,h,r),{depth:d,bevelEnabled:true,bevelSize:.045,bevelThickness:.045,bevelSegments:2,curveSegments:7});const a=mesh(g,mat,p,parent);a.position.set(x,y,z);return a;}
  return {root,m,part,mesh,box,cyl,tube,rounded,slab,panel};
}

export function createMotionDesk(THREE){
  const k=helpers(THREE,'FURSYS-M302-motion-desk',furnitureSpecs.desk);const {root,m,part,mesh,box,cyl,slab,panel}=k;
  const top=part('desk-top','화이트 상판 · M302+','사용자가 확인한 전체 화이트 구성입니다. 상세 도표의 1590×770mm 상판, 앞쪽의 얕은 몸맞춤 곡선과 뒤쪽 케이블 여유 홈을 반영했습니다.');
  const frame=part('desk-frame','화이트 전동 높이조절 프레임','T자 받침과 각형 텔레스코픽 다리 두 개를 갖춘 모션데스크 프레임입니다. 공개 높이 범위는 680~1145mm입니다.');
  const tray=part('desk-tray','상판 아래 케이블 트레이','제품 사진의 상판 아래 중앙 케이블 수납부와 다리 사이 지지 구조를 재현했습니다.');
  const control=part('desk-control','높이조절 컨트롤러','실제 제품 사진의 오른쪽 앞 모서리 아래에 달린 작은 높이조절 버튼부를 표현했습니다.');
  // XY profile is rotated into XZ; its shallow edge recesses follow the plan.
  const s=new THREE.Shape();s.moveTo(-8.85,-4.25);s.lineTo(-5,-4.25);s.quadraticCurveTo(-4.65,-4.25,-4.35,-4.02);s.lineTo(4.35,-4.02);s.quadraticCurveTo(4.65,-4.25,5,-4.25);s.lineTo(8.85,-4.25);s.quadraticCurveTo(9,-4.25,9,-4.1);s.lineTo(9,4.1);s.quadraticCurveTo(9,4.25,8.85,4.25);s.lineTo(1.65,4.25);s.quadraticCurveTo(1.4,4.25,1.18,3.94);s.lineTo(-1.18,3.94);s.quadraticCurveTo(-1.4,4.25,-1.65,4.25);s.lineTo(-8.85,4.25);s.quadraticCurveTo(-9,4.25,-9,4.1);s.lineTo(-9,-4.1);s.quadraticCurveTo(-9,-4.25,-8.85,-4.25);s.closePath();
  const g=new THREE.ExtrudeGeometry(s,{depth:.255,bevelEnabled:false,curveSegments:8});g.rotateX(-Math.PI/2);g.translate(0,-.255,0);mesh(g,m.white,top);
  // Long beams and two side supports are separate selectable meshes.
  box(14.7,.44,.52,0,-.6,-.5,m.whiteEdge,frame);
  for(const x of [-7.3,7.3]){
    slab(.64,6.35,.18,.2,x,-.48,0,m.white,frame);
    box(.73,3.65,.83,x,-2.26,-.15,m.white,frame);
    box(.58,3.6,.67,x,-5.72,-.15,m.whiteEdge,frame);
    slab(.82,6.62,.27,.26,x,-8.13,0,m.white,frame);
    for(const z of [-2.78,2.78])cyl(.17,.12,x,-8.2,z,m.whiteEdge,frame);
    box(.9,.35,1.25,x,-.71,-.15,m.white,frame);
  }
  // Open-front central trough; this is not an added desktop shelf.
  box(5.4,.12,1.42,0,-1.18,.02,m.whiteEdge,tray);
  box(5.4,.58,.12,0,-.94,-.66,m.white,tray);
  for(const x of [-2.62,2.62])box(.14,.58,1.42,x,-.94,.02,m.white,tray);
  box(5.0,.1,.12,0,-.71,.68,m.white,tray);
  const body=panel(1.12,.27,.4,.1,6.85,-.57,3.49,m.white,control);body.rotation.x=-.05;
  panel(.76,.15,.025,.055,6.89,-.56,3.92,m.black,control);
  for(let i=0;i<2;i++)box(.09,.035,.02,6.64+i*.14,-.56,3.953,m.whiteEdge,control);
  box(.19,.08,.02,7.13,-.56,3.953,m.whiteEdge,control);
  root.userData.dimensions={width:18,height:8.26,depth:8.5};root.userData.tabletopY=0;root.userData.floorY=-8.26;
  root.userData.supportSurface={y:0,minX:-9,maxX:9,minZ:-4.25,maxZ:4.25};
  return root;
}

export function createDeskChair(THREE){
  const k=helpers(THREE,'FURSYS-AROUND-chair',furnitureSpecs.chair);const {root,m,part,mesh,box,cyl,tube,slab,panel}=k;
  const seat=part('chair-seat','블랙 패브릭 좌판','사용자가 확인한 블랙 색상입니다. 앞쪽을 둥글게 마감한 두툼한 패브릭 좌판을 제품 사진에 맞춰 구성했습니다.');
  const back=part('chair-back','곡면 메쉬 등판','어라운드 제품 사진의 위쪽이 조금 좁아지는 긴 메쉬 등판과 허리 쪽 곡면 프레임을 반영했습니다.');
  const lumbar=part('chair-lumbar','조절형 럼버서포트','등판 하단을 가로지르는 넓은 요추 지지부와 뒤쪽 등판 지지 구조입니다.');
  const head=part('chair-headrest','조절형 헤드레스트','메쉬 등판 위에 독립적으로 달린 둥근 사각 헤드레스트입니다.');
  const arms=part('chair-arms','조절형 팔걸이','제품 사진의 위로 갈수록 완만히 휘는 팔걸이 지지대와 긴 패드를 분리했습니다.');
  const base=part('chair-base','5발 베이스 · 캐스터','중앙 가스 리프트, 다섯 갈래 베이스와 다섯 개의 쌍륜 캐스터를 표현했습니다.');
  const tilt=part('chair-tilt','스마트 틸팅 하부','좌판 아래의 틸팅 메커니즘과 좌우 조절 레버를 제품 사진을 참고해 단순화했습니다.');
  // Waterfall-front upholstered seat, with a dark supporting shell below.
  slab(5.85,5.12,.24,.78,0,4.88,.15,m.blackEdge,seat);
  slab(5.7,5.05,.44,.8,0,5.1,.18,m.rubber,seat);
  slab(4.1,3.2,.45,.4,0,4.32,-.12,m.black,tilt);
  for(const x of [-2.6,2.6]){const lever=cyl(.12,1.0,x,4.55,.45,m.blackEdge,tilt);lever.rotation.z=Math.PI/2;}
  cyl(.37,1.32,0,4.04,-.2,m.black,base);cyl(.23,1.95,0,2.8,-.2,m.chrome,base);cyl(.37,1.8,0,1.62,-.2,m.black,base);
  // Five tapered, gently lowered spokes.
  const spoke=new THREE.Shape();spoke.moveTo(.15,1.51);spoke.lineTo(3.54,.72);spoke.lineTo(3.6,.45);spoke.lineTo(.15,1.14);spoke.closePath();
  const spokeGeo=new THREE.ExtrudeGeometry(spoke,{depth:.4,bevelEnabled:true,bevelSize:.045,bevelThickness:.04,bevelSegments:2});spokeGeo.translate(0,0,-.2);
  for(let i=0;i<5;i++){
    const angle=i*Math.PI*2/5+Math.PI/2;const leg=mesh(spokeGeo,m.black,base);leg.rotation.y=-angle;leg.position.z=-.2;
    const wheel=new THREE.Group();wheel.position.set(Math.cos(angle)*3.47,.36,Math.sin(angle)*3.47-.2);wheel.rotation.y=-angle;root.add(wheel);
    for(const x of [-.18,.18]){const tire=cyl(.35,.22,x,0,0,m.rubber,base,wheel,22);tire.rotation.z=Math.PI/2;}
    box(.24,.43,.28,0,.18,0,m.blackEdge,base,wheel);
  }
  // Parametric back sheet: rounded taper, shoulder recline, lumbar curvature.
  const cols=24,rows=28,p=[],uv=[],indices=[];
  function backPoint(u,v){const half=2.38-.22*v;const yy=5.42+5.5*v;const zz=-1.99-.77*v+.2*Math.sin(v*Math.PI)+.19*u*u;return [u*half,yy,zz];}
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const u=i/cols*2-1,v=j/rows;p.push(...backPoint(u,v));uv.push(i/cols,j/rows);}
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i;indices.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1);}
  const backGeo=new THREE.BufferGeometry();backGeo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));backGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));backGeo.setIndex(indices);backGeo.computeVertexNormals();mesh(backGeo,m.mesh,back);
  const lattice=mesh(backGeo,new THREE.MeshBasicMaterial({color:0x3d484f,wireframe:true,transparent:true,opacity:.28,depthWrite:false}),back);lattice.position.z=.008;lattice.castShadow=false;
  for(const s of [-1,1])tube([backPoint(s,0),backPoint(s,.28),backPoint(s,.65),backPoint(s,1)],.12,m.blackEdge,back);
  tube([backPoint(-1,1),backPoint(-.55,1.045),backPoint(.55,1.045),backPoint(1,1)],.13,m.blackEdge,back);
  tube([backPoint(-1,0),backPoint(0,-.035),backPoint(1,0)],.16,m.black,back);
  // Rear support spine and a front-facing lumbar band.
  for(const s of [-1,1])tube([[s*1.85,4.55,-1.65],[s*2.12,5.65,-2.2],[s*2.04,7.0,-2.6]],.17,m.black,lumbar);
  const lumbarBand=panel(4.32,.68,.19,.17,0,6.76,-1.91,m.blackEdge,lumbar);lumbarBand.rotation.x=-.12;
  box(.3,1.02,.24,0,11.18,-2.86,m.blackEdge,head);
  const cushion=panel(3.1,1.56,.43,.36,0,12.01,-3.0,m.rubber,head);cushion.rotation.x=.09;
  // Curved arm risers and long, soft arm pads.
  for(const s of [-1,1]){
    tube([[s*2.45,4.92,-.56],[s*2.82,5.62,-.62],[s*2.95,6.7,-.53],[s*3.0,7.37,-.32]],.19,m.blackEdge,arms);
    slab(1.15,2.23,.23,.34,s*3.0,7.35,.1,m.rubber,arms);
  }
  root.userData.dimensions={width:7.65,height:12.88,depth:7.4};root.userData.floorY=0;root.userData.seatY=5.54;root.userData.facing='+Z';return root;
}

export function createKeyboardStand(THREE){
  const k=helpers(THREE,'VERNIANCE-BRESSMIT-keyboard-stand',furnitureSpecs.keyboardStand);const {root,m,part,mesh,box}=k;
  const spine=part('stand-spine','버니언스 X 브레스밋 · 중앙 세로판','정식 브랜드명은 버니언스입니다. 원목형 제품 사진의 중앙 세로판과 가공 홈을 반영했습니다. 소유 판본과 색상은 아직 확인하지 않아 대표 원목형으로 표현합니다.');
  const shelves=part('stand-shelves','앞뒤 2단 키보드 거치부','공개 제품 사진은 앞뒤 각각 두 단, 총 4개 키보드 거치 구조입니다. 이 장면에서는 정면 두 단에 위쪽 LOOMI, 아래쪽 VM87을 올립니다.');
  const scale=18/1590,w=148*scale,d=170*scale,h=390*scale,t=18*scale;
  box(w,h,t,0,h/2,0,m.wood,spine);
  // Narrow vertical tone strips give the reference wood grain a restrained form.
  for(let i=0;i<8;i++){const x=-w/2+(i+.5)*w/8;box(w/8-.013,h-.025,.008,x,h/2,t/2+.008,i%3===0?m.woodDark:i%3===1?m.woodLight:m.wood,spine);}
  for(const x of [-.45,0,.45])box(.016,h*.84,.016,x,h*.45,t/2+.018,m.woodDark,spine);
  const upperY=219*scale;
  // Constant-width planks extend both in front and behind the central board.
  for(const y of [0,upperY-t]){
    box(w,t,d,0,y+t/2,0,m.blackEdge,shelves);
    for(const z of [-d/2+.12,d/2-.12]){
      // Two rails leave a shallow V-like channel for the keyboard lower edge.
      box(w,.07,.065,0,y+t+.035,z-.075,m.black,shelves);
      box(w,.07,.065,0,y+t+.035,z+.075,m.black,shelves);
    }
  }
  // Supports are usable object-origin proposals for a keyboard already scaled
  // to ~1.5 depth units. surfacePosition is the exact physical contact anchor;
  // callers can rotate, compute its bbox, then align minY to surfacePosition[1].
  const keyboardTilt=1.35;
  root.userData.supports=[
    {id:'upper',name:'위쪽 · LOOMI',position:[0,upperY+.8,.5],rotation:[keyboardTilt,0,0],surfacePosition:[0,upperY+.07,d/2-.12],surfaceY:upperY+.07,keyboardDepthHint:1.5},
    {id:'lower',name:'아래쪽 · VM87',position:[0,t+.8,.5],rotation:[keyboardTilt,0,0],surfacePosition:[0,t+.07,d/2-.12],surfaceY:t+.07,keyboardDepthHint:1.5}
  ];
  root.userData.backSupports=[{position:[0,upperY+.8,-.5],rotation:[-keyboardTilt,Math.PI,0],surfaceY:upperY+.07},{position:[0,t+.8,-.5],rotation:[-keyboardTilt,Math.PI,0],surfaceY:t+.07}];
  root.userData.dimensions={width:w,height:h,depth:d};root.userData.colorConfirmed=false;root.userData.floorY=0;
  return root;
}
