import * as THREE from 'three';

const matteCache=new WeakMap();
function matteMaterial(source){
 if(matteCache.has(source))return matteCache.get(source);
 if(source.isShaderMaterial||source.isRawShaderMaterial)return source;
 if(source.isMeshBasicMaterial&&!source.map){const material=source.clone();material.side=THREE.DoubleSide;material.forceSinglePass=true;material.depthWrite=!material.transparent;material.userData={...source.userData,displayFinish:'matte-unlit'};matteCache.set(source,material);return material;}
 const material=new THREE.MeshPhysicalMaterial({name:source.name,color:source.color?.clone()||new THREE.Color('white'),map:source.map||null,alphaMap:source.alphaMap||null,vertexColors:source.vertexColors,flatShading:!!source.flatShading,transparent:source.transparent,opacity:source.opacity,alphaTest:source.alphaTest,side:THREE.DoubleSide,depthTest:true,depthWrite:!source.transparent,emissive:0,metalness:0,roughness:1,specularIntensity:0,clearcoat:0,envMapIntensity:.35});
 // Metallic source textures often encode almost-black paint and rely on sharp
 // reflections to reveal it. Lift only the diffuse black point for readable
 // matte surfaces; the original texture, its details and all UVs stay intact.
 material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb = vec3(0.025) + diffuseColor.rgb * 0.975;');};
 material.customProgramCacheKey=()=> 'matte-diffuse-blackpoint-025';
 material.forceSinglePass=true;material.userData={...source.userData,displayFinish:'matte-diffuse',sourceMaterialType:source.type};
 if(material.map)material.map.anisotropy=4;matteCache.set(source,material);return material;
}
export function matteProducts(root){root.traverse(mesh=>{if(mesh.isMesh)mesh.material=Array.isArray(mesh.material)?mesh.material.map(matteMaterial):matteMaterial(mesh.material);});return root;}

// Rebuild only the shading normals. Positions, UV seams and triangle count stay
// intact; hard corners keep their crease rather than rounding the hardware.
export function smoothSurface(geometry,angle=55){
 const out=geometry.index?geometry.toNonIndexed():geometry.clone(),p=out.attributes.position;
 out.computeBoundingBox();const span=out.boundingBox.getSize(new THREE.Vector3()).length(),tolerance=Math.max(span*1e-5,1e-8);
 const key=i=>Math.round(p.getX(i)/tolerance)+','+Math.round(p.getY(i)/tolerance)+','+Math.round(p.getZ(i)/tolerance);
 const buckets=new Map(),faceNormals=[],a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
 for(let i=0;i<p.count;i+=3){
  a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1);c.fromBufferAttribute(p,i+2);
  const area=new THREE.Vector3().crossVectors(b.sub(a),c.sub(a)),normal=area.clone().normalize(),face={area,normal};faceNormals.push(face);
  for(let j=0;j<3;j++){const k=key(i+j);if(!buckets.has(k))buckets.set(k,[]);const bucket=buckets.get(k);if(bucket.at(-1)!==face)bucket.push(face);}
 }
 const normals=new Float32Array(p.count*3),sum=new THREE.Vector3(),cos=Math.cos(angle*Math.PI/180),old=out.attributes.normal;
 for(let i=0;i<p.count;i++){
  const face=faceNormals[Math.floor(i/3)];sum.set(0,0,0);
  for(const near of buckets.get(key(i)))if(face.normal.dot(near.normal)>cos)sum.add(near.area);
  if(sum.lengthSq()<1e-20){if(old)sum.fromBufferAttribute(old,i);if(sum.lengthSq()<1e-20)sum.set(0,1,0);}
  sum.normalize().toArray(normals,i*3);
 }
 out.setAttribute('normal',new THREE.BufferAttribute(normals,3));out.userData={...geometry.userData,smoothSurface:true,creaseDegrees:angle};return out;
}

