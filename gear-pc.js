/**
 * Photo-informed, lightweight hardware models for ORBIT.
 * All groups stand on y=0. Workstation glass faces +Z; front grille faces +X.
 * Geometry is authored here, with no external assets or network requests.
 * Every selectable mesh has userData.gearPart; root.userData.parts is metadata.
 * Transparent glass intentionally lets raycasts reach the internal components.
 */
const URLS = {
  case: 'https://phanteks.com/product/eclipse-p600s-tg-black/',
  cpu: 'https://www.intel.com/content/www/us/en/products/sku/134595/intel-core-i712700kf-processor-25m-cache-up-to-5-00-ghz/specifications.html',
  motherboard: 'https://www.msi.com/Motherboard/MAG-Z690-TOMAHAWK-WIFI-DDR4',
  ram: 'https://www.gskill.com/product/165/166/1536654621/F4-3200C16D-32GTZR',
  gpu: 'https://www.gigabyte.com/Graphics-Card/GV-N309TGAMING-OC-24GD',
  cooler: 'https://support.nzxt.com/hc/en-us/articles/37948576723355-Kraken-X3-Series-Specs',
  ssd: 'https://semiconductor.samsung.com/consumer-storage/internal-ssd/990-pro/',
  jetson: 'https://docs.nvidia.com/jetson/agx-orin-devkit/user-guide/1.0/hardware-layout.html',
  aoc: 'https://www.aoc.com/nz/gaming/monitors/q27g4s',
  samsung: 'https://www.samsung.com/au/business/monitors/high-resolution/s61b-27-inch-ips-qhd-1440p-ls27b610eqexxy/',
};

function kit(THREE, name) {
  const root = new THREE.Group(); root.name = name;
  root.userData.parts = [];
  // Runtime Object3D references must not be serialized by GLTFExporter.
  Object.defineProperty(root.userData, 'rotors', {value: [], enumerable: false});
  const mat = (color, metalness = 0.25, roughness = 0.48, extra = {}) => new THREE.MeshStandardMaterial({color, metalness, roughness, ...extra});
  const m = {
    shell: mat(0x20252c, .6, .36), edge: mat(0x353d48, .65, .36),
    dark: mat(0x0d1015, .15, .66), pcb: mat(0x142121, .22, .72),
    metal: mat(0x88949e, .8, .32), steel: mat(0x4e5965, .8, .3),
    gold: mat(0xc3a251, .75, .38), rubber: mat(0x12161b, .05, .9),
    white: mat(0xe6e8ec, .12, .42),
    cyan: mat(0x5addf8, .12, .32, {emissive: 0x14c6ed, emissiveIntensity: .85}),
    violet: mat(0xd572ff, .1, .32, {emissive: 0xa332e0, emissiveIntensity: .7}),
    lime: mat(0x9ece43, .1, .35, {emissive: 0x619b18, emissiveIntensity: .4}),
    glass: mat(0xacc9df, .05, .12, {transparent: true, opacity: .12, depthWrite: false, side: THREE.DoubleSide}),
  };
  const part = (id, title, description, productUrl = null) => {
    const p = {id, name: title, description, productUrl}; root.userData.parts.push(p); return p;
  };
  function mesh(geometry, material, parent = root, p = null) {
    const item = new THREE.Mesh(geometry, material); item.castShadow = true; item.receiveShadow = true;
    if (p) {item.userData.gearPart = p; item.name = p.id;}
    parent.add(item); return item;
  }
  function box(w, h, d, x, y, z, material = m.shell, parent = root, p = null) {
    const item = mesh(new THREE.BoxGeometry(w, h, d), material, parent, p); item.position.set(x, y, z); return item;
  }
  function cyl(r, h, x, y, z, material = m.shell, parent = root, p = null, segments = 24) {
    const item = mesh(new THREE.CylinderGeometry(r, r, h, segments), material, parent, p); item.position.set(x, y, z); return item;
  }
  function ring(r, tube, x, y, z, material, parent = root, p = null) {
    const item = mesh(new THREE.TorusGeometry(r, tube, 5, 40), material, parent, p); item.position.set(x, y, z); return item;
  }
  function tube(points, radius, material, parent = root, p = null) {
    const curve = new THREE.CatmullRomCurve3(points.map(v => new THREE.Vector3(...v)));
    return mesh(new THREE.TubeGeometry(curve, 24, radius, 7, false), material, parent, p);
  }
  function text(content, w, h, x, y, z, color = '#d5e2eb', parent = root, p = null, bg = 'transparent') {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d'); if (!ctx) return null;
    if (bg !== 'transparent') {ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 128);}
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 45px system-ui, sans-serif'; ctx.fillText(content, 256, 65, 495);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide});
    const item = mesh(new THREE.PlaneGeometry(w, h), material, parent, p); item.castShadow = false; item.position.set(x, y, z); return item;
  }
  function fan(radius, depth, parent, p, glow = null) {
    const assembly = new THREE.Group(); parent.add(assembly);
    const rim = ring(radius, radius * .055, 0, 0, 0, m.edge, assembly, p);
    ring(radius * .86, radius * .018, 0, 0, .02, glow || m.steel, assembly, p);
    const hub = cyl(radius * .23, depth, 0, 0, 0, m.dark, assembly, p); hub.rotation.x = Math.PI / 2;
    const rotor = new THREE.Group(); assembly.add(rotor); root.userData.rotors.push(rotor);
    const shape = new THREE.Shape();
    shape.moveTo(radius * .18, -.04); shape.quadraticCurveTo(radius * .59, -.34 * radius, radius * .86, -.16 * radius);
    shape.quadraticCurveTo(radius * .93, .2 * radius, radius * .57, .27 * radius);
    shape.lineTo(radius * .2, .14 * radius); shape.closePath();
    const bladeGeometry = new THREE.ExtrudeGeometry(shape, {depth: .025, bevelEnabled: false, curveSegments: 4});
    for (let i = 0; i < 7; i++) {const blade = mesh(bladeGeometry, m.steel, rotor, p); blade.rotation.z = i * Math.PI * 2 / 7;}
    for (let i = 0; i < 4; i++) {const spoke = box(radius * 1.82, .045, .05, 0, 0, -.06, m.edge, assembly, p); spoke.rotation.z = i * Math.PI / 2 + Math.PI / 4;}
    return assembly;
  }
  return {THREE, root, m, part, mesh, box, cyl, ring, tube, text, fan};
}

