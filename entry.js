import {OrbitStage} from './stage.js?v=surfaces2';
import {getGallery,themes} from './gallery.js?v=surfaces1';
import {openDetail} from './details.js';
import {reconstructionMethods} from './variants.js?v=surfaces1';
import {rigPresets,rigGroups,rigNote} from './rig-data.js?v=slotsMatte7';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const gallery=await getGallery();
let currentTheme=null,currentCollection='all',currentItem=null,currentItems=[],autoRotate=true,stage;
let reduced=matchMedia('(prefers-reduced-motion: reduce)').matches||localStorage.getItem('orbit-reduce-motion')==='true';
let maskPlaying=!reduced,nextMaskAt=0;
const themeButtons=[...document.querySelectorAll('[data-theme]')];
const modelFiles={workstation:'workstation.glb',jetson:'jetson.glb','monitor-0':'monitor-aoc.glb','monitor-1':'monitor-samsung.glb','monitor-2':'monitor-q2775ce.glb','mouse-infinity':'mouse-infinity.glb','mouse-scyrox':'mouse-scyrox.glb','mouse-lift':'mouse-lift.glb','keyboard-loomi':'keyboard-loomi.glb','keyboard-vm87':'keyboard-vm87.glb','keyboard-hyzen':'keyboard-hyzen.glb',rift:'rift-kit.glb'};
const rigFiles={'motion-desk':'motion-desk.glb','desk-chair':'desk-chair.glb','keyboard-stand':'keyboard-stand.glb','mouse-pad':'artisan-zero-pad.glb','wrist-rest':'hyzen-palm-rest.glb',earphones:'supermix4-earphones.glb'};
for(const kind of ['headset','sensor-left','sensor-right','touch-left','touch-right'])modelFiles['rift-'+kind]='rift-'+kind+'.glb';
const currentRaw=()=>stage?.mode==='rig'?currentItem?.raw:stage?.selectedEntry?.raw;
const activeVariant=()=>currentItem?.variants?.[stage?.selectedEntry?.variantIndex||0];
function partFile(part){if(currentItem?.id==='workstation'&&['case','motherboard','cpu','cooler','ram','gpu','storage','fans','power'].includes(part.id))return 'pc-'+part.id+'.glb';if(currentItem?.id==='rift'&&['headset','sensor-left','sensor-right','touch-left','touch-right'].includes(part.id))return 'rift-'+part.id+'.glb';return modelFiles[currentItem?.id];}
function showPart(part){
 if(!part)return;
 $('#part-title').textContent=part.name||currentItem?.title||'';
 $('#part-description').textContent=part.description||currentItem?.description||currentItem?.subtitle||'';
 $('#part-specs').innerHTML=(part.fields||[]).map(([name,value])=>'<div><span class="muted">'+esc(name)+'</span><br>'+esc(value)+'</div>').join('');
 if(currentItem?.detailProject)$('#part-specs').innerHTML+='<button class="part-record" data-record="'+currentItem.detailProject+'">연결된 기록 보기 ↗</button>';
 if(currentItem?.id==='workstation'&&!part.id){const parts=currentRaw()?.userData.parts||[];$('#part-specs').innerHTML+='<div class="part-choices">'+parts.map(p=>'<button data-part="'+esc(p.id)+'">'+esc(p.name)+'</button>').join('')+'</div>';}
 const downloads=part.downloads||currentItem?.downloads||[];for(const file of downloads)$('#part-specs').innerHTML+='<a class="model-download" href="'+esc(file.url)+'" download>'+esc(file.label)+' ↓</a>';
 let failed=false;currentRaw()?.traverse(o=>{if(o.userData.isProductSlot&&o.userData.assetState==='error')failed=true;});if(failed)$('#part-specs').innerHTML+='<button class="part-record" data-retry-model>모델 다시 불러오기</button>';
 const url=part.productUrl||currentItem?.productUrl;$('#part-link').hidden=!url;if(url)$('#part-link').href=url;$('#part-inspector').hidden=false;
}
function hidePart(){$('#part-inspector').hidden=true;}
function showCurrent(){
 if(!currentItem)return;
 if(stage.mode==='rig'){showPart({name:currentItem.title,description:currentItem.subtitle,productUrl:currentItem.productUrl,fields:[...currentItem.fields,['모형',rigNote]]});return;}
 const raw=stage.selectedEntry?.raw,v=activeVariant(),cloud=v?.cloud,surface=v?.surface;
 if(surface)showPart({name:currentItem.title+' · '+surface.method,description:surface.note,fields:[['방식',surface.method],['삼각형',Number(surface.triangles).toLocaleString()+'개 · 원본 전체 보존'],['꼭짓점',Number(surface.vertices).toLocaleString()+'개'],['색상',surface.colorNote],['시점','MVS와 같은 현장 좌표·중앙 위치·회전 상태 유지']],downloads:[{label:surface.method+' GLB',url:surface.file}]});
 else if(cloud)showPart({name:currentItem.title+' · '+v.label,description:currentItem.description,fields:[['방식',cloud.method],['원본 '+(cloud.methodId==='voxel'?'복셀 수':'점 수'),Number(cloud.sourcePointCount).toLocaleString()],['웹용 표본',Number(cloud.count).toLocaleString()+'개'],['색상',cloud.colorNote],['시점','같은 현장 좌표·중앙 위치·회전 상태 유지'],['표현',cloud.methodId==='voxel'?'실제 복셀 중심 표본 · 표시용 크기 조정':'실제 복원 점군의 형상과 RGB 표본']]});
 else if(currentItem.variantKind==='mask')showPart({name:'객체 세그멘테이션 · '+(v?.label||''),description:raw?.userData.segmentation?.note||currentItem.subtitle,fields:[['현재 마스크',v?.label],['자료',v?.note||'같은 파노라마의 객체 추출 결과'],['조작','↑↓ 마스크 전환 · 순환 재생/정지']]});
 else if(raw?.userData.gearPart){const p={...raw.userData.gearPart};p.fields=[['모형',modelFiles[currentItem.id]?'실제 사진과 제품 규격을 참고한 근사 모형':'활동과 작업을 표현하는 3D 모형']];if(raw.userData.colorNote)p.fields.push(['색상',raw.userData.colorNote]);showPart(p);}
 else showPart({name:currentItem.title,description:currentItem.subtitle,productUrl:currentItem.productUrl,fields:modelFiles[currentItem.id]?[['모형','실제 사진과 제품 규격을 참고한 근사 모형']]:[]});
}
function renderVariants(){
 const item=currentItem,variants=item?.variants||[],entry=stage?.selectedEntry;
 $('#variant-controls').hidden=!variants.length;
 if(!variants.length)return;
 const index=entry?.variantIndex||0,ready=!!entry?.raw,isMask=item.variantKind==='mask';
 $('#variant-kind').textContent=isMask?'OBJECT MASK':'3D METHOD';
 const options=isMask?variants.map((v,i)=>({...v,index:i})):reconstructionMethods.map(([id,label])=>({id,label,index:variants.findIndex(v=>v.id===id)}));
 $('#variant-options').innerHTML=options.map(v=>'<button data-variant="'+v.index+'" aria-pressed="'+(v.index===index)+'"'+(!ready||v.index<0?' disabled':'')+(v.index<0?' title="원본 미확인"':'')+'>'+esc(v.label)+(v.index<0?' <small>미보유</small>':'')+'</button>').join('');
 $('#variant-prev').disabled=!ready||variants.length<2;$('#variant-next').disabled=!ready||variants.length<2;
 $('#mask-play').hidden=!isMask;$('#mask-play').disabled=reduced;
 $('#mask-play').textContent=maskPlaying?'순환 중 Ⅱ':'순환 재생 ▶';
 $('#mask-play').setAttribute('aria-pressed',String(maskPlaying));
 const missing=(item.unavailable||[]).map(v=>v.label+' 원본 미확인').join(' · ');
 $('#variant-note').textContent=isMask?(reduced?'움직임 줄이기 적용 · ↑↓ 또는 버튼으로 마스크 전환':'동일 파노라마 · 실제 객체 추출 결과에서 복구한 표시용 마스크'):('↑↓ 표현 방식 · ←→ 현장·작업 이동'+(missing?' · '+missing:''));
}
function syncCurrent(){
 if(!currentItem)return;
 const v=activeVariant(),raw=stage?.selectedEntry?.raw;
 $('#current-category').textContent=v?.surface?'실제 '+v.surface.method:v?.cloud?(v.id==='voxel'?'실제 복셀 표본':'실제 점군'):currentItem.type;
 $('#open-current').innerHTML=esc(currentItem.title+(v?' · '+v.label:''))+' <span>↗</span>';
 $('#current-description').textContent=v?.cloud||v?.surface?v.subtitle:currentItem.variantKind==='mask'?'동일 파노라마 · '+(v?.label||'')+' 마스크':currentItem.subtitle+(raw?.userData.colorNote?' · 대표 제품색':'');
 $('#auto-rotate').hidden=currentItem.autoRotate===false;
 $('#scene').dataset.activeModel=currentItem.id;$('#scene').dataset.activeVariant=v?.id||'';
 $('#scene').dataset.modelType=currentItem.variantKind||'mesh';
 renderVariants();
}
function chooseVariant(index){if(!stage?.selectedEntry?.raw)return;nextMaskAt=performance.now()+5000;stage.setVariant(index);}
function positionCaseAction(anchor){
 const button=$('#rig-explode');button.hidden=!anchor?.visible||!$('#rig-inventory').hidden;
 if(button.hidden)return;
 const w=button.offsetWidth,h=button.offsetHeight,gap=18,margin=16,minimumY=$('.rig-topline').getBoundingClientRect().bottom+12;
 const y=Math.max(minimumY,Math.min(innerHeight-h-130,anchor.top+(anchor.bottom-anchor.top)*.3));
 const right={x:anchor.right+gap,y,side:'right'},left={x:anchor.left-w-gap,y,side:'left'},above={x:Math.max(margin,Math.min(innerWidth-w-margin,(anchor.left+anchor.right-w)/2)),y:Math.max(minimumY,Math.min(innerHeight-h-130,anchor.top-h-gap)),side:'above'};
 const panel=$('#part-inspector').hidden?null:$('#part-inspector').getBoundingClientRect();
 const fits=p=>p.x>=margin&&p.x+w<=innerWidth-margin&&(!panel||p.x+w<=panel.left||p.x>=panel.right||p.y+h<=panel.top||p.y>=panel.bottom);
 const choices=button.getAttribute('aria-pressed')==='true'?[left,above,right]:[right,left,above];
 const position=choices.find(fits)||above;button.style.left=position.x+'px';button.style.top=position.y+'px';button.dataset.caseSide=position.side;
}
try{
 stage=new OrbitStage({
  onTheme:id=>setTheme(id),
  onRigInspection:value=>{$('#rig-return').hidden=!value;$('#scene').dataset.rigInspection=String(value);},
  onRigProgress:status=>{$('#rig-assets-status').textContent=status.failed.length?'불러오기 실패 '+status.failed.length+'개':status.ready===status.total?'32개 제품 연결 완료':status.ready+' / '+status.total+' 제품 불러오는 중';$('#scene').dataset.productsReady=String(status.ready);$('#scene').dataset.productsTotal=String(status.total);$('#scene').dataset.productsFailed=String(status.failed.length);},
  onRigExploded:value=>{$('#rig-explode').setAttribute('aria-pressed',String(value));$('#rig-explode').textContent=value?'다시 조립하기':'본체 분해하기';$('#scene').dataset.pcLayout=value?'spread':'assembled';if(value)hidePart();},
  onRigCaseAnchor:positionCaseAction,
  onRigLayout:labels=>{const root=$('#rig-part-labels'),present=new Set();for(const p of labels){present.add(p.id);let el=root.querySelector('[data-pc-label="'+p.id+'"]');if(!el){el=document.createElement('span');el.dataset.pcLabel=p.id;root.append(el);}el.textContent=p.name;el.style.left=p.x+'px';el.style.top=p.y+'px';el.hidden=!p.visible;}for(const el of root.children)if(!present.has(el.dataset.pcLabel))el.remove();},
  onRigPick:(item,part)=>{currentItem=item;for(const b of document.querySelectorAll('[data-rig-view]'))b.setAttribute('aria-pressed','false');$('#rig-inventory').hidden=true;$('#rig-list-toggle').setAttribute('aria-expanded','false');$('#rig-current').innerHTML=esc(item.title)+' <span>↗</span>';$('#rig-description').textContent=item.id==='workstation'?'왼쪽 투명 패널 · 본체 옆 분해하기로 내부 장비를 꺼내보세요.':item.subtitle;$('#scene').dataset.activeModel=item.id;$('#announcement').textContent=item.title;for(const b of document.querySelectorAll('[data-gear]'))b.setAttribute('aria-pressed',String(b.dataset.gear===item.id));if(item.id==='workstation'&&!part)hidePart();else if(part&&part.id&&item.id==='workstation')showPart(part);else showCurrent();},
  onFocus:(item,index,total)=>{if(!item)return;currentItem=item;$('#current-number').textContent=String(index+1).padStart(2,'0');$('#total-number').textContent=String(total).padStart(2,'0');$('#explode-button').hidden=!item.explodable;$('#explode-button').setAttribute('aria-pressed','false');hidePart();$('#announcement').textContent=(index+1)+' / '+total+', '+item.title;nextMaskAt=performance.now()+3000;syncCurrent();},
  onAssetReady:()=>syncCurrent(),
  onVariant:(item,v)=>{if(item.id!==currentItem?.id)return;const opened=!$('#part-inspector').hidden;syncCurrent();$('#announcement').textContent=item.title+(v?' · '+v.label:'');if(opened)showCurrent();},
  onTick:time=>{if(currentItem?.variantKind==='mask'&&maskPlaying&&!reduced&&time>nextMaskAt&&stage?.selectedEntry?.raw&&Math.abs(stage.position-stage.target)<.05&&!document.querySelector('dialog[open]')){nextMaskAt=time+3000;stage.stepVariant(1);}},
  onPickPart:part=>showPart(part),
  onHover:(part,pos)=>{const tip=$('#part-tooltip');if(!part||!pos||!$('#part-inspector').hidden||document.querySelector('dialog[open]')){tip.hidden=true;return;}tip.textContent=part.name;tip.style.left=Math.min(innerWidth-250,pos.x+17)+'px';tip.style.top=Math.min(innerHeight-70,pos.y+18)+'px';tip.hidden=false;},
  onLoading:value=>{$('#model-loading').hidden=!value;},
  onError:(item,error)=>{if(item.id===currentItem?.id)$('#current-description').textContent='이 모형을 불러오지 못했습니다. 연결된 기록에서 작업 내용을 볼 수 있습니다.';console.warn('Model could not load:',item.id,error.message);},
  onPortalPositions:positions=>{for(const p of positions){const el=document.querySelector('.theme-label[data-theme="'+p.id+'"]');el.style.left=p.x+'px';el.style.top=p.y+'px';}},
  onModelPositions:(positions,occluder)=>{const root=$('#floating-labels'),present=new Set();for(const p of positions){present.add(p.id);let el=root.querySelector('[data-label="'+p.id+'"]');if(!el){el=document.createElement('span');el.className='model-label';el.dataset.label=p.id;root.append(el);}el.textContent=p.title;el.classList.toggle('selected',p.selected);el.style.left=p.x+'px';el.style.top=p.y+'px';el.hidden=!p.visible||p.y<220||p.y>innerHeight-100||!!(occluder&&p.x>occluder.left&&p.x<occluder.right&&p.y>occluder.top-20&&p.y<occluder.bottom);}for(const el of root.children)if(!present.has(el.dataset.label))el.remove();}
 });
 stage.setReduced(reduced);document.body.classList.add('spatial-home');await stage.buildPortals(gallery);document.body.classList.add('stage-ready');
}catch(error){console.error('Spatial view failed:',error);$('#stage-subtitle').textContent='3D 보기를 시작하지 못했습니다. 전체 기록에서 모든 연구와 작업을 볼 수 있습니다.';$('#theme-labels').hidden=true;}
function home(){if(!stage)return;leaveRig();currentTheme=null;currentItem=null;stage.setHome();document.body.classList.add('spatial-home');document.body.classList.remove('spatial-gallery');$('#theme-labels').hidden=false;$('.orbit-controls').hidden=true;$('.model-actions').hidden=true;$('#collection-bar').hidden=true;$('#variant-controls').hidden=true;$('#floating-labels').replaceChildren();$('#stage-title').innerHTML='<span class="home-greeting">안녕하세요,</span><em>김경순</em>입니다.';$('#stage-subtitle').textContent='건축 ICT 연구실(CONICT) 소속';$('#gesture-text').textContent='테마 패널을 선택해 궤도를 여세요';for(const b of themeButtons)b.setAttribute('aria-pressed','false');hidePart();}
async function setTheme(id){if(!stage||!themes[id])return;leaveRig();currentTheme=id;currentCollection='all';document.body.classList.remove('spatial-home');document.body.classList.add('spatial-gallery');$('#theme-labels').hidden=true;$('.orbit-controls').hidden=false;$('.model-actions').hidden=false;$('#collection-bar').hidden=false;$('#stage-title').innerHTML=themes[id].name+'의 <em>입체 기록.</em>';$('#stage-subtitle').textContent=themes[id].subtitle;$('#gesture-text').textContent='빈 공간 드래그: 링 넘기기 · 모형 드래그: 회전 · ↑↓ 표현 전환';for(const b of themeButtons)b.setAttribute('aria-pressed',String(b.dataset.theme===id));renderFilters();await filterCollection('all');}
function renderFilters(){$('#collection-bar').innerHTML=themes[currentTheme].filters.map(([id,name])=>'<button data-collection="'+id+'" aria-pressed="'+(id===currentCollection)+'">'+name+'</button>').join('');}
async function filterCollection(id){currentCollection=id;currentItems=gallery[currentTheme].filter(p=>id==='all'||p.collection===id);if(!currentItems.length)return;renderFilters();$('#floating-labels').replaceChildren();await stage.setItems(currentItems);}
function leaveRig(){document.body.classList.remove('spatial-rig');$('#rig-ui').hidden=true;$('#rig-inventory').hidden=true;for(const b of document.querySelectorAll('[data-rig]'))b.setAttribute('aria-pressed','false');}
function enterRig(){if(!stage)return;currentTheme=null;currentItem=null;hidePart();document.body.classList.remove('spatial-home','spatial-gallery');document.body.classList.add('spatial-rig');const rig=stage.setRig();$('#theme-labels').hidden=true;$('.orbit-controls').hidden=true;$('.model-actions').hidden=true;$('#collection-bar').hidden=true;$('#variant-controls').hidden=true;$('#floating-labels').replaceChildren();$('#rig-ui').hidden=false;$('#stage-title').innerHTML='THE RIG <em>나의 작업 환경.</em>';$('#stage-subtitle').textContent='연구를 돌리고, 세계를 만들고, 일상을 완성하는 장비들.';$('#gesture-text').textContent='드래그로 둘러보기 · 휠로 확대 · 장비를 눌러 자세히';$('#scene').dataset.modelType='rig';$('#scene').dataset.activeModel='the-rig';$('#scene').dataset.activeVariant='';for(const b of themeButtons)b.setAttribute('aria-pressed','false');for(const b of document.querySelectorAll('[data-rig]'))b.setAttribute('aria-pressed','true');$('#rig-items').innerHTML=Object.entries(rigGroups).map(([group,title])=>'<div class="rig-group"><h3>'+title+'</h3>'+rig.equipment.filter(i=>i.group===group).map(i=>'<button data-gear="'+i.id+'" aria-pressed="false"><span>'+esc(i.title)+'</span><span>↗</span></button>').join('')+'</div>').join('');$('#rig-caption .eyebrow').textContent='MY DAILY SETUP';$('#rig-current').innerHTML='생각을 현실로 만드는 자리 <span>↗</span>';$('#rig-description').textContent='장비를 눌러 제품과 부품을 살펴보세요.';setRigPreset('overview');}
function setRigPreset(id){stage?.rig?.preset(id);currentItem=null;$('#rig-current').innerHTML='생각을 현실로 만드는 자리 <span>↗</span>';$('#rig-description').textContent='장비를 눌러 제품과 부품을 살펴보세요.';for(const b of document.querySelectorAll('[data-rig-view]'))b.setAttribute('aria-pressed',String(b.dataset.rigView===id));hidePart();}
$('#rig-presets').innerHTML=rigPresets.map(([id,title])=>'<button data-rig-view="'+id+'" aria-pressed="'+(id==='overview')+'">'+title+'</button>').join('');
$('#rig-presets').onclick=e=>{const b=e.target.closest('[data-rig-view]');if(b)setRigPreset(b.dataset.rigView);};
for(const b of document.querySelectorAll('[data-rig]'))b.onclick=enterRig;
$('#rig-list-toggle').onclick=()=>{const open=$('#rig-inventory').hidden;$('#rig-inventory').hidden=!open;$('#rig-list-toggle').setAttribute('aria-expanded',String(open));if(open)hidePart();};
$('#rig-list-close').onclick=()=>{$('#rig-inventory').hidden=true;$('#rig-list-toggle').setAttribute('aria-expanded','false');};
$('#rig-items').onclick=e=>{const b=e.target.closest('[data-gear]');if(b)stage.rig.focus(b.dataset.gear);};
$('#rig-current').onclick=()=>{if(currentItem)showCurrent();else $('#rig-list-toggle').click();};
$('#rig-home').onclick=home;
$('#rig-return').onclick=()=>setRigPreset('overview');
$('#rig-explode').onclick=()=>stage.rig.setExploded(!stage.rig.exploded);
for(const b of themeButtons)b.onclick=()=>setTheme(b.dataset.theme);
$('#collection-bar').onclick=e=>{const b=e.target.closest('[data-collection]');if(b)filterCollection(b.dataset.collection);};
$('#variant-options').onclick=e=>{const b=e.target.closest('[data-variant]');if(b&&!b.disabled)chooseVariant(Number(b.dataset.variant));};
$('#variant-prev').onclick=()=>chooseVariant((stage.selectedEntry?.requestedVariant||0)-1);
$('#variant-next').onclick=()=>chooseVariant((stage.selectedEntry?.requestedVariant||0)+1);
$('#mask-play').setAttribute('aria-label','마스크 자동 순환');
$('#mask-play').onclick=()=>{maskPlaying=!maskPlaying;nextMaskAt=performance.now()+3000;renderVariants();};
$('#prev').onclick=()=>stage?.setTarget(Math.round(stage.target)-1);$('#next').onclick=()=>stage?.setTarget(Math.round(stage.target)+1);$('#open-current').onclick=showCurrent;
$('#home-button').onclick=home;$('.brand').onclick=e=>{e.preventDefault();home();};$('#part-close').onclick=hidePart;
$('#part-specs').onclick=e=>{const b=e.target.closest('[data-record]');if(b)openDetail(b.dataset.record);const p=e.target.closest('[data-part]');if(p){if(stage?.mode==='rig')stage.rig.focus('pc-'+p.dataset.part);else showPart(currentRaw()?.userData.parts?.find(part=>part.id===p.dataset.part));}if(e.target.closest('[data-retry-model]')){currentRaw()?.traverse(o=>{if(o.userData.isProductSlot&&o.userData.assetState==='error')o.userData.retry();});hidePart();}};
$('#auto-rotate').onclick=()=>{autoRotate=!autoRotate;stage?.setAutoRotate(autoRotate);$('#auto-rotate').setAttribute('aria-pressed',String(autoRotate));};
$('#explode-button').onclick=()=>{const value=$('#explode-button').getAttribute('aria-pressed')!=='true';$('#explode-button').setAttribute('aria-pressed',String(value));stage?.setExploded(value);};
$('#reset-model').onclick=()=>{stage?.resetModel();$('#explode-button').setAttribute('aria-pressed','false');hidePart();};
$('#motion-toggle').setAttribute('aria-pressed',String(reduced));$('#motion-toggle').onclick=()=>{reduced=!reduced;localStorage.setItem('orbit-reduce-motion',String(reduced));stage?.setReduced(reduced);if(reduced)maskPlaying=false;$('#motion-toggle').setAttribute('aria-pressed',String(reduced));renderVariants();};
window.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||e.target.matches('input,textarea,select,[contenteditable=true]'))return;if(e.key==='Escape'){if(stage?.mode==='rig'&&!$('#rig-inventory').hidden){$('#rig-list-close').click();return;}if(!$('#part-inspector').hidden)hidePart();else if(stage?.mode==='rig'||currentTheme)home();}if(!currentTheme)return;if((e.key==='ArrowDown'||e.key==='ArrowUp')&&currentItem?.variants?.length>1){e.preventDefault();chooseVariant((stage.selectedEntry?.requestedVariant||0)+(e.key==='ArrowDown'?1:-1));}if(e.key==='ArrowRight'){e.preventDefault();stage.setTarget(Math.round(stage.target)+1);}if(e.key==='ArrowLeft'){e.preventDefault();stage.setTarget(Math.round(stage.target)-1);}});
$('#scene').dataset.galleryCount=Object.values(gallery).flat().length;