// Subtract a rectangular opening from the opaque generated side. Clipping the
// triangles also interpolates the original UVs, so the frame keeps its texture.
function windowOpening(geometry,box){
 const w=box.max.x-box.min.x,h=box.max.y-box.min.y,d=box.max.z-box.min.z;
 const limits=[['x',box.min.x+w*.09,1],['x',box.max.x-w*.09,-1],['y',box.min.y+h*.12,1],['y',box.max.y-h*.07,-1],['z',box.min.z+d*.56,1]];
 const attrs=Object.entries(geometry.attributes),arrays=Object.fromEntries(attrs.map(([name])=>[name,[]]));
 const vertex=i=>Object.fromEntries(attrs.map(([name,attr])=>[name,Array.from({length:attr.itemSize},(_,k)=>attr.array[i*attr.itemSize+k])]));
 const distance=(v,[axis,value,sign])=>(v.position['xyz'.indexOf(axis)]-value)*sign;
 const mix=(a,b,t)=>Object.fromEntries(attrs.map(([name])=>[name,a[name].map((v,k)=>v+(b[name][k]-v)*t)]));
 const emit=poly=>{for(let j=1;j<poly.length-1;j++)for(const v of [poly[0],poly[j],poly[j+1]])for(const [name]of attrs)arrays[name].push(...v[name]);};
 for(let i=0;i<geometry.attributes.position.count;i+=3){
  let inside=[vertex(i),vertex(i+1),vertex(i+2)];
  for(const plane of limits){
   if(!inside.length)break;const keep=[],rest=[];
   for(let j=0;j<inside.length;j++){
    const a=inside[j],b=inside[(j+1)%inside.length],da=distance(a,plane),db=distance(b,plane);
    (da>=0?keep:rest).push(a);
    if((da>=0)!==(db>=0)){const intersection=mix(a,b,da/(da-db));keep.push(intersection);rest.push(intersection);}
   }
   emit(rest);inside=keep;
  }
 }
 const result=new THREE.BufferGeometry();for(const [name,attr]of attrs)result.setAttribute(name,new THREE.BufferAttribute(new attr.array.constructor(arrays[name]),attr.itemSize,attr.normalized));
 result.normalizeNormals();result.computeBoundingBox();result.computeBoundingSphere();result.userData={...geometry.userData,sideWindow:true};return result;
}

function transparentCase(scene){
 scene.updateMatrixWorld(true);const rotation=new THREE.Matrix4().makeRotationY(Math.PI/2),body=new THREE.Group(),meshes=[];
 scene.traverse(mesh=>{if(!mesh.isMesh)return;const geometry=mesh.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(rotation,mesh.matrixWorld));const copy=new THREE.Mesh(geometry,mesh.material);copy.name='case-opaque-frame';body.add(copy);meshes.push(copy);});
 const box=new THREE.Box3().setFromObject(body),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
 for(const mesh of meshes){const old=mesh.geometry;mesh.geometry=windowOpening(old,box);old.dispose();}
 const glassMaterial=new THREE.MeshBasicMaterial({color:'#b6c9d0',transparent:true,opacity:.13,depthWrite:false,depthTest:true,side:THREE.DoubleSide});glassMaterial.forceSinglePass=true;glassMaterial.userData.displayFinish='matte-glass';
 const glass=new THREE.Mesh(new THREE.PlaneGeometry(size.x*.82,size.y*.81),glassMaterial);
 glass.name='case-left-glass';glass.position.set(center.x,box.min.y+size.y*.525,box.max.z+size.z*.003);glass.renderOrder=3;glass.userData.pickThrough=true;glass.userData.caseSide='left';body.add(glass);
 body.userData.caseWindow={side:'left',axis:'+Z',width:.82,height:.81,opacity:.13};return body;
}

export function prepareProductSurface(gltf,file){
 gltf.scene.traverse(mesh=>{
  if(!mesh.isMesh)return;mesh.geometry=smoothSurface(mesh.geometry);
 });
 matteProducts(gltf.scene);
 if(file.endsWith('/p600s.glb'))gltf.scene=transparentCase(gltf.scene);
 return gltf;
}
