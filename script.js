import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/libs/meshopt_decoder.module.js";

const app = document.querySelector(".app");
const entryScreen = document.querySelector("#entryScreen");
const entryCanvas = document.querySelector("#entryCanvas");
const entryGestureButton = document.querySelector("#entryGestureButton");
const entryGestureStatus = document.querySelector("#entryGestureStatus");
const modelStage = document.querySelector("#modelStage");
const canvas = document.querySelector("#relicCanvas");
const modelPreview = document.querySelector("#modelPreview");
const modelLoading = document.querySelector("#modelLoading");
const modelLoadingDetail = document.querySelector("#modelLoadingDetail");
const hudTop = document.querySelector("#hudTop");
const hudLeft = document.querySelector("#hudLeft");
const hudCode = document.querySelector("#hudCode");
const hudTitle = document.querySelector("#hudTitle");
const hudText = document.querySelector("#hudText");
const buttons = [...document.querySelectorAll("[data-key]")];
const progressText = document.querySelector("#progressText");
const progressFill = document.querySelector("#progressFill");
const sceneKicker = document.querySelector("#sceneKicker");
const sceneTitle = document.querySelector("#sceneTitle");
const sceneText = document.querySelector("#sceneText");
const detailFeature = document.querySelector("#detailFeature");
const detailTranslate = document.querySelector("#detailTranslate");
const annotationLabel = document.querySelector("#annotationLabel");
const reportGrid = document.querySelector("#reportGrid");
const resetButton = document.querySelector("#resetButton");
const inspectorToggle = document.querySelector("#inspectorToggle");
const knowledgeToggle = document.querySelector("#knowledgeToggle");
const gestureToggle = document.querySelector("#gestureToggle");
const gesturePanel = document.querySelector("#gesturePanel");
const gestureVideo = document.querySelector("#gestureVideo");
const gestureCanvas = document.querySelector("#gestureCanvas");
const gestureName = document.querySelector("#gestureName");
const gestureStatus = document.querySelector("#gestureStatus");
const gestureGuideItems = [...document.querySelectorAll("[data-gesture-guide]")];

const scenes = {
  1: {
    id: "outline",
    kicker: "KEY 1 / FORM",
    title: "杏形轮廓",
    text: "模型正对观察台，直接查看 Tripo 生成的整体轮廓。",
    feature: "外形特征",
    translate: "由八块杏形金薄片组成，轮廓信息对应金片单元的边界。",
    annotation: "正面观察：查看整体杏形和浮雕分布",
    code: "FORM-01",
    hud: "外缘闭合曲线标记杏形金薄片边界。该类金片原缀于南越王玉衣面罩丝巾之上，边界用于理解其组合方式。",
    rotation: [-0.06, 0, 0],
    zoom: 0.94,
  },
  2: {
    id: "foil",
    kicker: "KEY 2 / MATERIAL",
    title: "金箔薄片",
    text: "模型轻微转向，观察金叶薄片边缘和整体外轮廓。",
    feature: "材质特征",
    translate: "金片为薄金属片，侧缘显示金箔薄片与浮雕起伏的差异。",
    annotation: "斜侧观察：外轮廓线稿贴近模型表面",
    code: "MAT-02",
    hud: "侧缘线追踪金箔厚度。丝巾已朽烂而金饰保存，使薄片材质成为判断佩缀方式的重要依据。",
    rotation: [-0.05, 0.38, 0],
    zoom: 0.96,
  },
  3: {
    id: "relief",
    kicker: "KEY 3 / CRAFT",
    title: "锤鍱纹理",
    text: "斜向光照扫过模型，凸起纹理随光线显影。",
    feature: "工艺特征",
    translate: "凸起线条对应锤鍱工艺形成的浮雕高差。",
    annotation: "斜光下查看浮雕高差",
    code: "CRAFT-03",
    hud: "细框锁定锤鍱形成的弧形肋纹。线条不是装饰轮廓，而是在读取金片表面的敲压痕迹。",
    rotation: [-0.32, 0.34, -0.04],
    zoom: 1.08,
  },
  4: {
    id: "ram",
    kicker: "KEY 4 / MOTIF",
    title: "羊头纹",
    text: "镜头靠近上方羊头纹，观察尖角、眼窝、鼻梁和兽面结构。",
    feature: "纹样特征",
    translate: "装饰图案为两个尖角羊头纹，羊头纹饰两两相背。",
    annotation: "特写观察：羊头纹是模型主体",
    code: "MOTIF-04",
    hud: "顶部细线标注尖角羊头纹。尖角、眼窝与鼻梁构成识别点，并与草原文化纹饰发生联系。",
    rotation: [-0.18, -0.12, 0],
    zoom: 1.18,
  },
  5: {
    id: "symmetry",
    kicker: "KEY 5 / STRUCTURE",
    title: "双羊相背",
    text: "模型回到正面，查看中轴两侧的对称关系。",
    feature: "结构特征",
    translate: "中轴组织左右两组羊头，使双羊相背的结构变得清晰。",
    annotation: "沿中轴观察，左右纹样形成稳定秩序",
    code: "STRUCT-05",
    hud: "中轴线将左右浮雕分为相背的两组羊头。对称关系提示金片图案并非单个兽面，而是双羊结构。",
    rotation: [-0.04, 0, 0],
    zoom: 1,
  },
};

const observed = new Set();
const MODEL_FRONT_OFFSET_Y = -Math.PI / 2;
const VISION_VERSION = "0.10.35";
const GESTURE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-tasks/gesture_recognizer/gesture_recognizer.task";
const ENTRY_LEAF_SCALE = 0.78;
const MODEL_MAX_LOAD_ATTEMPTS = 3;
const targetRotation = new THREE.Euler(-0.08, 0.16, 0);
const currentRotation = new THREE.Euler(-0.08, 0.16, 0);

let renderer;
let scene;
let camera;
let entryRenderer;
let entryScene;
let entryCamera;
let entryParticleRoot;
let entryLeafRoot;
let entrySelectedLeaf;
let entryClock = new THREE.Clock();
const entryLeafObjects = [];
const entryRaycaster = new THREE.Raycaster();
const entryPointer = new THREE.Vector2();
let relicRoot;
let modelPivot;
let annotationRoot;
let lineOverlayRoot;
let scanRoot;
let flowRoot;
const overlayVideos = new Map();
let resetTimer = 0;
const activePointers = new Map();
let isDragging = false;
let startX = 0;
let startY = 0;
let gestureStartDistance = 0;
let gestureStartAngle = 0;
let gestureStartZoom = 1;
let gestureStartRotationZ = 0;
let gestureHadMultiplePointers = false;
let swipeStartX = 0;
let swipeStartY = 0;
let swipeStartTime = 0;
let targetZoom = 1;
let currentZoom = 1;
let gestureRecognizer;
let gestureStream;
let gestureRunning = false;
let gestureLoopId = 0;
let lastGestureVideoTime = -1;
let lastGestureActionAt = 0;
let lastGestureLabel = "";
let lastIndexX = null;
let lastIndexMoveAt = 0;
let entryFistPrimed = false;
let entryActive = true;

