import * as THREE from 'three';

// Reference-derived display models. Y up, front -Z. Confirmed owner colours are
// recorded per model; other products use representative colours. No remote textures.
const URL = {
  infinity: 'https://store.angrymiao.com/products/am-infinity-97-wireless-gaming-mouse',
  scyrox: 'https://scyrox.com/products/scyrox-v8',
  lift: 'https://www.logitech.com/en-us/shop/p/lift-vertical-ergonomic-mouse',
  loomi: 'https://www.spm.works/',
  vm87: 'https://varoworks.com/vm87he',
  hyzen: 'https://www.lofree.co/pages/hyzen',
  rift: 'https://developers.meta.com/vr/blog/new-hardware-bundle-now-available/'
};
const NAME = {infinity:'Angry Miao AM INFINITY MOUSE .97',scyrox:'SCYROX V8',lift:'Logitech Lift',loomi:'SPM PN06 LOOMI',vm87:'VARO VM87 HE',hyzen:'LOFREE Hyzen',rift:'Oculus Rift CV1 + Touch'};
const material = (color, metalness=0, roughness=.52) => new THREE.MeshStandardMaterial({color,metalness,roughness});
const black=material('#15181c'), rubber=material('#202226',0,.92), dark=material('#303439'), silver=material('#b1bac7',.82,.28), gold=material('#c58a65',.78,.31);
function info(kind,name,description) { return {name,description,productUrl:URL[kind]}; }
function group(kind,name,description) { const g=new THREE.Group();g.name=name;g.userData.gearPart=info(kind,name,description);return g; }
function mesh(parent,geo,mat,part,pos=[0,0,0],rot=[0,0,0]) {
  const m=new THREE.Mesh(geo,mat);m.name=part.name;m.userData.gearPart=part;
  m.position.set(...pos);m.rotation.set(...rot);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function roundedShape(w,h,r=.12) {
  const s=new THREE.Shape();r=Math.min(r,w/2-.001,h/2-.001);
  s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
  s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);
  s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);
  s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);s.closePath();return s;
}
function rounded(w,h,d,r=.08) {
  const geo=new THREE.ExtrudeGeometry(roundedShape(w,d,r),{depth:h,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:Math.min(r*.2,h*.2),bevelThickness:Math.min(r*.2,h*.2),curveSegments:5});
  geo.rotateX(-Math.PI/2);geo.translate(0,Math.min(r*.2,h*.2),0);return geo;
}
function rb(parent,w,h,d,r,mat,part,pos) { return mesh(parent,rounded(w,h,d,r),mat,part,pos); }
function cylinder(parent,r,h,mat,part,pos,rot=[0,0,0]) {return mesh(parent,new THREE.CylinderGeometry(r,r,h,28),mat,part,pos,rot);}
function tube(parent,points,r,mat,part,closed=false,segments=36) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed,'centripetal');
  return mesh(parent,new THREE.TubeGeometry(curve,segments,r,6,closed),mat,part);
}
// A broad, chamfered ribbon follows the actual exoskeleton / headband centreline.
function ribbon(parent,points,width,thickness,mat,part) {
  const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const pts=c.getPoints(28),a=[],idx=[];
  const section=[[-.44,-.5],[.44,-.5],[.5,-.3],[.5,.3],[.44,.5],[-.44,.5],[-.5,.3],[-.5,-.3]];
  pts.forEach((p,i)=>{const t=c.getTangent(i/28);let side=new THREE.Vector3(t.z,0,-t.x);if(side.lengthSq()<.01)side.set(1,0,0);side.normalize();const up=new THREE.Vector3().crossVectors(t,side).normalize();if(up.y<0)up.negate();section.forEach(([x,y])=>{const q=p.clone().addScaledVector(side,x*width).addScaledVector(up,y*thickness);a.push(q.x,q.y,q.z);});});
  for(let i=0;i<pts.length-1;i++)for(let j=0;j<8;j++){const n=(j+1)%8,k=i*8+j,l=i*8+n;idx.push(k,l,l+8,k,l+8,k+8);}
  for(let j=1;j<7;j++){idx.push(0,j+1,j);const k=(pts.length-1)*8;idx.push(k,k+j,k+j+1);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(a,3));geo.setIndex(idx);geo.computeVertexNormals();return mesh(parent,geo,mat,part);
}
function finish(g,kind,color) {
  g.userData.product=NAME[kind];g.userData.productUrl=URL[kind];g.userData.colorNote=`대표 제품색: ${color}. 실제 소유 제품의 색상은 확인되지 않았습니다.`;
  g.userData.modelNote='공식·제품 사진을 참고한 경량 형상 모델. 정밀 실측 CAD가 아닙니다.';
  g.traverse(o=>{if(o.isMesh&&!o.userData.gearPart)o.userData.gearPart=g.userData.gearPart;});return g;
}
function profileAt(points,z) {
  let i=0;while(i<points.length-2&&z>points[i+1][0])i++;
  const a=points[i],b=points[i+1],t=THREE.MathUtils.clamp((z-a[0])/(b[0]-a[0]),0,1);
  return [THREE.MathUtils.lerp(a[1],b[1],t),THREE.MathUtils.lerp(a[2],b[2],t)];
}
const gamingProfile=[[-1.5,.51,.47],[-1.38,.71,.59],[-.7,.74,.72],[-.1,.76,.91],[.45,.8,.99],[.95,.68,.82],[1.32,.4,.43],[1.5,.025,.11]];
function shellGeometry(profile,lift=false) {
  const p=[],idx=[],nz=36,nr=40;
  for(let j=0;j<=nz;j++){const z=-1.5+3*j/nz,[w,h]=profileAt(profile,z);for(let i=0;i<nr;i++){const t=i/nr*Math.PI*2,x=w*Math.cos(t);let y=.105+(Math.sin(t)>=0?(h-.105)*Math.sin(t):.065*Math.sin(t));let xx=x;if(lift){xx+=.11*Math.max(0,1-Math.abs(z)/1.5);if(Math.sin(t)>0)y=.105+(h-.105)*Math.sin(t)*(.82+.28*Math.cos(t));}p.push(xx,y,z);}}
  for(let j=0;j<nz;j++)for(let i=0;i<nr;i++){const k=j*nr+i,l=j*nr+(i+1)%nr;idx.push(k,l,k+nr,l,l+nr,k+nr);}
  for(let i=1;i<nr-1;i++){idx.push(0,i,i+1);const k=nz*nr;idx.push(k,k+i+1,k+i);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setIndex(idx);geo.computeVertexNormals();return geo;
}
function panelGeometry(profile,u0,u1,z0,z1,offset=.018,lift=false) {
  const p=[],idx=[],nx=10,nz=16;
  for(let j=0;j<=nz;j++){const z=THREE.MathUtils.lerp(z0,z1,j/nz),[w,h]=profileAt(profile,z);for(let i=0;i<=nx;i++){const u=THREE.MathUtils.lerp(u0,u1,i/nx);let y=.105+(h-.105)*Math.sqrt(Math.max(0,1-u*u))+offset,x=w*u;if(lift){x+=.11*Math.max(0,1-Math.abs(z)/1.5);y=.105+(h-.105)*Math.sqrt(Math.max(0,1-u*u))*(.82+.28*u)+offset;}p.push(x,y,z);}}
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const k=j*(nx+1)+i;idx.push(k,k+nx+1,k+1,k+1,k+nx+1,k+nx+2);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setIndex(idx);geo.computeVertexNormals();return geo;
}
function wheel(g,kind,x,y,z,tilt=0) {
  const p=info(kind,'스크롤 휠','클릭과 스크롤 입력을 위한 고무 표면의 휠');
  const w=group(kind,'wheel',p.description);w.userData.gearPart=p;w.position.set(x,y,z);w.rotation.z=tilt;g.add(w);
  cylinder(w,.18,.22,rubber,p,[0,0,0],[0,0,Math.PI/2]);
  for(const x of [-.105,.105])mesh(w,new THREE.TorusGeometry(.161,.012,5,28),silver,p,[x,0,0],[0,Math.PI/2,0]);
  for(let i=0;i<24;i++){const a=i/24*Math.PI*2;const r=rb(w,.225,.013,.024,.006,dark,p,[0,Math.sin(a)*.178,Math.cos(a)*.178]);r.rotation.x=-a;}
  return w;
}
function mouseBottom(g,kind,w) {
  const p=info(kind,'하부 센서·슬라이드 피트','책상 표면을 읽는 광학 센서와 마찰을 줄이는 하부 피트');
  for(const z of [-1.18,1.12])rb(g,w*.72,.024,.22,.08,material('#e1e4e6'),p,[0,.014,z]);
  cylinder(g,.115,.025,black,p,[0,.02,-.15]);
}
export function createMouse(kind='infinity') {
  if(!['infinity','scyrox','lift'].includes(kind))throw new Error(`Unknown mouse kind: ${kind}`);
  const g=group(kind,NAME[kind],'실제 제품 사진의 윤곽·버튼·휠을 참고해 만든 주변기기 모델');
  if(kind==='infinity') {
    const metal=material('#adbac8',.9,.25),p=info(kind,'마그네슘 알루미늄 외골격','큰 개구부와 곡선 리브로 구성된 금속 오픈 프레임. 대표 Cloud White 계열을 표현했습니다.');
    const frame=group(kind,'open-exoskeleton',p.description);frame.userData.gearPart=p;g.add(frame);
    for(const s of [-1,1]) {
      ribbon(frame,[[s*.55,.16,-1.46],[s*.76,.4,-.98],[s*.78,.62,-.25],[s*.73,.72,.42],[s*.56,.42,1.17],[s*.28,.18,1.46]],.16,.075,metal,p);
      ribbon(frame,[[s*.72,.62,-.15],[s*.49,.78,.2],[s*.22,.59,.65],[s*.31,.28,1.4]],.19,.065,metal,p);
      ribbon(frame,[[s*.7,.36,-.75],[s*.61,.22,.18],[s*.39,.18,1.22]],.1,.055,metal,p);
      mesh(frame,panelGeometry(gamingProfile,s<0?-.96:.09,s<0?-.09:.96,-1.47,-.25,.025),material('#e3e8ec',.65,.3),info(kind,s<0?'왼쪽 클릭판':'오른쪽 클릭판','금속 외골격과 분리된 곡면 클릭 패널'));
    }
    const pcb=info(kind,'노출 하부·교체형 배터리','개구부 아래의 회로 공간과 자석으로 교체하는 배터리를 표시했습니다.');
    rb(g,1.28,.055,2.45,.4,black,pcb,[0,.085,-.04]);
    rb(g,.4,.16,.8,.17,material('#aa5a2f',.55,.4),pcb,[0,.145,.68]);
    for(const z of [-.4,.15,.65])ribbon(g,[[-.66,.2,z],[0,.22,z],[.66,.2,z]],.07,.055,dark,pcb);
    wheel(g,kind,0,.65,-.91);
    rb(g,.19,.065,.47,.04,metal,info(kind,'측면 전진·뒤로 버튼','엄지 쪽에 배치된 두 개의 측면 버튼'),[-.76,.44,-.14]);
    rb(g,.19,.065,.36,.04,metal,info(kind,'측면 전진·뒤로 버튼','엄지 쪽에 배치된 두 개의 측면 버튼'),[-.77,.45,.37]);
    mouseBottom(g,kind,1.55);g.scale.y=1.13;return finish(g,kind,'Cloud White를 바탕으로 한 밝은 금속 프레임');
  }
  if(kind==='scyrox') {
    mesh(g,shellGeometry(gamingProfile),black,info(kind,'V8 비천공 쉘','매끈한 좌우 대칭 쉘과 뒤쪽으로 솟은 팜 부분을 사진에 맞춰 구성했습니다.'));
    for(const s of [-1,1])mesh(g,panelGeometry(gamingProfile,s<0?-.95:.055,s<0?-.055:.95,-1.46,-.27,.02),dark,info(kind,s<0?'왼쪽 클릭판':'오른쪽 클릭판','중앙 분할선과 뒤쪽 경계가 드러나는 곡면 클릭 패널'));
    wheel(g,kind,0,.64,-.99);
    for(const z of [-.44,.07])rb(g,.08,.12,.37,.035,dark,info(kind,'측면 버튼','왼쪽 측면에 나란히 놓인 두 개의 전진·뒤로 버튼'),[-.747,.46,z]);
    rb(g,.28,.1,.035,.03,black,info(kind,'USB-C 포트','앞면의 유선 연결·충전용 단자'),[0,.19,-1.49]);
    mouseBottom(g,kind,1.5);return finish(g,kind,'Black');
  }
  const prof=[[-1.5,.4,.67],[-1.3,.65,1.25],[-.7,.77,1.8],[-.15,.88,2.03],[.4,.89,1.83],[1.05,.7,1.19],[1.42,.25,.33],[1.5,.015,.12]];
  mesh(g,shellGeometry(prof,true),rubber,info(kind,'Lift 비대칭 버티컬 바디','57° 손잡기 자세를 위한 높은 오른쪽 능선과 낮은 엄지 받침을 분리한 오른손용 비대칭 실루엣입니다.'));
  const thumb=info(kind,'엄지 받침과 고무 그립','낮게 뻗은 엄지 선반과 그립의 동심 곡선 리브');
  const rest=mesh(g,new THREE.SphereGeometry(1,28,16),rubber,thumb,[-.48,.2,.18]);rest.scale.set(.61,.19,1.02);
  for(let i=0;i<14;i++){const radius=.23+i*.055,pts=[];for(let j=0;j<30;j++){const a=.16+Math.PI*1.7*j/29;const z=.23+Math.sin(a)*radius*1.2,x=-.43+Math.cos(a)*radius*.64;const [w,h]=profileAt(prof,THREE.MathUtils.clamp(z,-1.45,1.45));const u=THREE.MathUtils.clamp((x-.11)/w,-.97,.97),y=.105+(h-.105)*Math.sqrt(1-u*u)*(.82+.28*u)+.009;pts.push([x,y,z]);}tube(g,pts,.009,dark,thumb,false,30);}
  for(const [a,b,n] of [[-.04,.48,'왼쪽 클릭판'],[.51,.97,'오른쪽 클릭판']])mesh(g,panelGeometry(prof,a,b,-1.41,-.15,.023,true),dark,info(kind,n,'버티컬 쉘의 경사면을 따라 배치된 곡면 클릭 패널'));
  wheel(g,kind,.39,1.47,-.88,-.54);
  for(const z of [-.48,.02])rb(g,.1,.13,.3,.04,black,info(kind,'엄지 측면 버튼','엄지 받침 위의 전진·뒤로 입력'),[-.62,.78,z]);
  const dpi=mesh(g,new THREE.SphereGeometry(.065,16,10),black,info(kind,'휠 아래 버튼','휠 아래에 놓인 사용자 지정 버튼'),[.49,1.69,-.37]);dpi.scale.y=.5;
  mouseBottom(g,kind,1.85);g.scale.y=1.1;return finish(g,kind,'Graphite · 오른손용');
}

const baseRows=[
 [['`',1],['1',1],['2',1],['3',1],['4',1],['5',1],['6',1],['7',1],['8',1],['9',1],['0',1],['-',1],['=',1],['Back',2]],
 [['Tab',1.5],['Q',1],['W',1],['E',1],['R',1],['T',1],['Y',1],['U',1],['I',1],['O',1],['P',1],['[',1],[']',1],['\\',1.5]],
 [['Caps',1.75],['A',1],['S',1],['D',1],['F',1],['G',1],['H',1],['J',1],['K',1],['L',1],[';',1],["'",1],['Enter',2.25]],
 [['Shift',2.25],['Z',1],['X',1],['C',1],['V',1],['B',1],['N',1],['M',1],[',',1],['.',1],['/',1],['Shift',2.75]],
 [['Ctrl',1.25],['Win',1.25],['Alt',1.25],['Space',6.25],['Alt',1.25],['Fn',1.25],['Menu',1.25],['Ctrl',1.25]]
];
const KO={Q:'ㅂ',W:'ㅈ',E:'ㄷ',R:'ㄱ',T:'ㅅ',Y:'ㅛ',U:'ㅕ',I:'ㅑ',O:'ㅐ',P:'ㅔ',A:'ㅁ',S:'ㄴ',D:'ㅇ',F:'ㄹ',G:'ㅎ',H:'ㅗ',J:'ㅓ',K:'ㅏ',L:'ㅣ',Z:'ㅋ',X:'ㅌ',C:'ㅊ',V:'ㅍ',B:'ㅠ',N:'ㅜ',M:'ㅡ'};
function atlas(labels,white) {
  if(typeof document==='undefined')return null;
  const all=[...new Set(labels)],c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d');
  x.clearRect(0,0,1024,512);all.forEach((v,i)=>{const xx=(i%16)*64,yy=Math.floor(i/16)*64;x.fillStyle=white?'#d8dfe8':'#27303b';x.font=`${v.length>3?14:22}px "Malgun Gothic",sans-serif`;x.textAlign='center';x.fillText(v==='Space'?'':v,xx+32,yy+29);if(KO[v]){x.font='14px "Malgun Gothic",sans-serif';x.fillText(KO[v],xx+44,yy+51);}});
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=2;return {all,material:new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1})};
}
function legend(parent,value,w,d,a,y,part) {
  if(!a)return;const i=a.all.indexOf(value),col=i%16,row=Math.floor(i/16),geo=new THREE.PlaneGeometry(w*.8,d*.8),uv=geo.getAttribute('uv');
  for(let n=0;n<uv.count;n++)uv.setXY(n,(col+uv.getX(n))/16,1-(row+1-uv.getY(n))/8);
  mesh(parent,geo,a.material,part,[0,y,0],[-Math.PI/2,0,0]);
}
export function createKeyboard(kind='loomi',options={}) {
  if(!['loomi','vm87','hyzen'].includes(kind))throw new Error(`Unknown keyboard kind: ${kind}`);
  const isHyzen=kind==='hyzen',loomi=kind==='loomi',width=7,units=isHyzen?16.15:18.55,pitch=(width-.46)/units,depth=isHyzen?2.63:2.76;
  const g=group(kind,NAME[kind],isHyzen?'65% 배열과 우측 상단의 두 물리 컨트롤':'독립된 기능열·편집키·방향키를 갖춘 텐키리스 배열');
  const color=options.color||(loomi?'navy-silver':isHyzen?'space-gray':'representative');
  const navySilver=loomi&&color==='navy-silver',spaceGray=isHyzen&&color==='space-gray';
  if(loomi&&!['navy-silver','navy-gold'].includes(color))throw new Error(`Unknown LOOMI colour: ${color}`);
  if(isHyzen&&!['space-gray','silver'].includes(color))throw new Error(`Unknown Hyzen colour: ${color}`);
  const hyzenMetal=spaceGray?material('#454a51',.8,.36):silver;
  const body=loomi?material('#192c39',.65,.35):isHyzen?hyzenMetal:material('#26272c',.2,.48),trim=loomi?(navySilver?silver:gold):isHyzen?material(spaceGray?'#34383e':'#747f90',.85,.31):material('#11161d');
  const p=info(kind,'하우징',loomi?'네이비 상부·금속 하부의 이중색 CNC 알루미늄 하우징':isHyzen?'넓은 상단 컨트롤 띠와 경사진 알루미늄 하우징':'모서리를 둥글린 TKL 하우징과 분리된 편집키 구역');
  rb(g,width,.17,depth,.13,trim,p,[0,.025,0]);
  const housing=rounded(width-.05,.25,depth-.04,.11),position=housing.getAttribute('position');
  for(let i=0;i<position.count;i++)position.setY(i,position.getY(i)+(.5-position.getZ(i)/depth)*.16);housing.computeVertexNormals();
  mesh(g,housing,body,p,[0,.15,0]);
  const top=(z)=>.48+(.5-z/depth)*.16;
  const layout=[],startX=-width/2+.23,startZ=isHyzen?-.61:-.6;
  const add=(label,u,z,w=1)=>layout.push({label,u,z,w});
  if(!isHyzen){
    add('Esc',0,-1.05);for(let f=1;f<=12;f++)add(`F${f}`,f+.5+(f>4?.25:0)+(f>8?.25:0),-1.05);
    if(loomi)add('◆',13.75,-1.05);for(const [i,key] of ['Prt','Scr','Pause'].entries())add(key,15.45+i,-1.05);
    baseRows.forEach((r,j)=>{let cursor=0;r.forEach(([label,w])=>{add(label,cursor,startZ+j*pitch,w);cursor+=w;});});
    for(const [j,row] of [['Ins','Home','PgUp'],['Del','End','PgDn']].entries())row.forEach((label,i)=>add(label,15.45+i,startZ+j*pitch));
    add('↑',16.45,startZ+3*pitch);['←','↓','→'].forEach((label,i)=>add(label,15.45+i,startZ+4*pitch));
  }else{
    baseRows.slice(0,3).forEach((r,j)=>{let cursor=0;r.forEach(([label,w])=>{add(label,cursor,startZ+j*pitch,w);cursor+=w;});});
    let cursor=0;for(const [label,w] of [...baseRows[3].slice(0,-1),['Shift',1.75],['↑',1]]){add(label,cursor,startZ+3*pitch,w);cursor+=w;}
    const bottom=[['Ctrl',1.25],['Win',1.25],['Alt',1.25],['Space',6.25],['Alt',1],['Fn',1],['Ctrl',1],['←',1],['↓',1],['→',1]];
    cursor=0;bottom.forEach(([label,w])=>{add(label,cursor,startZ+4*pitch,w);cursor+=w;});
    for(const [i,label] of ['Del','PgUp','PgDn'].entries())add(label,15.0,startZ+i*pitch);
  }
  const caps=loomi?material(navySilver?'#303740':'#e9e6db',0,.56):material(isHyzen?(spaceGray?'#33383d':'#e9e9e4'):'#747980',0,.56),mod=loomi?material(navySilver?'#252f3c':'#dfddcf'):material(isHyzen&&!spaceGray?'#d8dbe0':'#343941',0,.55);
  const a=atlas(layout.map(k=>k.label),loomi?navySilver:isHyzen?spaceGray:true);
  layout.forEach(({label,u,z,w})=>{
    const x=startX+(u+w/2)*pitch,kw=w*pitch-.045,kd=pitch-.045;
    const k=group(kind,`key-${label}`,`${label} 키`);k.userData.gearPart=info(kind,`${label} 키`,label==='Space'?'길게 이어진 스페이스바':`실물 배열에 놓인 ${label} 키`);k.position.set(x,top(z),z);g.add(k);
    const geo=rounded(kw,.11,kd,.025),pos=geo.getAttribute('position');for(let i=0;i<pos.count;i++){const yy=pos.getY(i);if(yy>.05){pos.setX(i,pos.getX(i)*.91);pos.setZ(i,pos.getZ(i)*.91);}}geo.computeVertexNormals();
    mesh(k,geo,label.length>1?mod:caps,k.userData.gearPart);legend(k,label,kw,kd,a,.153,k.userData.gearPart);
    if(kind==='vm87'&&label.length===1){const led=material('#6750a1',.15,.4);led.emissive=new THREE.Color('#443052');led.emissiveIntensity=.25;rb(k,kw+.014,.012,kd+.012,.025,led,info(kind,'키 하부 RGB','자석축 키 아래의 은은한 RGB 백라이트'),[0,-.01,0]);}
  });
  for(const x of [-2.9,2.9])for(const z of [-1.05,1.05])rb(g,.32,.03,.13,.025,rubber,info(kind,'하부 미끄럼 방지 패드','바닥면을 지지하는 고무 패드'),[x,.005,z]);
  if(loomi){
    for(let i=0;i<7;i++)rb(g,6.55,.007,.012,.004,material(navySilver?'#7f8a99':'#9d6848',.6,.4),info(kind,'하부 가공 라인','제품 뒷면 금속 웨이트의 평행 가공선을 표현한 디테일'),[0,.006,.62+i*.047]);
    rb(g,.2,.06,.03,.02,black,info(kind,'측면 연결·모드 스위치','하우징 측면의 연결·모드 전환부'),[0,.25,-depth/2-.015]);
  }
  if(kind==='vm87'){
    rb(g,.29,.02,.29,.03,silver,info(kind,'VARO 로고 배지','F12와 우측 편집 영역 사이에 있는 로고 배지'),[startX+14.2*pitch,top(-1.05),-1.05]);
    const mark=new THREE.Shape();mark.moveTo(-.09,-.045);mark.lineTo(.065,-.045);mark.lineTo(-.02,.07);mark.closePath();mesh(g,new THREE.ShapeGeometry(mark),material('#d8a4c8'),info(kind,'VARO 표시','방향키 위 제품의 작은 브랜드 표시'),[2.78,top(.38)+.01,.38],[-Math.PI/2,0,0]);
  }
  if(isHyzen){
    rb(g,6.9,.045,.39,.025,hyzenMetal,info(kind,'상단 컨트롤 띠','키 배열 위로 넓게 확장된 금속 컨트롤 영역'),[0,.62,-1.04]);
    const dial=info(kind,'볼륨 다이얼','오른쪽 상단의 큰 원형 볼륨 조절 노브');cylinder(g,.225,.14,black,dial,[2.75,.78,-1.05]);cylinder(g,.206,.022,hyzenMetal,dial,[2.75,.86,-1.05]);
    const mode=info(kind,'연결·기능 모드 다이얼','볼륨 노브 왼쪽의 작은 레버형 모드 셀렉터');cylinder(g,.12,.03,dark,mode,[1.86,.72,-1.05]);rb(g,.04,.11,.16,.012,black,mode,[1.86,.73,-1.05]);
    const led=material('#72bdbf',.2,.28);led.emissive=new THREE.Color('#1b8b9e');led.emissiveIntensity=.5;
    rb(g,6.65,.025,.04,.008,led,info(kind,'하단 LED 라이트바','하부 전체 폭을 가로지르는 확산 LED 스트립'),[0,.16,depth/2+.025]);
    for(let i=0;i<12;i++)rb(g,.045,.008,.02,.005,led,info(kind,'F-row 모드 표시','숫자열을 기능열로 바꾸었을 때의 표시 위치'),[-2.65+i*.35,.69,-.81]);
  }
  g.userData.keyCount=layout.length;g.userData.layout=isHyzen?'65% · 67 keys':loomi?'TKL · 88 keys':'TKL · 87 keys';
  g.userData.layoutNote='배열과 주요 컨트롤은 제품 사진을 참고했습니다. 작은 키캡 각인·레이어별 매핑·접점 내부는 단순화했습니다.';
  finish(g,kind,loomi?(navySilver?'Navy Silver · 어두운 키캡':'Navy Gold · 밝은 키캡'):isHyzen?(spaceGray?'Space Gray · 어두운 키캡':'Silver · 밝은 키캡'):'검정 하우징 · 회색 키캡');
  g.userData.colorId=color;
  if(navySilver||spaceGray){g.userData.colorNote=`사용자 확인 색상: ${navySilver?'네이비 실버 (Navy Silver)':'스페이스 그레이 (Space Gray)'}.`;g.userData.colorSource='user-confirmed';g.userData.colorConfirmedOn='2026-10-17';}
  const b=new THREE.Box3().setFromObject(g),c=b.getCenter(new THREE.Vector3());
  for(const child of g.children)child.position.sub(new THREE.Vector3(c.x,b.min.y,c.z));
  return g;
}

