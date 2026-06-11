/* ============================================================
   RAFAEL NASSIF — PORTFÓLIO 2026 · scene.js
   Campo de partículas (Three.js) — ondas + ripple do mouse
   Degrada graciosamente: sem WebGL, o hero segue bonito em CSS.
   ============================================================ */
import * as THREE from "three";

const canvas = document.getElementById("webgl");
const reduced = document.documentElement.classList.contains("motion-off");
const isMobile = window.innerWidth < 880;

if (canvas) init();

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
  } catch (err) {
    console.warn("[portfólio] WebGL indisponível — usando fallback CSS.", err);
    canvas.remove();
    return;
  }

  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
  camera.position.set(0, 1.55, 5.2);
  camera.lookAt(0, -0.1, 0);

  /* ----- geometria: grade de pontos ----- */
  const W = 16;
  const D = 9.5;
  const COLS = isMobile ? 110 : 190;
  const ROWS = isMobile ? 60 : 105;
  const COUNT = COLS * ROWS;

  const positions = new Float32Array(COUNT * 3);
  const randoms = new Float32Array(COUNT);
  let i = 0;
  for (let ix = 0; ix < COLS; ix++) {
    for (let iz = 0; iz < ROWS; iz++) {
      positions[i * 3] = (ix / (COLS - 1) - 0.5) * W;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = (iz / (ROWS - 1) - 0.5) * D;
      randoms[i] = Math.random();
      i++;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));

  const uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(99, 99) },
    uHover: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.75) },
    uSize: { value: isMobile ? 46 : 38 },
    uColorDim: { value: new THREE.Color("#4a4338") },
    uColorInk: { value: new THREE.Color("#f0e9dd") },
    uColorAccent: { value: new THREE.Color("#ff4d00") },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uHover;
      uniform float uPixelRatio;
      uniform float uSize;
      attribute float aRandom;
      varying float vElev;
      varying float vRipple;
      varying float vFade;

      void main() {
        vec3 pos = position;
        float t = uTime * 0.55;

        float wave = sin(pos.x * 0.55 + t) * cos(pos.z * 0.7 + t * 0.85) * 0.42;
        wave += sin(pos.x * 1.9 + t * 1.5) * cos(pos.z * 1.4 + t) * 0.1 * aRandom;

        float d = distance(pos.xz, uMouse);
        float ripple = smoothstep(2.4, 0.0, d) * uHover;
        float lift = ripple * (0.85 + sin(uTime * 3.0 - d * 2.6) * 0.18);

        pos.y += wave + lift;

        vElev = wave;
        vRipple = ripple;

        float edge = 1.0 - smoothstep(5.0, 8.0, abs(pos.x));
        edge *= 1.0 - smoothstep(2.6, 4.7, abs(pos.z));
        vFade = edge;

        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mv;

        float size = uSize * (0.7 + aRandom * 0.55 + ripple * 1.7);
        gl_PointSize = size * uPixelRatio * (1.0 / -mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColorDim;
      uniform vec3 uColorInk;
      uniform vec3 uColorAccent;
      varying float vElev;
      varying float vRipple;
      varying float vFade;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float r = length(uv);
        if (r > 0.5) discard;

        float core = smoothstep(0.5, 0.16, r);
        vec3 col = mix(uColorDim, uColorInk, smoothstep(-0.4, 0.55, vElev));
        col = mix(col, uColorAccent, clamp(vRipple * 1.5, 0.0, 1.0));

        float alpha = core * vFade;
        alpha *= 0.38 + smoothstep(-0.2, 0.55, vElev) * 0.3 + vRipple * 0.45;
        if (alpha < 0.012) discard;

        gl_FragColor = vec4(col, alpha);
      }
    `,
  });

  const points = new THREE.Points(geometry, material);
  points.position.y = -0.55;
  scene.add(points);

  /* ----- plano invisível p/ raycast do mouse ----- */
  const hitPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 24),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitPlane.rotation.x = -Math.PI / 2;
  hitPlane.position.y = -0.55;
  scene.add(hitPlane);

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const mouseTarget = new THREE.Vector2(99, 99);
  let hoverTarget = 0;

  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    const inside =
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (!inside) {
      hoverTarget = 0;
      return;
    }
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(hitPlane);
    if (hit.length) {
      mouseTarget.set(hit[0].point.x, hit[0].point.z);
      hoverTarget = 1;
    }
  }

  if (!reduced && window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerout", (e) => {
      if (!e.relatedTarget) hoverTarget = 0; // ponteiro saiu da janela
    });
  }

  /* ----- resize ----- */
  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 1.75);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  /* ----- loop (pausa fora de vista / aba oculta) ----- */
  let inView = true;
  let hidden = document.hidden;
  const observer = new IntersectionObserver(
    (entries) => { inView = entries[0].isIntersecting; },
    { threshold: 0 }
  );
  observer.observe(canvas);
  document.addEventListener("visibilitychange", () => { hidden = document.hidden; });

  const clock = new THREE.Clock();
  let elapsed = 0;

  function frame() {
    requestAnimationFrame(frame);
    const dt = clock.getDelta();
    if (hidden || !inView) return;

    elapsed += dt;
    uniforms.uTime.value = elapsed;

    uniforms.uMouse.value.lerp(mouseTarget, 0.08);
    uniforms.uHover.value += (hoverTarget - uniforms.uHover.value) * 0.06;

    renderer.render(scene, camera);
  }

  if (reduced) {
    // um único frame estático
    uniforms.uTime.value = 2.4;
    renderer.render(scene, camera);
  } else {
    frame();
  }

  canvas.classList.add("is-ready");
}