function syncLineOverlayFacing() {
  if (!lineOverlayRoot || !modelPivot) return;
  const sideways = Math.abs(modelPivot.rotation.y);
  const compensation = THREE.MathUtils.clamp(modelPivot.rotation.y * -0.35, -0.26, 0.26);
  lineOverlayRoot.rotation.y = sideways > 0.22 ? compensation : 0;
}

function updateProgress() {
  const count = observed.size;
  const total = buttons.length;
  progressText.textContent = `已观察 ${count}/${total}`;
  progressFill.style.width = `${(count / total) * 100}%`;

  buttons.forEach((button) => {
    const done = observed.has(button.dataset.key);
    button.classList.toggle("is-done", done);
    button.querySelector("em").textContent = done ? "已观察" : "未观察";
  });

  if (count === total) {
    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(showReport, 900);
  }
}

function setTarget(rotation, zoom = 1) {
  targetRotation.set(rotation[0], rotation[1], rotation[2]);
  targetZoom = zoom;
}

function setPanelState(name, open) {
  app.dataset[name] = open ? "open" : "closed";
  if (name === "inspector") {
    inspectorToggle.textContent = open ? "收起观察清单" : "展开观察清单";
    inspectorToggle.setAttribute("aria-expanded", String(open));
  }
  if (name === "knowledge") {
    knowledgeToggle.textContent = open ? "收起文物资料" : "展开文物资料";
    knowledgeToggle.setAttribute("aria-expanded", String(open));
  }
  requestAnimationFrame(resizeRenderer);
}

function enterObservatory(selectedLeaf = null) {
  if (!entryActive) return;
  entryActive = false;
  entryScreen.classList.add("is-zooming");
  entrySelectedLeaf = selectedLeaf;
  window.setTimeout(() => {
    app.dataset.entry = "open";
    resizeRenderer();
  }, 520);
  window.setTimeout(() => {
    entryScreen.setAttribute("aria-hidden", "true");
  }, 980);
}

function createEntryParticles() {
  const random = seededRandom(20260610);
  const vertices = [];
  const colors = [];
  const color = new THREE.Color();

  for (let i = 0; i < 2200; i += 1) {
    const radius = 1.45 + random() * 7.1;
    const angle = random() * Math.PI * 2 + radius * 0.34;
    const ringNoise = (random() - 0.5) * 0.52;
    const x = Math.cos(angle) * (radius + ringNoise) * 1.08;
    const y = Math.sin(angle) * (radius + ringNoise) * 0.34 + (random() - 0.5) * 0.28;
    const z = -2.7 + Math.sin(angle * 1.4) * 0.3 - random() * 2.6;
    vertices.push(x, y, z);
    const tone = 0.28 + random() * 0.5;
    color.setRGB(tone, tone, tone * 0.96);
    colors.push(color.r, color.g, color.b);
  }

  for (let i = 0; i < 360; i += 1) {
    const radius = 3.6 + random() * 7.2;
    const angle = random() * Math.PI * 2;
    vertices.push(Math.cos(angle) * radius, (random() - 0.5) * 4.4, Math.sin(angle) * radius - 4.2);
    const tone = 0.2 + random() * 0.36;
    color.setRGB(tone, tone, tone);
    colors.push(color.r, color.g, color.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.014,
    vertexColors: true,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
  });
  entryParticleRoot = new THREE.Points(geometry, material);
  entryScene.add(entryParticleRoot);
}

function makeEntryLeaf(source, config) {
  const leaf = source.clone(true);
  leaf.traverse((child) => {
    if (!child.isMesh) return;
    child.material = new THREE.MeshStandardMaterial({
      color: 0x9a7400,
      metalness: 0.44,
      roughness: 0.58,
      envMapIntensity: 0.28,
    });
  });

  const box = new THREE.Box3().setFromObject(leaf);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  leaf.position.sub(center);
  leaf.scale.setScalar((config.scale * ENTRY_LEAF_SCALE) / Math.max(size.x, size.y, size.z));
  leaf.rotation.set(config.rotation[0], MODEL_FRONT_OFFSET_Y + config.rotation[1], config.rotation[2]);

  const group = new THREE.Group();
  group.position.set(config.position[0], config.position[1], config.position[2]);
  group.add(leaf);
  group.userData.baseY = config.position[1];
  group.userData.floatSpeed = config.floatSpeed;
  group.userData.floatPhase = config.floatPhase;
  group.userData.entryLeaf = true;
  entryLeafRoot.add(group);
  entryLeafObjects.push(group);
}

function loadEntryLeaves() {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const configs = [
    { position: [-3.6, 1.35, -2.4], scale: 1.08, rotation: [-0.12, -0.35, 0.18], floatSpeed: 0.7, floatPhase: 0.2 },
    { position: [-1.35, 2.0, -3.1], scale: 0.88, rotation: [-0.05, 0.18, -0.12], floatSpeed: 0.84, floatPhase: 1.4 },
    { position: [1.52, 1.65, -2.7], scale: 1.02, rotation: [-0.16, -0.18, 0.08], floatSpeed: 0.76, floatPhase: 2.1 },
    { position: [3.65, 0.38, -3.2], scale: 0.82, rotation: [-0.08, 0.32, -0.18], floatSpeed: 0.92, floatPhase: 3.0 },
    { position: [2.6, -1.58, -2.45], scale: 0.94, rotation: [-0.18, -0.28, 0.2], floatSpeed: 0.74, floatPhase: 4.3 },
    { position: [0.0, -2.0, -2.9], scale: 1.06, rotation: [-0.06, 0.1, -0.06], floatSpeed: 0.82, floatPhase: 5.2 },
    { position: [-2.62, -1.45, -2.5], scale: 0.9, rotation: [-0.14, 0.24, 0.16], floatSpeed: 0.78, floatPhase: 6.1 },
    { position: [0.02, -0.12, -1.85], scale: 1.34, rotation: [-0.1, 0, 0], floatSpeed: 0.68, floatPhase: 2.8 },
  ];

  loader.load(canvas.dataset.model, (gltf) => {
    configs.forEach((config) => makeEntryLeaf(gltf.scene, config));
  });
}