export function createWorkstation(THREE) {
  const k = kit(THREE, 'photo-workstation'); const {root, m, part, box, cyl, ring, tube, text, fan, mesh} = k;
  const shell = part('case', 'Phanteks Eclipse P600S', '사용자가 확인한 케이스입니다. 공식 치수 240 × 520 × 510mm. 실제 사진의 상단 패브릭 메쉬 노출, 양쪽 긴 전면 흡기구와 강화유리 측면을 반영했습니다.', URLS.case);
  const board = part('motherboard', 'MSI MAG Z690 TOMAHAWK WIFI DDR4', 'Windows 장치 조회로 확인한 ATX 메인보드입니다. 검은 PCB, 금속 방열판, DDR4 슬롯과 M.2 장착부를 분리해 표현했습니다.', URLS.motherboard);
  const cpu = part('cpu', 'Intel Core i7-12700KF', '12코어 · 20스레드. CPU 위에 실제 사진과 같은 원형 수랭 펌프가 장착됩니다.', URLS.cpu);
  const cooler = part('cooler', 'NZXT Kraken 수랭 쿨러', '사용자가 NZXT Kraken 제품군으로 확인했습니다. 사진의 원형 발광 링과 냉각 튜브를 반영했으며 정확한 세부 SKU는 미확인입니다.', URLS.cooler);
  const ram = part('ram', 'G.SKILL Trident Z RGB · 32GB', '16GB 모듈 2개 · DDR4-3200. 장치 조회 부품 번호 F4-3200C16-16GTZR와 사진의 두 RGB 메모리를 반영했습니다.', URLS.ram);
  const gpu = part('gpu', 'GIGABYTE GeForce RTX 3090 Ti · 24GB', 'GPU와 24GB VRAM은 장치 조회로 확인했습니다. 사진의 GIGABYTE 표기와 PCI 서브벤더가 일치합니다. GAMING/OC 세부 SKU는 미확인입니다. 공식 링크는 같은 계열 외형 참고 제품입니다.', URLS.gpu);
  const ssd = part('storage', 'Samsung NVMe SSD × 4 + HDD', 'Samsung 980 250GB·1TB, 990 PRO 1TB·2TB, ST2000DM008 2TB. 총 명목 용량 6.25TB. 실제로 가려지는 저장장치는 전시를 위해 일부 보이게 표현했습니다.', URLS.ssd);
  const cooling = part('fans', '메쉬 흡기 · 내부 냉각 팬', '사진의 전면 흡기, 후면 팬과 상단 통풍구를 분리 제작했습니다. 팬 제조사와 모델은 미확인입니다.');
  const power = part('power', '하단 전원 공급 구역', '사진에서 하단 덮개로 가려진 전원 공급 구역입니다. 파워 제품명과 정격 출력은 미확인입니다.');

  // Chassis: the wide glass side is the front-facing +Z surface.
  box(3.85, .16, 2.08, 0, .21, 0, m.shell, root, shell);
  box(3.85, 4.58, .1, 0, 2.58, -1, m.shell, root, shell);
  box(.17, 4.75, 2.08, -1.85, 2.59, 0, m.shell, root, shell);
  box(.2, 4.75, .18, 1.84, 2.59, -.95, m.edge, root, shell);
  box(.2, 4.75, .18, 1.84, 2.59, .95, m.edge, root, shell);
  for (const z of [-.97, .97]) box(3.85, .18, .15, 0, 4.94, z, m.edge, root, shell);
  for (const x of [-1.83, 1.83]) box(.17, .18, 2.08, x, 4.94, 0, m.edge, root, shell);
  for (const x of [-1.42, 1.42]) for (const z of [-.78, .78]) box(.55, .18, .37, x, .085, z, m.rubber, root, shell);

  // Top mesh strips and a restrained illuminated power switch.
  for (let i = 0; i < 25; i++) box(.026, .026, 1.74, -1.62 + i * .135, 4.91, 0, m.steel, root, shell);
  for (let i = 0; i < 10; i++) box(3.37, .02, .025, 0, 4.91, -.81 + i * .18, m.steel, root, shell);
  const powerRing = ring(.092, .014, 1.64, 5.04, .55, m.white, root, shell); powerRing.rotation.x = -Math.PI / 2;
  // Real photograph has angular ribs around the front mesh.
  for (const z of [-.87, .87]) {
    box(.23, 4.55, .13, 1.94, 2.58, z, m.edge, root, shell);
    for (let i = 0; i < 5; i++) {const rib = box(.28, .22, .26, 2.02, .75 + i * .83, z, m.steel, root, shell); rib.rotation.x = z > 0 ? -.44 : .44;}
  }
  for (let i = 0; i < 15; i++) box(.035, 4.36, .017, 1.96, 2.56, -.73 + i * .105, m.edge, root, shell);
  for (let i = 0; i < 20; i++) box(.038, .018, 1.55, 1.97, .47 + i * .218, 0, m.edge, root, shell);

  // Tempered-glass overlay, deliberately excluded from picking.
  const glass = box(3.61, 4.57, .025, -.015, 2.55, 1.04, m.glass, root, shell);
  glass.castShadow = false; glass.renderOrder = 4; glass.raycast = () => {}; glass.userData.pickThrough = true;
  for (const x of [-1.65, 1.65]) for (const y of [.43, 4.66]) {const screw = cyl(.048, .045, x, y, 1.08, m.steel, root, shell, 10); screw.rotation.x = Math.PI / 2;}

  // Board, copper routing hints and separate shields.
  box(2.83, 3.55, .08, -.25, 2.94, -.76, m.pcb, root, board);
  box(.56, 1.37, .24, -1.2, 3.8, -.58, m.edge, root, board);
  box(1.04, .37, .23, -.63, 4.47, -.58, m.edge, root, board);
  for (let i = 0; i < 7; i++) box(.032, 1.19, .045, -1.42 + i * .072, 3.8, -.425, m.steel, root, board);
  box(.9, .62, .17, .54, 1.68, -.58, m.edge, root, board);
  for (let i = 0; i < 9; i++) {
    const cap = cyl(.041, .12, -1.38 + (i % 3) * .16, 2.55 + Math.floor(i / 3) * .23, -.58, m.metal, root, board, 8); cap.rotation.x = Math.PI / 2;
  }
  for (let i = 0; i < 4; i++) box(1.86, .08, .12, -.36, 1.38 + i * .38, -.58, m.dark, root, board);
  for (let i = 0; i < 11; i++) box(.012, .72 + i % 3 * .17, .008, -1.28 + i * .2, 2.35, -.71, m.steel, root, board);
  text('MAG Z690', 1.12, .23, -.73, 4.49, -.43, '#b6c5ce', root, board);

  // CPU lid remains a separate physical mesh underneath the pump.
  box(.74, .83, .08, -.49, 3.7, -.57, m.dark, root, cpu);
  box(.54, .63, .05, -.49, 3.7, -.49, m.metal, root, cpu);
  text('i7-12700KF', 1.1, .2, -.36, 4.16, -.36, '#c8e4ee', root, cpu);
  const pump = cyl(.39, .34, -.49, 3.7, -.15, m.dark, root, cooler, 40); pump.rotation.x = Math.PI / 2;
  const pumpFace = cyl(.345, .018, -.49, 3.7, .033, m.shell, root, cooler, 40); pumpFace.rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) ring(.245 + i * .036, .012, -.49, 3.7, .055 + i * .003, i === 3 ? m.violet : m.white, root, cooler);
  text('NZXT', .44, .17, -.49, 3.7, .088, '#ffffff', root, cooler);
  // Front radiator and the two braided coolant tubes.
  box(.16, 3.52, 1.62, 1.5, 2.8, -.03, m.dark, root, cooler);
  for (let i = 0; i < 20; i++) box(.07, .025, 1.46, 1.39, 1.13 + i * .175, -.03, m.steel, root, cooler);
  tube([[-.12, 3.75, -.05], [.3, 3.42, .35], [.7, 2.65, .53], [1.16, 2.79, .49], [1.4, 4.19, .27]], .055, m.rubber, root, cooler);
  tube([[-.1, 3.55, -.02], [.25, 3.2, .38], [.55, 2.42, .56], [1.21, 2.56, .52], [1.4, 3.98, .22]], .055, m.rubber, root, cooler);

  // Two individually selectable RAM sticks, alternating cyan/violet diffusers.
  for (let i = 0; i < 2; i++) {
    const x = .55 + i * .29;
    box(.12, 1.66, .13, x, 3.58, -.55, m.dark, root, ram);
    box(.09, 1.55, .2, x, 3.58, -.38, m.steel, root, ram);
    for (let j = 0; j < 6; j++) box(.115, .225, .09, x, 2.97 + j * .245, -.215, (j + i) % 2 ? m.cyan : m.violet, root, ram);
    for (const y of [2.72, 4.44]) box(.2, .1, .18, x, y, -.56, m.edge, root, ram);
  }

  // Long triple-fan GPU: black/silver segmented shroud, exposed fin stack,
  // metal backplate and a GIGABYTE accent matching the supplied photograph.
  const card = new THREE.Group(); root.add(card); card.position.set(-.2, 2.2, .02);
  box(2.86, .1, .91, 0, .31, -.04, m.dark, card, gpu);
  box(2.85, .34, .94, 0, .05, -.04, m.steel, card, gpu);
  for (let i = 0; i < 30; i++) box(.022, .34, .89, -1.35 + i * .093, .05, -.04, m.metal, card, gpu);
  box(2.92, .12, .98, 0, -.17, -.04, m.shell, card, gpu);
  box(2.92, .44, .08, 0, .04, .46, m.edge, card, gpu);
  for (let i = 0; i < 3; i++) {
    const subfan = fan(.385, .06, card, gpu); subfan.position.set(-.98 + i * .98, -.247, -.03); subfan.rotation.x = Math.PI / 2;
  }
  for (const x of [-1.4, -.47, .47, 1.4]) {const brace = box(.14, .49, .09, x, .045, .52, m.metal, card, gpu); brace.rotation.z = x > 0 ? -.35 : .35;}
  box(1.65, .04, .028, .28, .17, .513, m.cyan, card, gpu);
  text('GEFORCE RTX', 1.34, .16, -.62, .045, .522, '#dfe7ed', card, gpu);
  text('GIGABYTE', .95, .17, .79, .045, .53, '#b9edff', card, gpu);
  text('RTX 3090 Ti · 24GB', 1.95, .22, -.22, 1.8, .69, '#c6d9e6', root, gpu);
  box(.11, .8, .16, 1.14, 1.63, .33, m.steel, root, gpu);
  for (let i = 0; i < 3; i++) tube([[.79 + i * .12, 2.41, .24], [1.07 + i * .11, 2.34, .55], [1.19 + i * .08, 1.65, .72], [.75, .91, .6]], .032, m.rubber, root, gpu);

  // M.2 and lower drive bay, visible enough to select in the portfolio.
  for (let i = 0; i < 2; i++) {
    box(.86, .25, .06, -.72 + i * 1.18, 1.49, -.42, m.pcb, root, ssd);
    box(.7, .18, .025, -.72 + i * 1.18, 1.49, -.374, m.dark, root, ssd);
  }
  text('990 PRO', .66, .13, -.72, 1.49, -.35, '#d9dadb', root, ssd);
  box(3.5, .65, 1.75, -.08, .7, -.02, m.shell, root, power);
  text('RESEARCH WORKSTATION', 2.4, .22, -.13, .73, .873, '#98b1c0', root, power);
  box(.98, .24, .9, .61, .84, -.34, m.metal, root, ssd);

  // Front and rear fans; animation is optional via root.userData.rotors.
  for (let i = 0; i < 3; i++) {const f = fan(.66, .09, root, cooling, i % 2 ? m.violet : m.cyan); f.position.set(1.67, 1.16 + i * 1.35, 0); f.rotation.y = Math.PI / 2;}
  const rear = fan(.53, .08, root, cooling); rear.position.set(-1.73, 4.02, .03); rear.rotation.y = Math.PI / 2;
  // Semantic groups make the assembled model suitable for a reversible
  // exploded view without relying on mesh names or geometry internals.
  const explode = {case: [0, .18, -1.5], motherboard: [-.15, .1, -.45], cpu: [-.35, .3, .8], cooler: [-.3, .65, 1.25], ram: [.4, .25, 1.2], gpu: [0, -.35, 1.65], storage: [.35, -.1, .85], fans: [1.25, 0, 0], power: [-.25, -.25, .3]};
  const groups = new Map();
  for (const p of root.userData.parts) {const g = new THREE.Group(); g.name = 'part-' + p.id; g.userData.gearPart = p; g.userData.explode = explode[p.id] || [0, 0, 0]; groups.set(p.id, g);}
  for (const child of [...root.children]) {
    let p = child.userData.gearPart;
    if (!p) child.traverse(o => {if (!p && o.userData.gearPart) p = o.userData.gearPart;});
    if (p && groups.has(p.id)) groups.get(p.id).add(child);
  }
  const form = new THREE.Group(); form.name = 'p600s-proportions'; form.scale.set(1.17, 1, 1.07);
  for (const g of groups.values()) form.add(g); root.add(form);
  Object.defineProperty(root.userData, 'partGroups', {value: [...groups.values()], enumerable: false});
  root.userData.dimensions = {width: 4.87, height: 5.06, depth: 2.31};
  root.userData.physicalDimensionsMm = {width: 240, height: 520, depth: 510};
  root.userData.reference = '사용자가 제공한 실제 본체 사진 + 장치 조회 + 제조사 제품 사진';
  return root;
}

