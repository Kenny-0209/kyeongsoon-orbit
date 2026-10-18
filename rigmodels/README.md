# ORBIT 가구·액세서리 GLB

2026-10-17 사용자 장비 소개 공간의 가구와 추가 주변기기를 다른 3D 도구에서도 개별적으로 열 수 있도록 만든 배포 자산 폴더입니다. dist/gear-desk.js와 gear-extra.js의 완성된 절차형 모델을 CPU로 하나씩 내보냈습니다. 원래 사진·제품 정보와 공개 치수를 참고한 근사 외형이며 정밀 실측 CAD 또는 제조사가 제공한 3D 원본이 아닙니다.

## 개별 파일

- motion-desk.glb: 퍼시스 M302+ 모션데스크. 전체 화이트는 사용자 확인 색상입니다. 지정 판매 페이지의 FKD016 제목과 FKD016N 도표·폭 변경 안내를 함께 기록했습니다.
- desk-chair.glb: 퍼시스 어라운드 CH6200AH / 리뉴얼 CHN6200AH 계열. 사용자 확인 블랙입니다. 메쉬 등판, 좌판, 럼버서포트, 헤드레스트, 팔걸이와 5발 캐스터를 포함합니다.
- keyboard-stand.glb: 버니언스 X 브레스밋 키보드 거치대 2단. 실제 소유 판본·색상은 미확인으로 사진을 검토한 원목형을 대표로 표현합니다. 앞뒤 두 단의 거치 구조와 표면 앵커를 보존했습니다.
- hyzen-palm-rest.glb: LOFREE Hyzen 전용 팜레스트. Hyzen과 같은 스페이스 그레이는 사용자 확인 색상입니다.
- artisan-zero-pad.glb: ARTISAN NINJA FX ZERO 마우스패드. 블랙은 사용자 확인 색상입니다. 베이스, 천 표면, 스티치 테두리와 봉제선을 포함합니다. 실제 소유 크기와 경도는 미확인입니다.
- supermix4-earphones.glb: SIMGOT SUPERMIX 4 이어폰. 좌우 이어피스, 이어팁, 은색 꼬임 케이블과 3.5mm 플러그를 포함합니다. 색상·세부 외형은 공식 유통 제품 사진을 참고한 대표 외형입니다.
- catalog.json: 날짜, 파일명, 제품 설명, 색상 확인 범위, 참고 치수, 부품 이름·링크, SHA-256, Mesh·triangle·vertex 수, bounds 및 GLB 검증 결과입니다.

## 좌표와 보존 범위

glTF 2.0 binary / GLB이며 Y-up입니다. 각 파일은 XZ 중심과 바닥 Y=0으로 이동하고 별도의 확대·비율 변경은 하지 않았습니다. 단위는 ORBIT 전시 장면의 임의 world unit이며 실측 미터가 아닙니다. 가구의 dimensionsMm는 참고 제품 자료이며 실제 소유 제품의 실측값이라고 단정하지 않습니다.

중첩된 source node의 furnitureSpec, supports, supportSurface 등은 원래 source node의 로컬 좌표로 보존됩니다. GLB의 최상위 wrapper는 파일을 독립적으로 다루기 쉽게 중심과 바닥을 맞추는 이동을 추가합니다. 앵커를 다른 장면에 사용할 때 해당 source node의 월드 변환을 적용해야 합니다.

지오메트리·PBR 재질·부품별 gearPart 이름/설명/제품 링크를 extras로 보존했습니다. Node CPU 내보내기는 브라우저 DOM을 만들지 않으므로 CanvasTexture 기반 문자·로고 라벨은 생략합니다. 패드 봉제선의 LineBasicMaterial은 GLB 내보내기 복제본에서 같은 색상의 unlit 재질로 옮겨 호환성을 유지합니다. 원본 JS는 변경하지 않았습니다.

## 생성과 검증

orbit 폴더에서 다음을 실행합니다.

    node --experimental-loader ./tools/three-loader.mjs ./tools/exportrig.mjs

exporter는 GPU·브라우저·대형 모델 추론 없이 CPU에서 모델 하나씩 순차 처리합니다. glbutil.mjs가 모든 Mesh의 gearPart metadata와 실제 geometry attribute 값, 바닥 정렬·XZ 중심 bounds를 검사합니다. GLB 헤더·청크 범위·참조·accessor 범위와 저장된 실제 float 데이터의 finite 여부를 확인하며 파일을 저장한 뒤 다시 읽어 검증합니다. 모든 파일의 결과는 catalog.json에 남습니다.