function initEntryRenderer() {
  entryScene = new THREE.Scene();
  entryCamera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  entryCamera.position.set(0, 0, 5.9);
  entryRenderer = new THREE.WebGLRenderer({ canvas: entryCanvas, antialias: true, alpha: true });
  entryRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  entryRenderer.outputColorSpace = THREE.SRGBColorSpace;
  entryRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  entryRenderer.toneMappingExposure = 0.72;

  entryScene.add(new THREE.HemisphereLight(0xf5f5f2, 0x101111, 0.72));
  const key = new THREE.DirectionalLight(0xffffff, 1.34);
  key.position.set(-2.8, 3.2, 4.8);
  entryScene.add(key);
  const rim = new THREE.DirectionalLight(0xd7d2bd, 0.58);
  rim.position.set(3.5, -0.8, -2.4);
  entryScene.add(rim);

  entryLeafRoot = new THREE.Group();
  entryScene.add(entryLeafRoot);
  createEntryParticles();
  loadEntryLeaves();
  resizeEntryRenderer();
}

function resizeEntryRenderer() {
  if (!entryRenderer) return;
  const width = Math.max(320, entryScreen.clientWidth);
  const height = Math.max(320, entryScreen.clientHeight);
  entryRenderer.setSize(width, height, false);
  entryCamera.aspect = width / height;
  entryCamera.updateProjectionMatrix();
}

function pickEntryLeaf(event) {
  if (!entryActive || !entryLeafObjects.length) return null;
  const rect = entryCanvas.getBoundingClientRect();
  entryPointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  entryPointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  entryRaycaster.setFromCamera(entryPointer, entryCamera);
  const hits = entryRaycaster.intersectObjects(entryLeafObjects, true);
  if (!hits.length) return null;
  let target = hits[0].object;
  while (target && !target.userData.entryLeaf) {
    target = target.parent;
  }
  return target;
}

function animateEntryScene(elapsed) {
  if (!entryRenderer) return;
  if (entryParticleRoot) {
    entryParticleRoot.rotation.z = elapsed * 0.012;
    entryParticleRoot.rotation.y = Math.sin(elapsed * 0.07) * 0.08;
  }
  if (entryLeafRoot && entryActive) {
    entryLeafRoot.rotation.z = Math.sin(elapsed * 0.04) * 0.015;
  }
  entryLeafObjects.forEach((leaf, index) => {
    if (leaf === entrySelectedLeaf) {
      leaf.position.lerp(new THREE.Vector3(0, 0, 2.55), 0.08);
      leaf.scale.lerp(new THREE.Vector3(7.8, 7.8, 7.8), 0.08);
      leaf.rotation.z += 0.018;
      return;
    }
    if (!entryActive) {
      leaf.scale.lerp(new THREE.Vector3(0.05, 0.05, 0.05), 0.08);
      return;
    }
    leaf.position.y = leaf.userData.baseY + Math.sin(elapsed * leaf.userData.floatSpeed + leaf.userData.floatPhase) * 0.08;
    leaf.rotation.z += 0.002 + index * 0.0001;
  });
  entryRenderer.render(entryScene, entryCamera);
}

function getGestureMetrics() {
  const points = [...activePointers.values()];
  if (points.length < 2) return null;
  const [a, b] = points;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return {
    distance: Math.hypot(dx, dy),
    angle: Math.atan2(dy, dx),
  };
}

function beginTwoFingerGesture() {
  const metrics = getGestureMetrics();
  if (!metrics) return;
  gestureStartDistance = metrics.distance;
  gestureStartAngle = metrics.angle;
  gestureStartZoom = targetZoom;
  gestureStartRotationZ = targetRotation.z;
}

function moveToScene(offset) {
  const activeButton = buttons.find((button) => button.classList.contains("is-active"));
  const current = activeButton ? Number(activeButton.dataset.key) : 0;
  const total = buttons.length;
  const next = ((current + offset + total - 1) % total) + 1;
  playScene(String(next));
}

function maybeSwipeToScene(endX, endY) {
  if (gestureHadMultiplePointers) return;
  const dx = endX - swipeStartX;
  const dy = endY - swipeStartY;
  const elapsed = performance.now() - swipeStartTime;
  if (elapsed > 520 || Math.abs(dx) < 76 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
  moveToScene(dx < 0 ? 1 : -1);
}

function setGestureReadout(name, status) {
  gestureName.textContent = name;
  gestureStatus.textContent = status;
}

function setActiveGestureGuide(label) {
  gestureGuideItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.gestureGuide === label);
  });
}

function canRunGestureAction(label, now) {
  if (label !== lastGestureLabel) {
    lastGestureLabel = label;
    lastGestureActionAt = 0;
  }
  if (now - lastGestureActionAt < 1000) return false;
  lastGestureActionAt = now;
  return true;
}

function getHandCenter(landmarks) {
  if (!landmarks?.length) return null;
  const sum = landmarks.reduce(
    (total, point) => {
      total.x += point.x;
      total.y += point.y;
      return total;
    },
    { x: 0, y: 0 },
  );
  return {
    x: sum.x / landmarks.length,
    y: sum.y / landmarks.length,
  };
}

function getIndexDirection(landmarks) {
  if (!landmarks?.[5] || !landmarks?.[8]) return null;
  const base = landmarks[5];
  const tip = landmarks[8];
  const dx = tip.x - base.x;
  const dy = tip.y - base.y;
  const length = Math.hypot(dx, dy);
  if (length < 0.08) return null;
  if (Math.abs(dy) < 0.11 || Math.abs(dy) < Math.abs(dx) * 0.62) return "move";
  return dy < 0 ? "up" : "down";
}

function rotateModelFromIndex(landmarks, now) {
  if (!landmarks?.[8]) return;
  const mirroredX = 1 - landmarks[8].x;
  if (lastIndexX === null) {
    lastIndexX = mirroredX;
    lastIndexMoveAt = now;
    return;
  }
  const delta = mirroredX - lastIndexX;
  lastIndexX = mirroredX;
  if (now - lastIndexMoveAt < 32 || Math.abs(delta) < 0.008) return;
  lastIndexMoveAt = now;
  targetRotation.y += THREE.MathUtils.clamp(delta * 2.2, -0.045, 0.045);
  targetRotation.x = THREE.MathUtils.clamp(targetRotation.x, -0.9, 0.9);
}

function drawGestureOverlay(landmarks, mode) {
  const context = gestureCanvas.getContext("2d");
  const width = gestureCanvas.width;
  const height = gestureCanvas.height;
  context.clearRect(0, 0, width, height);

  context.strokeStyle = "rgba(238, 242, 238, 0.32)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(width / 2, 0);
  context.lineTo(width / 2, height);
  context.moveTo(0, height / 2);
  context.lineTo(width, height / 2);
  context.stroke();

  if (!landmarks?.length) return;
  context.fillStyle = "rgba(214, 75, 70, 0.96)";
  landmarks.forEach((point) => {
    context.beginPath();
    context.arc((1 - point.x) * width, point.y * height, 3.2, 0, Math.PI * 2);
    context.fill();
  });

  if (!mode) return;
  context.fillStyle = "rgba(214, 75, 70, 0.28)";
  if (mode === "up") context.fillRect(0, 0, width, height / 2);
  if (mode === "down") context.fillRect(0, height / 2, width, height / 2);
}

