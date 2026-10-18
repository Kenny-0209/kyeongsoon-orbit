# 공개 점군 자산

실제 잠실·마곡1·마곡2 연구 결과를 가벼운 3차원 미리보기로 제공하기 위해 만들었습니다. index.json의 items가 실제 공개 가능한 데이터 목록입니다. 파일 하나는 N개의 XYZ Float32 little-endian 좌표(12N bytes) 뒤 N개의 RGB Uint8 색상(3N bytes)을 저장하며 총 15N bytes입니다. colorByteOffset은 12N이고 positionByteOffset은 0입니다.

모든 좌표는 중앙 정렬과 균일 스케일 후 X축180도 회전으로 오른손 좌표계 Y-up으로 변환했습니다. 원본 좌표·정밀 공사 위치·원본 경로·원본 center/scale은 포함하지 않습니다. sourcePointCount는 실제 원본 점수이고 count는 웹용 표본 점수입니다. RGB가 없는 잠실·마곡2 복셀은 height-color로 명시하여 높이 기반 시각 색상임을 드러냈습니다. 원본 평균 RGB가 있는 마곡1 복셀은 그 RGB를 유지합니다. 복셀의 추가 cubes 파일은 정육면체 표시용 소수 표본이며 전체 복셀의 복제나 재계산 결과가 아닙니다.


## 현장별 공통 표시 좌표

각 item의 alignment.scale과 alignment.translation은 현재 BIN 좌표를 해당 현장 MVS 공통 정규화 좌표로 바꿉니다. 순서는 pSite = pBin * scale + translation입니다. 같은 현장의 모든 방식은 alignment.fitBounds를 카메라 맞춤 범위로 공유합니다. 부모 holder에 변환을 적용하고 그 뒤에 방식별 재중앙화나 개별 확대를 덧붙이지 않아야 합니다. 복셀 cube 표본도 같은 holder 변환을 적용합니다. BIN 데이터 자체는 변경하지 않았습니다. 절대 원점·원래 center/scale·실제 좌표단위·정밀 공사 위치는 공개하지 않습니다.