function sensor(side) {
  const g=group('rift',`sensor-${side}`,'원형 받침·가느다란 기둥·원통형 헤드를 가진 외부 Constellation 센서');g.userData.gearPart=info('rift',`${side==='left'?'왼쪽':'오른쪽'} 스탠드 센서`,'Rift CV1과 Touch의 위치를 추적하기 위한 외부 센서. 세트에 두 개를 배치했습니다.');
  cylinder(g,.52,.11,black,g.userData.gearPart,[0,.07,0]);cylinder(g,.054,2.2,dark,info('rift','센서 스탠드','원형 베이스에서 센서를 들어 올리는 얇은 기둥'),[0,1.2,0]);
  const head=group('rift','sensor-head','앞쪽을 바라보는 원통형 센서 헤드');g.add(head);head.position.set(0,2.48,-.03);head.rotation.x=-.12;
  cylinder(head,.25,.48,black,g.userData.gearPart,[0,0,0],[Math.PI/2,0,0]);
  const face=material('#3e454c',.22,.21);cylinder(head,.226,.016,face,info('rift','센서 전면','적외선 추적용 외부 센서의 원형 전면'),[0,0,-.25],[Math.PI/2,0,0]);
  tube(g,[[0,.04,.07],[.15,.025,.38],[.52,.025,.46],[.83,.025,.61]],.025,rubber,info('rift','센서 USB 케이블','센서에서 PC로 연결되는 유선 케이블'),false,18);return g;
}
function touch(side) {
  const left=side==='left',s=left?-1:1,g=group('rift',`touch-${side}`,'원형 버튼판·그립·손 주위를 감싸는 아래쪽 추적 링');g.userData.gearPart=info('rift',`${left?'왼손':'오른손'} Oculus Touch`,'CV1 세대의 Touch. 아날로그 스틱, 두 버튼, 트리거와 아래쪽으로 감기는 추적 링을 갖춥니다.');
  const grip=mesh(g,new THREE.CapsuleGeometry(.2,.72,5,18),black,info('rift','Touch 그립','한 손으로 잡는 곡선형 배터리 그립'),[0,.64,.15],[.28,0,-s*.16]);grip.scale.z=.84;
  const plate=cylinder(g,.4,.12,dark,info('rift','Touch 버튼판','엄지로 조작하는 원형 상단 버튼 영역'),[0,1.21,-.08],[.17,0,s*.09]);plate.scale.z=.87;
  const ringPts=[];for(let i=0;i<=46;i++){const a=i/46*Math.PI*2;ringPts.push([s*(.22+Math.cos(a)*.64),.68+Math.sin(a)*.38,-.04+Math.sin(a)*.4]);}
  ribbon(g,ringPts,.095,.055,black,info('rift','Touch 추적 링','원래 Rift Touch의 손 아래·바깥쪽을 감싸는 링. Quest 후속 세대의 위쪽 링과 구분한 형태입니다.'));
  cylinder(g,.1,.13,black,info('rift','아날로그 스틱','엄지 위치의 아날로그 스틱'),[-s*.16,1.33,-.17]);cylinder(g,.13,.035,rubber,info('rift','스틱 캡','오목한 고무 스틱 상단'),[-s*.16,1.41,-.17]);
  for(const [i,label] of (left?['X','Y']:['A','B']).entries())cylinder(g,.075,.035,black,info('rift',`Touch ${label} 버튼`,'엄지로 누르는 액션 버튼'),[s*(.12+i*.055),1.31,-.25+i*.21]);
  cylinder(g,.045,.025,silver,info('rift',left?'메뉴 버튼':'Oculus 버튼','홈 또는 메뉴를 여는 작은 버튼'),[0,1.31,.12]);
  const trigger=mesh(g,new THREE.SphereGeometry(.16,16,10),dark,info('rift','검지 트리거','버튼판 아래 검지로 누르는 트리거'),[0,1.06,-.37]);trigger.scale.set(.9,.75,.55);
  rb(g,.08,.24,.18,.06,dark,info('rift','그립 트리거','그립 안쪽의 손가락 입력'),[-s*.19,.78,.03]);
  tube(g,[[0,.15,.22],[s*.13,.08,.33],[s*.28,.025,.7],[s*.1,.02,.8]],.016,rubber,info('rift','손목 스트랩','손에서 컨트롤러가 빠지는 것을 줄이는 얇은 스트랩'),false,20);return g;
}
function headset() {
  const h=group('rift','headset','CV1의 둥근 사각 전면·패브릭 측면·헤드밴드·일체형 이어폰');h.userData.gearPart=info('rift','Oculus Rift CV1 헤드셋','검정 전면 패널과 머리를 둘러싸는 스트랩, 일체형 이어폰을 가진 PC 연결 VR 헤드셋');
  const fabric=material('#27292d',0,.96),edge=material('#15181c',.1,.44);
  const visor=new THREE.ExtrudeGeometry(roundedShape(3.85,1.83,.42),{depth:.85,bevelEnabled:true,bevelSize:.2,bevelThickness:.2,bevelSegments:5,curveSegments:10});
  mesh(h,visor,fabric,info('rift','헤드셋 패브릭 하우징','전면에서 측면으로 이어지는 곡면 사각 실루엣과 패브릭 둘레'),[0,1.16,-.45]);
  const front=new THREE.ExtrudeGeometry(roundedShape(3.82,1.78,.39),{depth:.025,bevelEnabled:true,bevelSize:.07,bevelThickness:.09,bevelSegments:4,curveSegments:10});
  mesh(h,front,material('#303237',0,.63),info('rift','CV1 전면 패널','외부 카메라 구멍이 없는 CV1의 매끈한 검정 전면'),[0,1.16,-.7]);
  const badge=roundedShape(.28,.115,.055),hole=roundedShape(.2,.047,.023);badge.holes.push(new THREE.Path(hole.getPoints()));
  mesh(h,new THREE.ShapeGeometry(badge),material('#aeb3b8',.2,.5),info('rift','Oculus 전면 마크','전면 위쪽의 작은 타원형 브랜드 마크'),[0,1.83,-.805],[0,Math.PI,0]);
  const foam=mesh(h,new THREE.TorusGeometry(1,.145,8,40),rubber,info('rift','얼굴 접촉 폼','눈 주위를 감싸는 검정 폼 인터페이스'),[0,1.16,.62]);foam.scale.set(1.7,.84,1);
  const lensmat=material('#182832',.35,.13);
  for(const s of [-1,1]) {
    const eye=mesh(h,new THREE.SphereGeometry(.51,22,14),lensmat,info('rift',s<0?'왼쪽 렌즈':'오른쪽 렌즈','헤드셋 안쪽의 좌우 렌즈'),[s*.87,1.16,.64]);eye.scale.set(1,.92,.19);
    ribbon(h,[[s*1.88,1.45,.05],[s*1.98,1.55,.75],[s*1.58,1.76,1.8],[s*.85,1.8,2.38],[0,1.75,2.6]],.35,.075,edge,info('rift','측면 헤드밴드','좌우에서 머리 뒤쪽으로 이어지는 조절식 헤드밴드'));
    const audio=group('rift',s<0?'audio-left':'audio-right','헤드밴드에 달린 회전형 온이어 이어폰');h.add(audio);
    ribbon(audio,[[s*1.98,1.6,.24],[s*2.13,1.1,.35],[s*2.2,.75,.4]],.12,.08,edge,info('rift','이어폰 지지 암','CV1 일체형 이어폰을 받치는 짧은 암'));
    cylinder(audio,.39,.16,black,info('rift',s<0?'왼쪽 이어폰':'오른쪽 이어폰','헤드셋 양옆에 달린 원형 온이어 오디오'),[s*2.15,.71,.4],[0,0,Math.PI/2]);
    cylinder(audio,.33,.17,rubber,info('rift','이어폰 쿠션','귀에 닿는 원형 이어폰 쿠션'),[s*2.14,.71,.4],[0,0,Math.PI/2]);
  }
  ribbon(h,[[0,2.14,-.05],[0,2.74,.55],[0,2.83,1.35],[0,2.34,2.38],[0,1.78,2.59]],.43,.065,edge,info('rift','상단 스트랩','정수리를 지나 뒤쪽 밴드에 연결되는 넓은 상단 스트랩'));
  tube(h,[[-1.9,1.85,.12],[-2.13,1.86,.67],[-1.88,1.9,1.8],[-1.63,1.48,2.8],[-2.26,.15,3.2],[-3.1,.04,3.5]],.031,rubber,info('rift','PC 연결 케이블','헤드셋 뒤에서 PC로 이어지는 CV1의 유선 케이블'),false,30);
  return h;
}
export function createRiftPart(kind='headset') {
  const factories={headset,'sensor-left':()=>sensor('left'),'sensor-right':()=>sensor('right'),'touch-left':()=>touch('left'),'touch-right':()=>touch('right')};
  if(!factories[kind])throw new Error(`Unknown Rift part: ${kind}`);
  const g=factories[kind]();g.name=kind;
  const b=new THREE.Box3().setFromObject(g),c=b.getCenter(new THREE.Vector3());
  for(const child of g.children)child.position.sub(new THREE.Vector3(c.x,b.min.y,c.z));
  finish(g,'rift','Black · CV1 세대');g.userData.riftPart=kind;
  g.userData.placementNote='Y-up, 바닥 Y0, XZ 바운딩박스 중심이 원점. 앞쪽은 -Z. 케이블을 포함한 경량 외형입니다.';
  return g;
}
export function createRiftKit() {
  const g=group('rift',NAME.rift,'Rift CV1 헤드셋, 외부 스탠드 센서 두 개, 좌우 Touch 컨트롤러의 구성');
  g.add(headset());
  const left=sensor('left');left.position.set(-3.2,0,-.85);left.rotation.y=-.16;g.add(left);const right=sensor('right');right.position.set(3.2,0,-.85);right.rotation.y=.16;g.add(right);
  const tl=touch('left');tl.position.set(-2.4,0,2.15);tl.rotation.y=-.35;g.add(tl);const tr=touch('right');tr.position.set(2.4,0,2.15);tr.rotation.y=.35;g.add(tr);
  g.userData.setContents={headset:1,sensors:2,touchControllers:2};return finish(g,'rift','Black · CV1 세대');
}
