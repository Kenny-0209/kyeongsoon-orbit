import * as THREE from 'three';

export async function createSegmentation(data){
 const loader=new THREE.TextureLoader();
 const texture=async file=>{const t=await loader.loadAsync(file);t.colorSpace=THREE.SRGBColorSpace;return t;};
 const g=new THREE.Group();g.name='panorama-segmentation';
 const width=8,height=width*data.height/data.width;
 const geometry=new THREE.PlaneGeometry(width,height);
 const base=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:await texture(data.image),side:THREE.DoubleSide,toneMapped:false}));g.add(base);
 const layers=[];
 for(const mask of data.masks){
  const material=new THREE.MeshBasicMaterial({map:await texture(mask.file),transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
  const plane=new THREE.Mesh(geometry,material);plane.position.z=.015+layers.length*.002;plane.renderOrder=2;plane.raycast=()=>{};g.add(plane);layers.push({material,mix:0,target:0});
 }
 const frame=new THREE.LineSegments(new THREE.EdgesGeometry(geometry),new THREE.LineBasicMaterial({color:'#58f6f1'}));frame.position.z=.04;g.add(frame);
 g.userData.fitBounds={min:[-width/2,-height/2,-.05],max:[width/2,height/2,.05]};
 g.userData.baseRotation=[0,0,0];g.userData.segmentation=data;
 g.userData.gearPart={name:'파노라마 객체 세그멘테이션',description:data.note};
 Object.defineProperty(g.userData,'setVariant',{value:(index,instant=false)=>{layers.forEach((layer,i)=>{layer.target=i===index?1:0;if(instant)layer.mix=layer.target;layer.material.opacity=layer.mix;});}});
 Object.defineProperty(g.userData,'update',{value:dt=>{for(const layer of layers){layer.mix+=(layer.target-layer.mix)*(1-Math.exp(-dt*7));layer.material.opacity=layer.mix;}}});
 g.userData.setVariant(0,true);return g;
}
