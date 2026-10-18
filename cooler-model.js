import * as THREE from 'three';

const ownedHoses=new WeakSet();
function extract(scene,accept){
 const root=new THREE.Group();scene.updateMatrixWorld(true);
 scene.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const geometry=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld),p=geometry.attributes.position,selected=[],index=geometry.index?.array;
  for(let i=0;i<(index?.length||p.count);i+=3){const ids=[index?index[i]:i,index?index[i+1]:i+1,index?index[i+2]:i+2],center=new THREE.Vector3();for(const id of ids)center.add(new THREE.Vector3().fromBufferAttribute(p,id));center.multiplyScalar(1/3);if(accept(center))selected.push(...ids);}
  if(selected.length){const out=new THREE.BufferGeometry();for(const [name,a]of Object.entries(geometry.attributes)){const values=new a.array.constructor(selected.length*a.itemSize);for(let i=0;i<selected.length;i++)for(let j=0;j<a.itemSize;j++)values[i*a.itemSize+j]=a.array[selected[i]*a.itemSize+j];out.setAttribute(name,new THREE.BufferAttribute(values,a.itemSize,a.normalized));}out.userData={...geometry.userData};out.computeBoundingBox();out.computeBoundingSphere();root.add(new THREE.Mesh(out,mesh.material));}
  geometry.dispose();
 });return root;
}
function fitted(source,size,rotation=[0,0,0]){
 source.rotation.set(...rotation);const box=new THREE.Box3().setFromObject(source),extent=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),fit=new THREE.Group();source.position.sub(center);fit.add(source);fit.scale.set(...size.map((v,i)=>v/extent.getComponent(i)));return fit;
}
function posePart(name,mesh,mounted,open){
 const root=new THREE.Group();root.name=name;root.add(mesh);root.userData.coolerPose={mounted,open};root.position.fromArray(mounted.position);root.rotation.fromArray([...mounted.rotation,'XYZ']);root.scale.setScalar(mounted.scale);return root;
}

export function createMountedCooler(source,mount={}){
 const root=new THREE.Group();root.name='mounted-x73';
 // The generated source has the radiator at negative Z and pump at positive Z.
 // Keep their native UVs and materials; remove the source's fixed display hoses.
 const radiator=fitted(extract(source,p=>p.z<-.14&&p.x<.665),[3.95,1.25,.55]);
 const pump=fitted(extract(source,p=>p.z>.09&&p.x<.65),[.9,.9,.35],[0,Math.PI/4,0]);
 root.add(posePart('x73-radiator',radiator,{position:[0,4.73,0],rotation:[Math.PI/2,0,0],scale:1},{position:[0,.44,0],rotation:[0,0,0],scale:.7}));
 root.add(posePart('x73-pump',pump,{position:mount.pump||[-.45,3.213501826179,-.315],rotation:[0,0,0],scale:1},{position:[.75,.30,.65],rotation:[0,0,0],scale:.58}));
 const material=new THREE.MeshLambertMaterial({color:'#171b22',side:THREE.DoubleSide});material.userData.displayFinish='matte-diffuse';
 for(let i=0;i<2;i++){const hose=new THREE.Mesh(new THREE.BufferGeometry(),material);hose.name='x73-hose-'+i;root.add(hose);}
 root.userData.coolerAssembly={radiator:'ceiling, fans down',pump:'CPU front surface',hoses:'two routed tubes; display approximation'};
 updateCoolerHoses(root);return root;
}

export function coolerPoseEntries(root){
 const entries=[];root.traverse(object=>{
  const pose=object.userData.coolerPose;if(!pose)return;
  const transform=value=>({position:new THREE.Vector3().fromArray(value.position),quaternion:new THREE.Quaternion().setFromEuler(new THREE.Euler(...value.rotation)),scale:new THREE.Vector3().setScalar(value.scale)});
  const base=transform(pose.mounted),open=transform(pose.open);
  entries.push({object,base:base.position,open:open.position,baseQuaternion:base.quaternion,openQuaternion:open.quaternion,baseScale:base.scale,openScale:open.scale});
 });return entries;
}
export function updateCoolerHoses(root){
 const radiator=root.getObjectByName('x73-radiator'),pump=root.getObjectByName('x73-pump');if(!radiator||!pump)return;
 radiator.updateMatrix();pump.updateMatrix();const spread=THREE.MathUtils.clamp((1-pump.scale.x)/.42,0,1);
 for(let i=0;i<2;i++){
  const from=new THREE.Vector3(1.94,i===0?-.24:.24,.04).applyMatrix4(radiator.matrix),to=new THREE.Vector3(.43,i===0?-.16:.16,0).applyMatrix4(pump.matrix);
  const a=from.clone().add(new THREE.Vector3(THREE.MathUtils.lerp(.65,.42,spread),-.12,.38));
  const b=to.clone().add(new THREE.Vector3(THREE.MathUtils.lerp(1.5,.55,spread),.15,THREE.MathUtils.lerp(.9,.15,spread)));
  const geometry=new THREE.TubeGeometry(new THREE.CubicBezierCurve3(from,a,b,to),40,THREE.MathUtils.lerp(.047,.035,spread),10,false);geometry.userData.smoothSurface=true;geometry.userData.routedHose=true;
  const hose=root.getObjectByName('x73-hose-'+i);if(ownedHoses.has(hose))hose.geometry.dispose();hose.geometry=geometry;ownedHoses.add(hose);
 }
}
export function openCooler(root){for(const p of coolerPoseEntries(root)){p.object.position.copy(p.open);p.object.quaternion.copy(p.openQuaternion);p.object.scale.copy(p.openScale);}updateCoolerHoses(root);}
export function disposeCoolerHoses(root){root.traverse(object=>{if(ownedHoses.has(object)){object.geometry.dispose();ownedHoses.delete(object);}});}