function handleGestureResult(result, now) {
  const gesture = result.gestures?.[0]?.[0];
  const landmarks = result.landmarks?.[0];
  const label = gesture?.categoryName || "None";
  const score = gesture?.score || 0;

  if (entryActive) {
    if (!gesture || score < 0.62) {
      entryGestureStatus.textContent = entryFistPrimed ? "松开手指即可进入" : "把手放入画面中央";
      return;
    }
    if (label === "Closed_Fist") {
      entryFistPrimed = true;
      entryGestureStatus.textContent = "已识别握拳，松开手指进入";
      return;
    }
    if (entryFistPrimed && (label === "Open_Palm" || label === "Pointing_Up")) {
      entryGestureStatus.textContent = "正在进入观察台";
      enterObservatory(entryLeafObjects[7] || null);
      return;
    }
    entryGestureStatus.textContent = "请先握拳，再松开手指";
    return;
  }

  if (!gesture || score < 0.62) {
    drawGestureOverlay(landmarks, null);
    setActiveGestureGuide("");
    setGestureReadout("识别中", "把手放入画面中央");
    lastIndexX = null;
    return;
  }

  if (label === "Pointing_Up") {
    const indexDirection = getIndexDirection(landmarks);
    drawGestureOverlay(landmarks, indexDirection);

    if (indexDirection === "up") {
      lastIndexX = null;
      setActiveGestureGuide("Index_Up");
      setGestureReadout("食指向上", "切换到上一个观察点");
      if (canRunGestureAction("Index_Up", now)) moveToScene(-1);
      return;
    }

    if (indexDirection === "down") {
      lastIndexX = null;
      setActiveGestureGuide("Index_Down");
      setGestureReadout("食指向下", "切换到下一个观察点");
      if (canRunGestureAction("Index_Down", now)) moveToScene(1);
      return;
    }

    setActiveGestureGuide("Index_Move");
    rotateModelFromIndex(landmarks, now);
    setGestureReadout("食指旋转", "左右移动食指旋转模型");
    return;
  }

  drawGestureOverlay(landmarks, null);
  lastIndexX = null;

  if (label === "Thumb_Up") {
    setActiveGestureGuide("");
    setGestureReadout("请用食指", "食指向上/向下切换，左右移动旋转");
    return;
  }

  if (label === "Thumb_Down") {
    setActiveGestureGuide("");
    setGestureReadout("请用食指", "食指向上/向下切换，左右移动旋转");
    return;
  }

  if (label === "Closed_Fist") {
    setActiveGestureGuide(label);
    setGestureReadout("回到待观察", "握拳回到完整模型视角");
    if (canRunGestureAction(label, now)) setIdle();
    return;
  }

  setActiveGestureGuide("");
  setGestureReadout(label, "食指向上/向下切换，左右移动旋转");
}