export function createJetson(THREE) {
  const k = kit(THREE, 'jetson-agx-orin'); const {root, m, part, box, cyl, ring, text, fan} = k;
  const casing = part('jetson-case', 'NVIDIA Jetson AGX Orin', 'NVIDIA 공식 개발 키트 사진의 은색 슬롯 커버, 정사각 본체와 하단 포트를 재현했습니다. 장치 기록 기준 64GB급 통합 메모리 · L4T 36.4.7.', URLS.jetson);
  const sink = part('jetson-cooling', '상단 팬 · 슬릿형 방열 커버', '공식 실물 사진처럼 상단 팬 위에 일정한 간격의 은색 슬릿을 배치했습니다.', URLS.jetson);
  const io = part('jetson-io', 'USB · DisplayPort · Ethernet · 40핀', '공식 Hardware Layout의 양쪽 I/O 구성을 참고했습니다. 네트워크 주소와 장치 식별자는 공개하지 않습니다.', URLS.jetson);
  box(2.18, .25, 2.1, 0, .22, 0, m.dark, root, casing);
  box(2.15, .72, .12, 0, .67, -1.02, m.metal, root, casing);
  box(.12, .72, 2.12, -1.03, .67, 0, m.metal, root, casing);
  // Open top: the black fan is visible through metal slats.
  box(2.12, .11, .28, 0, 1.03, -.88, m.metal, root, casing);
  box(2.12, .11, .12, 0, 1.03, .99, m.metal, root, casing);
  box(.1, .11, 1.9, -1.04, 1.03, .04, m.metal, root, casing);
  box(.1, .11, 1.9, 1.04, 1.03, .04, m.metal, root, casing);
  const rotor = fan(.77, .06, root, sink); rotor.position.set(0, .91, .03); rotor.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 23; i++) box(.033, .055, 1.63, -.95 + i * .086, 1.03, .11, m.metal, root, sink);
  // Side ventilation slots and black lower connector row.
  for (let i = 0; i < 10; i++) box(.1, .035, 1.85, 1.04, .48 + i * .052, .01, m.metal, root, sink);
  for (let i = 0; i < 10; i++) box(1.86, .035, .08, 0, .48 + i * .052, 1.015, m.metal, root, sink);
  box(2.1, .22, .06, 0, .31, 1.04, m.dark, root, io);
  for (let i = 0; i < 2; i++) {
    box(.31, .18, .16, -.28 + i * .39, .34, 1.08, m.metal, root, io);
    box(.24, .11, .02, -.28 + i * .39, .35, 1.173, m.dark, root, io);
  }
  box(.32, .23, .15, -.73, .32, 1.08, m.metal, root, io);
  box(.23, .14, .02, -.73, .32, 1.17, m.dark, root, io);
  box(.33, .13, .15, .62, .32, 1.08, m.metal, root, io);
  box(.24, .07, .03, .62, .32, 1.17, m.dark, root, io);
  // Other side: GPIO header and two additional USB sockets.
  box(.07, .12, 1.07, 1.08, .32, -.21, m.dark, root, io);
  for (let i = 0; i < 20; i++) for (let j = 0; j < 2; j++) box(.025, .025, .025, 1.122, .29 + j * .065, -.7 + i * .05, m.gold, root, io);
  for (let i = 0; i < 2; i++) box(.13, .14, .29, 1.09, .32, .57 + i * .31, m.metal, root, io);
  for (let i = 0; i < 3; i++) {const b = cyl(.045, .034, -1.1, .34, -.57 + i * .19, m.shell, root, io); b.rotation.z = Math.PI / 2;}
  const led = cyl(.018, .025, -1.11, .34, .14, m.white, root, io); led.rotation.z = Math.PI / 2;
  text('NVIDIA · JETSON AGX ORIN', 1.88, .19, 0, .65, -1.091, '#d4dfcf', root, casing);
  const badge = text('NVIDIA', .7, .16, 0, 1.095, -.88, '#344237', root, casing); if (badge) badge.rotation.x = -Math.PI / 2;
  for (const x of [-.87, .87]) for (const z of [-.82, .82]) cyl(.09, .08, x, .055, z, m.rubber, root, casing, 12);
  root.userData.dimensions = {width: 2.25, height: 1.1, depth: 2.35};
  root.userData.reference = URLS.jetson;
  return root;
}

