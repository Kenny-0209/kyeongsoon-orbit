# ORBIT 장비 모델

2026-10-16 개인 소개 웹사이트의 장비를 다른 3D 도구에서도 열어 볼 수 있도록 저장한 GLB 자산 폴더입니다. 전부 사진과 제품 규격을 참고해 직접 작성한 근사 모델이며 정밀 실측 CAD 또는 제조사가 제공한 원본 3D 모델이 아닙니다. 제품 이름은 소유 장비의 소개와 제품 계열 설명에 사용합니다.

## 구성

- workstation.glb: Phanteks Eclipse P600S 검은 본체, 유리 측면, 메쉬, Kraken 펌프와 튜브, RAM, GPU, 저장장치, 팬을 묶은 전체 PC.
- pc-*.glb: 전체 PC를 구성하는 9개 의미 단위(케이스, 보드, CPU, 쿨러, RAM, GPU, 저장장치, 팬, 전원 구역). 각 파일을 XZ 중심과 Y=0 바닥에 정렬했습니다.
- jetson.glb: NVIDIA 공식 개발 키트 사진을 참고한 Jetson AGX Orin 외형.
- monitor-*.glb: 장치 EDID로 확인한 AOC Q27G4S, Samsung LS27B61x/S61B 계열, Q2775CE. 실제 책상의 좌우 배치와 받침 상태까지 확인한 것은 아닙니다.
- mouse-*.glb / keyboard-*.glb: 사용자가 요청한 주변기기 제품 계열. 실제 소유 제품의 색상이 확인되지 않아 대표 제품색으로 제작했습니다.
- rift-kit.glb / rift-*.glb: Rift CV1 헤드셋, 외부 센서 두 개, 좌우 Touch를 묶은 세트 및 각 구성품.
- catalog.json: 각 파일의 이름, 설명, 바이트 크기, SHA-256, mesh/triangle 수, bounding box, 부품 메타데이터와 GLB 구조 검증 결과.

## 형태와 색상 근거

PC의 검은 케이스 및 RGB 메모리·원형 수랭 링은 사용자가 제공한 실물 사진을 따릅니다. 케이스명 P600S와 Kraken 제품군은 사용자가 확인했으며, Kraken 세부 SKU와 GIGABYTE GPU의 세부 GAMING/OC SKU는 확인하지 않았습니다. 전원 공급 장치의 제품명·정격 출력도 미확인입니다. Jetson은 은색·검은색 공식 개발 키트 형태를 참고했습니다. 주변기기의 대표색은 catalog.json 각 항목 colorNote에 기록하며 실제 소유 제품의 색상으로 주장하지 않습니다. Q2775CE는 EDID 모델명을 우선합니다.

## 좌표와 호환

GLB는 glTF 2.0 binary 형식이고 Y-up입니다. 단위는 전시 장면의 임의 world unit입니다. PC 전체 높이는 약 5.06이며 이 수치를 미터 실측값으로 해석하지 않습니다. 개별 부품도 원래의 상대 비율을 유지하지만 독립 파일에서 쉽게 다루도록 각각 중심·바닥을 정렬했습니다. 전체 PC에서 유리 방향은 +Z, 전면 흡기는 +X입니다. 입력장치의 앞쪽은 모듈 규약에 따라 -Z입니다.

Node CPU 내보내기는 브라우저 DOM을 만들지 않으므로 CanvasTexture 기반 글자 라벨을 생략합니다. 물리적 지오메트리, PBR 재질과 gearPart 이름·설명·공식 링크는 보존합니다. 원본 procedural JS의 특수 raycast 함수와 런타임 팬 회전 참조는 GLB가 보존하는 기능이 아닙니다. GLB를 다시 읽어 인터랙션을 연결할 때 extras에 저장된 gearPart를 이용해야 합니다. 외부 사진 텍스처와 개인 장치 식별자는 포함하지 않습니다.

## 다시 생성하기

orbit 폴더에서 Node로 다음을 실행합니다.

    node --experimental-loader ./tools/three-loader.mjs ./tools/exportgear.mjs

tools/three-loader.mjs는 bare import three를 같은 vendor 버전으로 연결합니다. tools/exportgear.mjs는 FileReader의 Blob 읽기만 최소 보완하여 모델을 하나씩 순차 생성·저장합니다. 다른 채팅의 GPU 작업을 방해하지 않도록 GPU 렌더링과 추론을 실행하지 않습니다. GLB 헤더·JSON·바이너리 범위·참조·좌표 유한성을 확인하고 catalog.json에 결과를 기록합니다.