async function loadGestureRecognizer() {
  if (gestureRecognizer) return gestureRecognizer;
  setGestureReadout("正在加载", "首次加载手势模型会稍慢");
  const visionUrl = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_VERSION}/vision_bundle.mjs`;
  const { FilesetResolver, GestureRecognizer } = await import(visionUrl);
  const vision = await FilesetResolver.forVisionTasks(
    `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VISION_VERSION}/wasm`,
  );
  const options = {
    baseOptions: {
      modelAssetPath: GESTURE_MODEL_URL,
    },
    runningMode: "VIDEO",
    numHands: 1,
  };
  try {
    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
      ...options,
      baseOptions: {
        ...options.baseOptions,
        delegate: "GPU",
      },
    });
  } catch {
    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, options);
  }
  return gestureRecognizer;
}

async function startGestureControl() {
  gesturePanel.classList.add("is-active");
  gesturePanel.setAttribute("aria-hidden", "false");
  gestureToggle.classList.add("is-active");
  gestureToggle.textContent = "关闭手势";
  entryGestureButton.textContent = "关闭手势进入";
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera API is unavailable.");
    }
    const recognizer = await loadGestureRecognizer();
    gestureStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    });
    gestureVideo.srcObject = gestureStream;
    await gestureVideo.play();
    gestureCanvas.width = gestureVideo.videoWidth || 640;
    gestureCanvas.height = gestureVideo.videoHeight || 480;
    gestureRunning = true;
    setGestureReadout("手势已开启", "食指向上/向下切换，左右移动旋转");
    entryGestureStatus.textContent = "请握拳，然后松开手指进入";

    const detect = () => {
      if (!gestureRunning) return;
      const now = performance.now();
      if (gestureVideo.currentTime !== lastGestureVideoTime) {
        lastGestureVideoTime = gestureVideo.currentTime;
        const result = recognizer.recognizeForVideo(gestureVideo, now);
        handleGestureResult(result, now);
      }
      gestureLoopId = requestAnimationFrame(detect);
    };
    detect();
  } catch (error) {
    console.error(error);
    gestureRunning = false;
    window.cancelAnimationFrame(gestureLoopId);
    gestureStream?.getTracks().forEach((track) => track.stop());
    gestureStream = null;
    gestureVideo.srcObject = null;
    gestureToggle.textContent = "重试手势";
    entryGestureButton.textContent = "重试手势进入";
    setGestureReadout("手势不可用", "需要浏览器允许摄像头权限");
    entryGestureStatus.textContent = "需要允许摄像头权限";
  }
}

function stopGestureControl() {
  gestureRunning = false;
  window.cancelAnimationFrame(gestureLoopId);
  gestureStream?.getTracks().forEach((track) => track.stop());
  gestureStream = null;
  gestureVideo.srcObject = null;
  gesturePanel.classList.remove("is-active");
  gesturePanel.setAttribute("aria-hidden", "true");
  gestureToggle.classList.remove("is-active");
  gestureToggle.textContent = "开启摄像头手势";
  entryGestureButton.textContent = "开启手势进入";
  entryGestureStatus.textContent = "手势入口待机";
  entryFistPrimed = false;
  lastGestureLabel = "";
  lastGestureActionAt = 0;
  lastIndexX = null;
  setActiveGestureGuide("");
  const context = gestureCanvas.getContext("2d");
  context?.clearRect(0, 0, gestureCanvas.width, gestureCanvas.height);
}

function setIdle() {
  app.dataset.scene = "idle";
  app.dataset.report = "closed";
  setAnnotation("none");
  updateHud({
    id: "idle",
    code: "MIE-00",
    title: "待观察",
    hud: "选择右侧词条，系统将在模型表面显示对应识别线、采样点和结构说明。",
  });
  sceneKicker.textContent = "OBSERVATION DESK";
  sceneTitle.textContent = "Tripo 真实 3D 金叶观察台";
  sceneText.textContent = "选择一个观察点，查看金叶的形状、材质、工艺、纹样和结构。";
  detailFeature.textContent = "完整金叶";
  detailTranslate.textContent = "当前加载的是 Tripo 生成的 GLB 模型，可拖动旋转。";
  annotationLabel.textContent = "拖动模型可自由旋转，按 1-5 进入观察镜头";
  buttons.forEach((button) => button.classList.remove("is-active"));
  setTarget([-0.08, 0.16, 0], 1);
}

function playScene(key) {
  const item = scenes[key];
  if (!item) return;

  window.clearTimeout(resetTimer);
  app.dataset.report = "closed";
  app.dataset.scene = item.id;
  setAnnotation(item.id);
  updateHud(item);
  observed.add(key);
  updateProgress();

  sceneKicker.textContent = item.kicker;
  sceneTitle.textContent = item.title;
  sceneText.textContent = item.text;
  detailFeature.textContent = item.feature;
  detailTranslate.textContent = item.translate;
  annotationLabel.textContent = item.annotation;
  buttons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.key === key);
  });
  setTarget(item.rotation, item.zoom);
}

function showReport() {
  reportGrid.innerHTML = Object.entries(scenes)
    .map(
      ([key, item]) => `
        <article>
          <span>${key}</span>
          <strong>${item.title}</strong>
          <p>${item.translate}</p>
        </article>
      `,
    )
    .join("");
  app.dataset.report = "open";
}

function resetObservation() {
  observed.clear();
  updateProgress();
  setIdle();
}

function initRenderer() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.05, 6.2);

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  const mobileViewport = window.matchMedia("(max-width: 720px)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobileViewport ? 1.35 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;

  scene.add(new THREE.HemisphereLight(0xf5f5f2, 0x565a5d, 1.12));

  const key = new THREE.DirectionalLight(0xffffff, 2.45);
  key.position.set(-3.2, 4.1, 5.2);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xb7c0c4, 0.72);
  fill.position.set(3.6, -1.4, 2.4);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 1.35);
  rim.position.set(0, 2.5, -3.2);
  scene.add(rim);

  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 3.9, 0.04),
    new THREE.MeshPhysicalMaterial({
      color: 0xd8dcdd,
      transparent: true,
      opacity: 0.14,
      roughness: 0.06,
      metalness: 0,
      transmission: 0.35,
    }),
  );
  panel.position.set(0, 0, -0.28);
  scene.add(panel);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 0.26, 0.58),
    new THREE.MeshStandardMaterial({ color: 0x6b6c68, roughness: 0.48, metalness: 0.05 }),
  );
  base.position.set(0, -2.08, -0.16);
  scene.add(base);

  modelPivot = new THREE.Group();
  scene.add(modelPivot);
  annotationRoot = new THREE.Group();
  annotationRoot.visible = false;
  modelPivot.add(annotationRoot);
  lineOverlayRoot = new THREE.Group();
  modelPivot.add(lineOverlayRoot);
  scanRoot = new THREE.Group();
  flowRoot = new THREE.Group();
  modelPivot.add(scanRoot, flowRoot);

  resizeRenderer();
  loadModel();
  animate();
}

function tintModel(root) {
  const paleGold = new THREE.MeshStandardMaterial({
    color: 0xbf9000,
    metalness: 0.48,
    roughness: 0.5,
    envMapIntensity: 0.42,
    transparent: false,
    opacity: 1,
    depthWrite: true,
  });

  root.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    child.material = paleGold.clone();
  });
}

function frameModel(root) {
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z);

  root.position.sub(center);
  root.scale.setScalar(2.72 / maxSize);
  root.rotation.y = MODEL_FRONT_OFFSET_Y;

  const framedBox = new THREE.Box3().setFromObject(root);
  root.position.y -= framedBox.getCenter(new THREE.Vector3()).y * 0.12;
}

async function loadModel(attempt = 1) {
  modelLoading.classList.remove("is-hidden");
  modelLoading.querySelector("strong").textContent = attempt === 1 ? "正在加载 3D 模型" : `正在重试 3D 模型 ${attempt}/${MODEL_MAX_LOAD_ATTEMPTS}`;
  modelLoadingDetail.textContent = attempt === 1 ? "先显示文物预览，模型加载完成后自动切换" : "网络或解码器响应较慢，正在重新请求模型文件。";

  if (MeshoptDecoder.ready) {
    await MeshoptDecoder.ready;
  }

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const startedAt = performance.now();
  const modelUrl = attempt === 1 ? canvas.dataset.model : `${canvas.dataset.model}?retry=${attempt}-${Date.now()}`;

  loader.load(
    modelUrl,
    (gltf) => {
      relicRoot = gltf.scene;
      tintModel(relicRoot);
      frameModel(relicRoot);
      modelPivot.add(relicRoot);
      createLineOverlays();
      createScanField();
      canvas.classList.add("is-ready");
      modelPreview.classList.add("is-hidden");
      modelLoading.classList.add("is-hidden");
    },
    (event) => {
      if (!event.lengthComputable) {
        if (performance.now() - startedAt > 1800) {
          modelLoadingDetail.textContent = "模型文件较大，正在继续加载；当前可先浏览文字信息。";
        }
        return;
      }
      const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
      modelLoadingDetail.textContent = `已加载 ${percent}% · 首次打开会稍慢，之后浏览器会缓存`;
    },
    (error) => {
      console.error(error);
      if (attempt < MODEL_MAX_LOAD_ATTEMPTS) {
        modelLoading.querySelector("strong").textContent = "3D 模型加载较慢";
        modelLoadingDetail.textContent = `正在自动重试 ${attempt + 1}/${MODEL_MAX_LOAD_ATTEMPTS}，无需刷新页面。`;
        window.setTimeout(() => loadModel(attempt + 1), 900 * attempt);
        return;
      }
      modelLoading.querySelector("strong").textContent = "3D 模型加载失败";
      modelLoadingDetail.textContent = "已保留文物预览图，可以刷新或换网络后重试。";
    },
  );
}

function updateHud(item) {
  hudTop.textContent = `${item.code || "MIE-00"} / FORM-MATERIAL-RITUAL MAP`;
  hudLeft.textContent = `source: west han nanyue king museum / ${item.id || "idle"}`;
  hudCode.textContent = item.code || "MIE-00";
  hudTitle.textContent = item.title || "待观察";
  hudText.textContent = item.hud || item.text || "";
}

function setAnnotation(name) {
  if (annotationRoot) {
    annotationRoot.visible = false;
    annotationRoot.children.forEach((child) => {
      child.visible = false;
    });
  }
  if (lineOverlayRoot) {
    const activeName = name === "foil" ? "outline" : name;
    lineOverlayRoot.children.forEach((child) => {
      child.visible = child.name === activeName;
    });
    overlayVideos.forEach((video, key) => {
      if (key === activeName) {
        playOverlayVideo(key);
      } else {
        video.pause();
      }
    });
  }
  if (flowRoot) {
    flowRoot.children.forEach((child) => {
      child.visible = false;
    });
  }
}

function playOverlayVideo(name) {
  const video = overlayVideos.get(name);
  if (!video) return;

  const start = () => {
    video.pause();
    try {
      video.currentTime = 0;
    } catch {
      // Some browsers delay seeking until metadata is available.
    }
    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {});
    }
  };

  if (video.readyState >= 1) {
    start();
    return;
  }

  video.addEventListener("loadedmetadata", start, { once: true });
  video.load();
}

function createOverlayMaterial(texture, overlay) {
  if (overlay.whiteMask) {
    return new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
        opacity: { value: overlay.opacity },
        texelSize: { value: new THREE.Vector2(1 / (overlay.sourceWidth || 1920), 1 / (overlay.sourceHeight || 1080)) },
        cleanMask: { value: overlay.cleanMask ? 1 : 0 },
        darkLineMask: { value: overlay.darkLineMask ? 1 : 0 },
        maskThreshold: { value: overlay.maskThreshold || 0.32 },
        sampleRadius: { value: overlay.sampleRadius || 1 },
      },
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform float opacity;
        uniform vec2 texelSize;
        uniform float cleanMask;
        uniform float darkLineMask;
        uniform float maskThreshold;
        uniform float sampleRadius;
        varying vec2 vUv;

        float maskAlpha(vec2 uv) {
          vec4 sampleColor = texture2D(map, uv);
          if (darkLineMask > 0.5) {
            float colorDistance = length(sampleColor.rgb);
            return smoothstep(maskThreshold, maskThreshold + 0.055, colorDistance);
          }
          float luminance = dot(sampleColor.rgb, vec3(0.299, 0.587, 0.114));
          return sampleColor.a > 0.04 ? sampleColor.a : smoothstep(0.62, 0.96, luminance);
        }

        void main() {
          vec2 stepSize = texelSize * sampleRadius;
          float center = maskAlpha(vUv);
          float alpha = center;

          if (cleanMask > 0.5) {
            float solidCenter = smoothstep(maskThreshold, maskThreshold + 0.18, center);
            float neighbors =
              step(maskThreshold, maskAlpha(vUv + vec2(stepSize.x, 0.0))) +
              step(maskThreshold, maskAlpha(vUv - vec2(stepSize.x, 0.0))) +
              step(maskThreshold, maskAlpha(vUv + vec2(0.0, stepSize.y))) +
              step(maskThreshold, maskAlpha(vUv - vec2(0.0, stepSize.y))) +
              step(maskThreshold, maskAlpha(vUv + vec2(stepSize.x, stepSize.y))) +
              step(maskThreshold, maskAlpha(vUv + vec2(-stepSize.x, stepSize.y))) +
              step(maskThreshold, maskAlpha(vUv + vec2(stepSize.x, -stepSize.y))) +
              step(maskThreshold, maskAlpha(vUv + vec2(-stepSize.x, -stepSize.y)));
            float connected = smoothstep(2.5, 5.5, neighbors);
            alpha = solidCenter * connected;
          }

          alpha *= opacity;
          if (alpha < 0.16) discard;
          gl_FragColor = vec4(vec3(1.0), alpha);
        }
      `,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: overlay.opacity,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