function monitorScreen(THREE, spec) {
  if (spec.screenTexture) return spec.screenTexture;
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = 1024; c.height = 576;
  const x = c.getContext('2d'); if (!x) return null;
  const gradient = x.createLinearGradient(0, 0, 1024, 576); gradient.addColorStop(0, '#102e44'); gradient.addColorStop(.55, '#101a31'); gradient.addColorStop(1, '#392042');
  x.fillStyle = gradient; x.fillRect(0, 0, 1024, 576);
  x.strokeStyle = '#39616e'; x.lineWidth = 1;
  for (let i = 0; i < 18; i++) {x.beginPath(); x.moveTo(0, 200 + i * 35); x.lineTo(1024, 200 + i * 35); x.stroke();}
  x.fillStyle = '#75e5ee'; x.font = '600 32px system-ui'; x.fillText('RESEARCH / CODE / CREATE', 57, 73);
  x.fillStyle = '#e2eaf1'; x.font = '500 55px system-ui'; x.fillText('ORBIT WORKSPACE', 57, 162);
  for (let i = 0; i < 3; i++) {
    x.fillStyle = ['#163747', '#23303f', '#372b46'][i]; x.fillRect(57 + i * 310, 240, 280, 240);
    x.strokeStyle = ['#5fcbd7', '#9f83cb', '#afc5d0'][i]; x.strokeRect(57 + i * 310, 240, 280, 240);
    x.fillStyle = '#bfd4dd'; x.font = '26px system-ui'; x.fillText(['PANORAMA → BIM', 'SPATIAL DATA', 'INTERACTIVE TOOLS'][i], 74 + i * 310, 281);
    x.fillStyle = '#7394a9'; x.font = '19px monospace'; for (let j = 0; j < 5; j++) x.fillText(['const scene = create();', 'await reconstruct();', 'render(ideas);'][i], 74 + i * 310, 331 + j * 27);
  }
  const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

export function createMonitor(THREE, spec = {}) {
  const k = kit(THREE, 'monitor-' + (spec.name || '27-inch')); const {root, m, part, box, cyl, text, mesh} = k;
  const brand = spec.brand || (/AOC/i.test(spec.name || '') ? 'AOC' : /Samsung|LS27|S61B/i.test(spec.name || '') ? 'SAMSUNG' : 'PANTHEON');
  const name = spec.name || '27형 QHD 모니터';
  const productUrl = spec.productUrl || (brand === 'AOC' ? URLS.aoc : brand === 'SAMSUNG' ? URLS.samsung : 'https://www.raeantech.co.kr/raeantech');
  const p = part('monitor-' + name, name, spec.description || '연결된 장치의 EDID에서 확인한 27형급 디스플레이입니다. 얇은 베젤과 실제 제품 계열의 받침 형태를 참고했습니다.', productUrl);
  const w = spec.width || 4.4, h = spec.height || w * 9 / 16;
  const screenY = h / 2 + .86;
  const display = new THREE.Group(); root.add(display); display.position.y = screenY;
  if (spec.portrait) display.rotation.z = Math.PI / 2;
  box(w + .1, h + .15, .18, 0, 0, 0, m.shell, display, p);
  box(w + .035, h + .07, .035, 0, .018, .105, m.dark, display, p);
  const texture = monitorScreen(THREE, spec);
  const screenMat = new THREE.MeshBasicMaterial({map: texture, color: texture ? 0xffffff : 0x244455});
  const screen = mesh(new THREE.PlaneGeometry(w - .075, h - .075), screenMat, display, p); screen.position.set(0, .025, .127); screen.castShadow = false;
  text(brand, .61, .11, 0, -h / 2 - .025, .132, '#9ca8b4', display, p);
  // AOC: angular gaming footprint. Samsung: rectangular pivot stand.
  const stemHeight = .91;
  box(.24, stemHeight, .25, 0, .57, -.13, m.edge, root, p);
  const hinge = cyl(.16, .35, 0, screenY - .17, -.2, m.shell, root, p); hinge.rotation.z = Math.PI / 2;
  if (brand === 'AOC') {
    for (const side of [-1, 1]) {const foot = box(1.31, .085, .2, side * .47, .08, .17, m.edge, root, p); foot.rotation.y = side * .49;}
    box(.18, .06, .57, 0, .08, -.36, m.dark, root, p);
    const trim = box(.11, .63, .025, 0, .53, -.271, m.violet, root, p); trim.userData.decorative = true;
  } else if (brand === 'SAMSUNG') {
    box(1.8, .075, .97, 0, .08, .07, m.steel, root, p);
    box(.17, .81, .15, 0, .57, -.13, m.metal, root, p);
  } else {
    const foot = cyl(.79, .07, 0, .08, .05, m.edge, root, p, 40); foot.scale.z = .61;
  }
  const led = box(.035, .016, .013, w / 2 - .13, -h / 2 - .026, .133, m.cyan, display, p); led.castShadow = false;
  // Rear VESA mount and shallow cable channel are separate selectable meshes.
  box(.54, .55, .07, 0, screenY - .1, -.135, m.dark, root, p);
  root.userData.dimensions = {width: w + .1, height: screenY + h / 2 + .09, depth: 1.1};
  Object.defineProperty(root.userData, 'screen', {value: screen, enumerable: false});
  root.userData.spec = {name, brand, productUrl, diagonalInches: spec.diagonalInches || 27};
  return root;
}
