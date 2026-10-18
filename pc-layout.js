// Official MSI manual, printed pp.17/19/21 (PDF pp.29/31/33).
// Anchors are read from its board diagram, not a claim of measured CAD accuracy.
export const layoutSources={board:'https://download.msi.com/archive/mnu_exe/mb/MAGZ690TOMAHAWKWIFIDDR4.pdf#page=29',gpu:'https://www.gigabyte.com/kr/Graphics-Card/GV-N309TGAMING-OC-24GD/sp',ssd:'https://semiconductor.samsung.com/emea/consumer-storage/internal-ssd/980/'};
export const pcUnitsPerMm=4.8/510;
export const boardLayout={left:-1.95,bottom:1.45,width:244*pcUnitsPerMm,height:305*pcUnitsPerMm,front:-.63,depth:.22};
const diagram={left:167,top:261,width:353,height:441};
export function boardPoint(x,y,z=boardLayout.front){return [boardLayout.left+(x-diagram.left)/diagram.width*boardLayout.width,boardLayout.bottom+(1-(y-diagram.top)/diagram.height)*boardLayout.height,z];}
export const cpuCenter=boardPoint(353,390),cpuSize=[37.5*pcUnitsPerMm,45*pcUnitsPerMm,.047];
export const cpuPosition=[cpuCenter[0],cpuCenter[1]-cpuSize[1]/2,boardLayout.front+cpuSize[2]/2];
export const pumpMount=[cpuCenter[0],cpuCenter[1],boardLayout.front+cpuSize[2]+.175];
export const dimmAnchors=[432,445,459,472].map((x,i)=>({slot:['DIMMA1','DIMMA2','DIMMB1','DIMMB2'][i],position:boardPoint(x,396.5)}));
export const ramSize=[.07,133*pcUnitsPerMm,44*pcUnitsPerMm];
export const ramPositions=[dimmAnchors[1],dimmAnchors[3]].map(p=>[p.position[0],p.position[1]-ramSize[1]/2,boardLayout.front+ramSize[2]/2]);
export const gpuSlot={slot:'PCI_E1',position:boardPoint(293.5,526)};
export const gpuSize=[331*pcUnitsPerMm,70*pcUnitsPerMm,150*pcUnitsPerMm];
export const gpuPosition=[-2.1+gpuSize[0]/2,gpuSlot.position[1]-gpuSize[1],boardLayout.front+gpuSize[2]/2];
// Windows confirms CPU / RP09 / RP25 / RP21 paths and A2/B2 memory population.
// Firmware does not expose M2_2 vs M2_4 silkscreen names: retain that uncertainty.
export const storageMounts=[
 {id:'ssd9902',slot:'M2_1',connector:[389,495],confidence:'confirmed-cpu-path',note:'CPU 직결 경로와 공식 설명서로 확인'},
 {id:'ssd9901',slot:'M2_2',connector:[389,578],confidence:'inferred-chipset-slot',note:'칩셋 Gen4 연결 확인 · M2_2/M2_4 번호 구분은 추정'},
 {id:'ssd980250',slot:'M2_3',connector:[334,643],confidence:'inferred-gen3-slot',note:'RP09 Gen3 연결과 유일한 Gen3 M.2 슬롯을 대조'},
 {id:'ssd9801',slot:'M2_4',connector:[471,643],confidence:'inferred-chipset-slot',note:'칩셋 Gen4 연결 확인 · M2_2/M2_4 번호 구분은 추정'}
].map(p=>{const connector=boardPoint(...p.connector),size=[80.15*pcUnitsPerMm,22.15*pcUnitsPerMm,2.38*pcUnitsPerMm];return {...p,connector,size,position:[connector[0]-size[0]/2,connector[1]-size[1]/2,boardLayout.front+size[2]/2]};});