function createImageOverlay(loader, overlay, file, assetPrefix) {
  loader.load(`${assetPrefix}line-overlays/${file}`, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const material = createOverlayMaterial(texture, overlay);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(overlay.width, overlay.height), material);
    mesh.name = overlay.name;
    mesh.position.set(...overlay.position);
    mesh.renderOrder = 55;
    const activeName = app.dataset.scene === "foil" ? "outline" : app.dataset.scene;
    mesh.visible = mesh.name === activeName;
    lineOverlayRoot.add(mesh);
  });
}

function createLineOverlays() {
  if (!lineOverlayRoot) return;
  lineOverlayRoot.clear();

  const assetPrefix = canvas.dataset.model.startsWith("assets/") ? "assets/" : "";
  const loader = new THREE.TextureLoader();
  const overlayScale = 0.92;
  const overlays = [
    {
      name: "outline",
      file: "outline-only.png",
      width: 3.18 * overlayScale,
      height: 3.18 * overlayScale,
      position: [0, 0.02, 0.18],
      opacity: 0.9,
    },
    {
      name: "relief",
      file: "relief.webm",
      fallbackFile: "relief.png",
      type: "video",
      whiteMask: true,
      width: 3.12 * overlayScale,
      height: 2.55 * overlayScale,
      position: [0, 0.15, 0.185],
      opacity: 1,
    },
    {
      name: "ram",
      file: "ram.webm",
      fallbackFile: "ram.png",
      type: "video",
      whiteMask: true,
      darkLineMask: true,
      sourceWidth: 1200,
      sourceHeight: 1200,
      maskThreshold: 0.018,
      width: 2.18 * overlayScale,
      height: 2.18 * overlayScale,
      position: [0, 0.62, 0.19],
      opacity: 1,
    },
    {
      name: "symmetry",
      file: "symmetry.webm",
      fallbackFile: "symmetry.png",
      type: "video",
      whiteMask: true,
      cleanMask: true,
      playbackRate: 0.1,
      sourceWidth: 1920,
      sourceHeight: 1080,
      sampleRadius: 2,
      maskThreshold: 0.34,
      width: 5,
      height: 5 * (2.64 / 4.7),
      position: [0, -0.25, 0.19],
      opacity: 1,
    },
  ];

  overlays.forEach((overlay) => {
    if (overlay.type === "video") {
      const video = document.createElement("video");
      video.src = `${assetPrefix}line-overlays/${overlay.file}`;
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.loop = false;
      video.crossOrigin = "anonymous";
      video.playbackRate = overlay.playbackRate || 1;
      video.addEventListener("ended", () => {
        video.pause();
      });

      const texture = new THREE.VideoTexture(video);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      const material = createOverlayMaterial(texture, overlay);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(overlay.width, overlay.height), material);
      mesh.name = overlay.name;
      mesh.position.set(...overlay.position);
      mesh.renderOrder = 55;
      mesh.visible = app.dataset.scene === mesh.name;
      lineOverlayRoot.add(mesh);
      overlayVideos.set(overlay.name, video);
      video.addEventListener("error", () => {
        mesh.visible = false;
        if (overlay.fallbackFile) {
          createImageOverlay(loader, overlay, overlay.fallbackFile, assetPrefix);
        }
      }, { once: true });
      video.load();
      if (mesh.visible) {
        playOverlayVideo(overlay.name);
      }
      return;
    }

    createImageOverlay(loader, overlay, overlay.file, assetPrefix);
  });
}

function point(x, y, z = 0.57) {
  return new THREE.Vector3(x, y, z);
}

function makeLineGroup(name) {
  const group = new THREE.Group();
  group.name = name;
  group.visible = false;
  annotationRoot.add(group);
  return group;
}

