# ORBIT · 김경순

[홈페이지 열기](https://kenny-0209.github.io/kyeongsoon-orbit/)

연구실 활동, 연구 활동, 개인 작업의 세 가지 테마를 탐색하는 개인 3D 홈페이지입니다. 실제 공간 복원 점군, 장비 모델과 부품 설명, 연구 기록을 포함합니다.

## 구성

- `index.html`, `style.css`, `spatial.css`: 반응형 홈페이지와 세 가지 테마 선택
- `entry.js`, `stage.js`, `gallery.js`, `details.js`: 3D 전시, 모형 상호작용과 상세 기록
- `gear-pc.js`, `gear-input.js`: 장비와 주변기기 모델
- `content.js`, `verified.json`: 공개 소개와 연구 기록
- `assets/`: 공개 사진과 지도. 이미지 재사용 권한은 각 권리자에게 있습니다.
- `clouds/`: 실제 연구 결과의 웹용 경량 점군·복셀 표본
- `models/`: 내려받을 수 있는 GLB 장비 모형과 목록
- `vendor/`: Three.js와 D3, 각 원본 라이선스
- `app.js`, `refine.css`: 이전 화면의 참조 소스로 현재 진입점에서는 실행하지 않습니다.

## 게시

빌드가 필요 없는 정적 사이트입니다. GitHub Pages는 `main`, `/(root)`를 사용하고 `.nojekyll`로 파일을 그대로 제공합니다. 프로젝트 하위 경로에서 동작하는 상대 경로를 유지했습니다.

원본 Sites 게시 버전 2: `d6b4108a167c4e503c4f4c2a0d82f816953fce55`.
비공개 증빙과 운영 자료는 포함하지 않습니다. 외부 개인 서비스에는 별도 로그인이 필요할 수 있습니다.
