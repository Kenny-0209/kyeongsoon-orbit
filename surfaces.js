import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';

const loader=new GLTFLoader();
export async function loadSurface(item){
 const gltf=await loader.loadAsync(new URL(item.file,import.meta.url).href);
 const root=gltf.scene;
 root.name=item.id;
 root.traverse(mesh=>{
  if(!mesh.isMesh)return;
  // The source is planar research geometry: preserve edges and class colors.
  mesh.material=new THREE.MeshStandardMaterial({vertexColors:!!mesh.geometry.attributes.color,color:'#ffffff',roughness:1,metalness:0,flatShading:true,side:THREE.DoubleSide});
 });
 root.userData.fitBounds=item.fitBounds;
 root.userData.surface=item;
 root.userData.baseRotation=[.18,.35,0];
 root.userData.gearPart={name:item.site+' · '+item.method,description:item.note,downloads:[{label:item.method+' GLB',url:item.file}]};
 return root;
}