function addTube(group, coords, radius = 0.0038) {
  const curve = new THREE.CatmullRomCurve3(coords.map(([x, y, z]) => point(x, y, z)));
  const geometry = new THREE.TubeGeometry(curve, 72, radius, 6, false);
  const material = new THREE.MeshBasicMaterial({
    color: 0xff2838,
    depthTest: false,
    transparent: true,
    opacity: 1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.renderOrder = 30;
  group.add(mesh);
  return mesh;
}

function addRing(group, x, y, radius = 0.045, z = 0.59) {
  const geometry = new THREE.TorusGeometry(radius, 0.0038, 8, 36);
  const material = new THREE.MeshBasicMaterial({
    color: 0xff2838,
    depthTest: false,
    transparent: true,
    opacity: 1,
  });
  const ring = new THREE.Mesh(geometry, material);
  ring.position.set(x, y, z);
  ring.renderOrder = 31;
  group.add(ring);
  return ring;
}

function addBox(group, x, y, width, height, z = 0.6) {
  addTube(
    group,
    [
      [x - width / 2, y - height / 2, z],
      [x + width / 2, y - height / 2, z],
      [x + width / 2, y + height / 2, z],
      [x - width / 2, y + height / 2, z],
      [x - width / 2, y - height / 2, z],
    ],
    0.0032,
  );
}

function mirrorPath(coords) {
  return coords.map(([x, y, z]) => [-x, y, z]);
}

function addMirroredTube(group, coords, radius = 0.0038) {
  addTube(group, coords, radius);
  addTube(group, mirrorPath(coords), radius);
}

function createFeatureAnnotations() {
  annotationRoot.clear();

  const outerContour = [
    [0, 1.48], [0.38, 1.42], [0.76, 1.24], [1.04, 0.88], [1.24, 0.35],
    [1.3, -0.14], [1.2, -0.62], [0.98, -1.06], [0.6, -1.39],
    [0.22, -1.48], [-0.22, -1.48], [-0.6, -1.39], [-0.98, -1.06],
    [-1.2, -0.62], [-1.3, -0.14], [-1.24, 0.35], [-1.04, 0.88],
    [-0.76, 1.24], [-0.38, 1.42], [0, 1.48],
  ];

  const outline = makeLineGroup("outline");
  addTube(outline, outerContour, 0.0052);

  const foil = makeLineGroup("foil");
  addTube(foil, [[1.22, 1.28], [1.31, 0.74], [1.34, 0.12], [1.26, -0.58], [1.04, -1.18]], 0.005);
  addTube(foil, [[1.1, 1.18], [1.18, 0.56], [1.2, -0.2], [1.04, -0.96]], 0.0034);
  addTube(foil, [[1.18, 0.82, 0.48], [1.38, 0.82, 0.74]], 0.0032);
  addTube(foil, [[1.17, -0.24, 0.48], [1.36, -0.24, 0.74]], 0.0032);
  addTube(foil, [[0.48, -1.48], [0.9, -1.48], [1.08, -1.28]], 0.0034);

  const relief = makeLineGroup("relief");
  [
    [[-1.28, 0.82], [-1.05, 0.72], [-0.84, 0.56], [-0.66, 0.34], [-0.56, 0.1]],
    [[-1.28, 0.62], [-1.02, 0.5], [-0.78, 0.3], [-0.62, 0.04], [-0.55, -0.24]],
    [[-1.22, 0.4], [-0.96, 0.24], [-0.76, -0.02], [-0.65, -0.32], [-0.62, -0.62]],
    [[-0.5, 1.32], [-0.74, 1.3], [-0.82, 1.12], [-0.68, 0.98], [-0.48, 1.02]],
    [[-0.43, 1.22], [-0.64, 1.16], [-0.66, 0.98], [-0.48, 0.9], [-0.34, 0.98]],
    [[-0.44, 0.86], [-0.18, 0.74], [0, 0.66], [0.18, 0.74], [0.44, 0.86]],
    [[-0.36, 0.6], [-0.12, 0.46], [0, 0.38], [0.12, 0.46], [0.36, 0.6]],
    [[-0.28, 0.34], [-0.1, 0.18], [0, 0.08], [0.1, 0.18], [0.28, 0.34]],
  ].forEach((line) => addMirroredTube(relief, line, 0.0034));
  addTube(relief, [[-0.18, 1.56], [-0.08, 1.46], [0, 1.5], [0.08, 1.46], [0.18, 1.56]], 0.0032);
  addTube(relief, [[-0.22, 1.38], [-0.08, 1.3], [0, 1.34], [0.08, 1.3], [0.22, 1.38]], 0.0032);

  const ram = makeLineGroup("ram");
  addTube(ram, [
    [0, 0.92], [-0.22, 1.08], [-0.34, 1.32], [-0.54, 1.43], [-0.7, 1.36],
    [-0.66, 1.2], [-0.52, 1.16], [-0.36, 1.24],
  ], 0.005);
  addTube(ram, [
    [0, 0.92], [0.22, 1.08], [0.34, 1.32], [0.54, 1.43], [0.7, 1.36],
    [0.66, 1.2], [0.52, 1.16], [0.36, 1.24],
  ], 0.005);
  addTube(ram, [[-0.24, 1.5], [-0.06, 1.34], [0, 0.92], [0.06, 1.34], [0.24, 1.5]], 0.004);
  addRing(ram, -0.34, 1.28, 0.048);
  addRing(ram, 0.34, 1.28, 0.048);

  const symmetry = makeLineGroup("symmetry");
  addTube(symmetry, [[0, 1.66], [0, 0.86], [0, 0.08], [0, -0.74], [0, -1.62]], 0.0032);
  addMirroredTube(symmetry, [
    [0, 0.44], [-0.22, 0.78], [-0.58, 0.94], [-0.96, 0.84], [-1.18, 0.52],
    [-1.24, 0.18], [-1.06, -0.08], [-0.74, -0.18], [-0.56, -0.42],
    [-0.46, -0.84], [-0.38, -1.34], [-0.68, -1.36], [-0.98, -1.18],
    [-1.18, -0.82], [-1.06, -0.5], [-0.84, -0.34], [-0.76, -0.02],
    [-0.54, 0.3], [-0.28, 0.5], [0, 0.44],
  ], 0.005);
  addMirroredTube(symmetry, [[-0.58, 0.32], [-0.72, 0.04], [-0.64, -0.34], [-0.38, -0.8]], 0.004);
  addMirroredTube(symmetry, [[-0.72, -0.58], [-0.88, -0.82], [-0.78, -1.04], [-0.54, -0.92], [-0.62, -0.58]], 0.004);
  addMirroredTube(symmetry, [[-0.28, -0.72], [-0.32, -1.12], [-0.36, -1.58]], 0.004);

  setAnnotation("none");
}

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function createScanField() {
  scanRoot.clear();
  const random = seededRandom(314159);
  const vertices = [];
  const colors = [];
  const color = new THREE.Color();

  for (let i = 0; i < 380; i += 1) {
    const x = (random() - 0.5) * 3.25;
    const y = (random() - 0.5) * 3.45;
    const edgeFade = Math.max(Math.abs(x) / 1.7, Math.abs(y) / 1.78);
    if (edgeFade > 1.08) continue;
    const z = 0.68 + random() * 0.18;
    vertices.push(x, y, z);
    const tone = 0.65 + random() * 0.35;
    color.setRGB(tone, tone, tone);
    colors.push(color.r, color.g, color.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.014,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    depthTest: false,
  });
  const points = new THREE.Points(geometry, material);
  points.renderOrder = 20;
  scanRoot.add(points);
}

function addFlow(name, coords, color = 0xc77a2a) {
  const curve = new THREE.CatmullRomCurve3(coords.map(([x, y, z]) => point(x, y, z)));
  const geometry = new THREE.TubeGeometry(curve, 96, 0.0024, 5, false);
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 1,
    depthTest: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.renderOrder = 24;
  flowRoot.add(mesh);
  return mesh;
}

function createFlowField() {
  flowRoot.clear();
  addFlow("global", [[-1.4, 1.1, 0.64], [-0.7, 0.78, 0.7], [0, 0.54, 0.72], [0.72, 0.78, 0.7], [1.42, 1.1, 0.64]]);
  addFlow("global", [[-1.28, -0.58, 0.63], [-0.54, -0.1, 0.72], [0, 0.1, 0.75], [0.54, -0.1, 0.72], [1.28, -0.58, 0.63]]);
  addFlow("relief", [[-1.18, 0.68, 0.69], [-0.7, 0.35, 0.76], [-0.22, 0.12, 0.76], [0.22, 0.12, 0.76], [0.7, 0.35, 0.76], [1.18, 0.68, 0.69]], 0xd08a34);
  addFlow("ram", [[-0.72, 1.36, 0.74], [-0.32, 1.15, 0.8], [0, 0.92, 0.82], [0.32, 1.15, 0.8], [0.72, 1.36, 0.74]], 0xd08a34);
  addFlow("symmetry", [[0, 1.72, 0.75], [0, 0.8, 0.8], [0, -0.15, 0.78], [0, -1.66, 0.7]], 0xd08a34);
}

function resizeRenderer() {
  if (!renderer) return;
  const rect = modelStage.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width));
  const height = Math.max(320, Math.floor(rect.height));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  const elapsed = entryClock.getElapsedTime();
  animateEntryScene(elapsed);
  currentRotation.x = THREE.MathUtils.lerp(currentRotation.x, targetRotation.x, 0.085);
  currentRotation.y = THREE.MathUtils.lerp(currentRotation.y, targetRotation.y, 0.085);
  currentRotation.z = THREE.MathUtils.lerp(currentRotation.z, targetRotation.z, 0.085);
  currentZoom = THREE.MathUtils.lerp(currentZoom, targetZoom, 0.085);

  if (modelPivot) {
    modelPivot.rotation.copy(currentRotation);
    modelPivot.scale.setScalar(currentZoom);
    syncLineOverlayFacing();
  }

  renderer.render(scene, camera);
}

