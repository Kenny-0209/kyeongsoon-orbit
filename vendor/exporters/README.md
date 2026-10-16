# glTF 내보내기 도구

이 폴더는 ORBIT에서 직접 작성한 장비 지오메트리를 독립 GLB 파일로 저장하기 위해 생성했습니다. GLTFExporter.js는 Three.js 0.180.0 공식 배포 파일을 원문 그대로 보관한 것입니다.

출처: https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/exporters/GLTFExporter.js

Three.js MIT 라이선스는 상위 vendor/THREE-LICENSE.txt에 있습니다. 현재 버전은 상위에 보관한 three.module.js 외에 상대 경로 utils 의존성이 필요하지 않습니다. 일반 웹 장면에서는 이 exporter를 불러오지 않고, tools/exportgear.mjs의 Node CPU 저장 단계에서만 사용합니다. 출력물은 dist/models 폴더에 분리합니다.
