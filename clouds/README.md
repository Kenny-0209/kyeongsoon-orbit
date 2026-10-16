# 공개 점군 자산

실제 잠실·마곡1·마곡2 연구 결과를 가벼운 3차원 미리보기로 제공하기 위해 만들었습니다. index.json의 items가 실제 공개 가능한 데이터 목록입니다. 파일 하나는 N개의 XYZ Float32 little-endian 좌표(12N bytes) 뒤 N개의 RGB Uint8 색상(3N bytes)을 저장하며 총 15N bytes입니다. colorByteOffset은 12N이고 positionByteOffset은 0입니다.

모든 좌표는 중앙 정렬과 균일 스케일 후 X축180도 회전으로 오른손 좌표계 Y-up으로 변환했습니다. 원본 좌표·정밀 공사 위치·원본 경로·원본 center/scale은 포함하지 않습니다. sourcePointCount는 실제 원본 점수이고 count는 웹용 표본 점수입니다. RGB가 없는 잠실·마곡2 복셀은 height-color로 명시하여 높이 기반 시각 색상임을 드러냈습니다. 원본 평균 RGB가 있는 마곡1 복셀은 그 RGB를 유지합니다. 복셀의 추가 cubes 파일은 정육면체 표시용 소수 표본이며 전체 복셀의 복제나 재계산 결과가 아닙니다.