buttons.forEach((button) => {
  button.addEventListener("click", () => playScene(button.dataset.key));
});

entryCanvas.addEventListener("click", (event) => {
  const leaf = pickEntryLeaf(event);
  if (leaf) enterObservatory(leaf);
});

entryGestureButton.addEventListener("click", () => {
  if (gestureRunning || gestureStream) {
    stopGestureControl();
    return;
  }
  startGestureControl();
});

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  playScene(event.key);
});

modelStage.addEventListener("pointerdown", (event) => {
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (activePointers.size === 1) {
    gestureHadMultiplePointers = false;
  }
  isDragging = true;
  startX = event.clientX;
  startY = event.clientY;
  swipeStartX = event.clientX;
  swipeStartY = event.clientY;
  swipeStartTime = performance.now();
  modelStage.setPointerCapture(event.pointerId);
  if (activePointers.size === 2) {
    gestureHadMultiplePointers = true;
    beginTwoFingerGesture();
  }
});

modelStage.addEventListener("pointermove", (event) => {
  if (!activePointers.has(event.pointerId)) return;
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (activePointers.size >= 2) {
    const metrics = getGestureMetrics();
    if (!metrics || !gestureStartDistance) return;
    const zoomRatio = metrics.distance / gestureStartDistance;
    const angleDelta = metrics.angle - gestureStartAngle;
    targetZoom = THREE.MathUtils.clamp(gestureStartZoom * zoomRatio, 0.82, 1.42);
    targetRotation.z = THREE.MathUtils.clamp(gestureStartRotationZ + angleDelta * 0.55, -0.38, 0.38);
    return;
  }

  if (!isDragging) return;

  const dx = event.clientX - startX;
  const dy = event.clientY - startY;
  targetRotation.y += dx * 0.0065;
  targetRotation.x += dy * 0.0055;
  targetRotation.x = THREE.MathUtils.clamp(targetRotation.x, -0.9, 0.9);
  startX = event.clientX;
  startY = event.clientY;
});

modelStage.addEventListener("pointerup", (event) => {
  const endedPointer = activePointers.get(event.pointerId);
  activePointers.delete(event.pointerId);
  if (endedPointer && activePointers.size === 0) {
    maybeSwipeToScene(event.clientX, event.clientY);
  }
  isDragging = activePointers.size > 0;
  if (activePointers.size === 1) {
    const [remaining] = activePointers.values();
    startX = remaining.x;
    startY = remaining.y;
  }
  if (activePointers.size === 2) {
    gestureHadMultiplePointers = true;
    beginTwoFingerGesture();
  }
  if (modelStage.hasPointerCapture(event.pointerId)) {
    modelStage.releasePointerCapture(event.pointerId);
  }
});

modelStage.addEventListener("pointercancel", () => {
  activePointers.clear();
  isDragging = false;
  gestureHadMultiplePointers = false;
});

resetButton.addEventListener("click", resetObservation);
inspectorToggle.addEventListener("click", () => {
  setPanelState("inspector", app.dataset.inspector === "closed");
});
knowledgeToggle.addEventListener("click", () => {
  setPanelState("knowledge", app.dataset.knowledge === "closed");
});
gestureToggle.addEventListener("click", () => {
  if (gestureRunning || gestureStream) {
    stopGestureControl();
    return;
  }
  startGestureControl();
});
window.addEventListener("resize", () => {
  resizeRenderer();
  resizeEntryRenderer();
});

initEntryRenderer();
initRenderer();
setIdle();
updateProgress();
setPanelState("inspector", false);
setPanelState("knowledge", false);
