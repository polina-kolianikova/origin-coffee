import * as T from "./assets/vendor/three.module.js?v=ce1fa418de16a19495a9f72495580e3015d7745c296d3ce0485897f902ddedfb";
import { createRenderControl } from "./render-control.js?v=37253f0cea0acd696b7e0a6efb32a0c9e5229cc876bf998b8f34d3248e645f4c";
const canvas = document.querySelector("#coffee-canvas"),
  story = document.querySelector(".coffee-story"),
  reduced = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v) => Math.max(0, Math.min(1, v)),
  ease = (v) => {
    v = clamp(v);
    return v * v * (3 - 2 * v);
  },
  mix = (a, b, t) => a + (b - a) * t;
const origins = {
  ethiopia: {
    country: "ETHIOPIA",
    region: "SIDAMA",
    notes: "JASMINE. PEACH. CITRUS.",
    colour: "#c58d53",
  },
  colombia: {
    country: "COLOMBIA",
    region: "HUILA",
    notes: "CARAMEL. ORANGE. COCOA.",
    colour: "#9eaa75",
  },
  guatemala: {
    country: "GUATEMALA",
    region: "ANTIGUA",
    notes: "COCOA. ALMOND. RED APPLE.",
    colour: "#be7852",
  },
};
let origin = "ethiopia",
  roast = 30,
  renderer,
  scene,
  camera,
  bag,
  bagPrint,
  bagMaterial,
  seam,
  beans,
  beanMaterial,
  cup,
  control,
  progress = 0,
  px = 0;
export function setOrigin(key) {
  origin = key;
  if (bagPrint) {
    const old = bagPrint.map;
    bagPrint.map = label();
    old.dispose();
  }
  control?.invalidate();
}
export function setRoast(value) {
  roast = value;
  control?.invalidate();
}
function label() {
  const c = document.createElement("canvas");
  c.width = 768;
  c.height = 1024;
  const x = c.getContext("2d"),
    o = origins[origin];
  x.fillStyle = o.colour;
  x.fillRect(0, 0, 768, 1024);
  let seed = 19;
  for (let i = 0; i < 4500; i++) {
    seed = (seed * 16807) % 2147483647;
    const a = seed / 2147483647;
    seed = (seed * 16807) % 2147483647;
    x.fillStyle = `rgba(49,28,19,${a * 0.12})`;
    x.fillRect(a * 768, (seed / 2147483647) * 1024, 1, 2);
  }
  x.fillStyle = "#302018";
  x.font = "125px Bebas";
  x.fillText("ORIGIN", 62, 151);
  x.fillRect(62, 190, 645, 2);
  x.font = "17px DM";
  x.fillText("SPECIALTY COFFEE / FROM THE GROUND UP.", 62, 231);
  x.font = "177px Bebas";
  x.fillText("THE GOOD", 62, 440);
  x.fillText("GROUND.", 62, 586);
  x.font = "28px DM";
  x.fillText(o.country, 62, 688);
  x.font = "19px DM";
  x.fillText(`${o.region} / SINGLE ORIGIN`, 62, 736);
  x.fillText(o.notes, 62, 792);
  x.fillRect(62, 844, 645, 2);
  x.font = "18px DM";
  x.fillText("WHOLE BEAN", 62, 900);
  x.textAlign = "right";
  x.fillText("250 G", 706, 900);
  x.textAlign = "left";
  x.font = "14px DM";
  x.fillText("GOOD COFFEE. NO SHORTCUTS.", 62, 959);
  const map = new T.CanvasTexture(c);
  map.colorSpace = T.SRGBColorSpace;
  return map;
}
function environment() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const x = c.getContext("2d");
  x.fillStyle = "#493224";
  x.fillRect(0, 0, 512, 256);
  x.fillStyle = "#fff0d3";
  x.fillRect(30, 25, 75, 170);
  x.fillStyle = "#9c6240";
  x.fillRect(280, 40, 100, 150);
  x.fillStyle = "#fce9c3";
  x.fillRect(455, 40, 20, 160);
  const map = new T.CanvasTexture(c);
  map.mapping = T.EquirectangularReflectionMapping;
  map.colorSpace = T.SRGBColorSpace;
  const p = new T.PMREMGenerator(renderer),
    target = p.fromEquirectangular(map);
  p.dispose();
  map.dispose();
  return target.texture;
}
function bagGeometry() {
  const g = new T.PlaneGeometry(1.72, 2.68, 24, 36),
    p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      v = (y + 1.34) / 2.68,
      edge = Math.pow(Math.abs(x) / 0.86, 4);
    p.setX(i, x * (1 - 0.14 * Math.pow(v, 6)));
    p.setZ(
      i,
      0.17 +
        0.28 * Math.sin(v * Math.PI) * (1 - edge) +
        Math.sin(y * 34 + x * 7) * 0.012 * edge,
    );
  }
  g.computeVertexNormals();
  return g;
}
function beanGeometry() {
  const g = new T.SphereGeometry(1, 22, 16),
    p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    let depth = z * 0.18;
    if (z > 0)
      depth -=
        Math.exp(-Math.pow((x + 0.08 * Math.sin(y * 3)) / 0.16, 2)) *
        0.07 *
        (1 - y * y);
    p.setXYZ(i, x * 0.24 * (1 + 0.08 * y), y * 0.36, depth);
  }
  g.computeVertexNormals();
  return g;
}
function build() {
  renderer = new T.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setClearColor(0, 0);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.88;
  scene = new T.Scene();
  scene.environment = environment();
  camera = new T.PerspectiveCamera(35, 1, 0.1, 40);
  camera.position.set(0, 0.3, 10);
  scene.add(new T.HemisphereLight(0xffe4c3, 0x231311, 1.2));
  const key = new T.DirectionalLight(0xffdfb5, 2.7);
  key.position.set(-3, 5, 5);
  scene.add(key);
  const rim = new T.DirectionalLight(0xd97b44, 2.3);
  rim.position.set(5, 2, -3);
  scene.add(rim);
  bag = new T.Group();
  scene.add(bag);
  bagMaterial = new T.MeshStandardMaterial({
    color: origins[origin].colour,
    roughness: 0.8,
  });
  bagPrint = new T.MeshStandardMaterial({ map: label(), roughness: 0.87 });
  const front = new T.Mesh(bagGeometry(), bagPrint);
  bag.add(front);
  const back = new T.Mesh(bagGeometry(), bagMaterial);
  back.rotation.y = Math.PI;
  bag.add(back);
  const sideMat = new T.MeshStandardMaterial({
    color: 0x8d603d,
    roughness: 0.9,
  });
  for (const side of [-1, 1]) {
    const m = new T.Mesh(new T.BoxGeometry(0.03, 2.53, 0.4), sideMat);
    m.position.x = side * 0.77;
    bag.add(m);
  }
  seam = new T.Mesh(new T.BoxGeometry(1.48, 0.095, 0.38), sideMat);
  seam.position.y = 1.31;
  bag.add(seam);
  const base = new T.Mesh(new T.BoxGeometry(1.65, 0.09, 0.42), sideMat);
  base.position.y = -1.31;
  bag.add(base);
  const crimp = new T.Group();
  for (let i = 0; i < 4; i++) {
    const m = new T.Mesh(
      new T.BoxGeometry(1.48, 0.005, 0.007),
      new T.MeshStandardMaterial({ color: 0x704a2d, roughness: 1 }),
    );
    m.position.set(0, -0.032 + i * 0.022, 0.195);
    crimp.add(m);
  }
  seam.add(crimp);
  beanMaterial = new T.MeshStandardMaterial({
    color: 0x79492d,
    roughness: 0.58,
    metalness: 0.025,
  });
  beans = new T.InstancedMesh(beanGeometry(), beanMaterial, 44);
  beans.instanceMatrix.setUsage(T.DynamicDrawUsage);
  beans.frustumCulled = false;
  scene.add(beans);
  cup = new T.Group();
  scene.add(cup);
  const ceramic = new T.MeshStandardMaterial({
    color: 0xd5bb91,
    metalness: 0.03,
    roughness: 0.28,
  });
  const points = [
    [0, 0],
    [0.5, 0],
    [0.61, 0.05],
    [0.65, 0.16],
    [0.78, 1.05],
    [0.77, 1.12],
    [0.7, 1.12],
    [0.52, 0.2],
    [0, 0.14],
  ].map((v) => new T.Vector2(...v));
  cup.add(new T.Mesh(new T.LatheGeometry(points, 64), ceramic));
  const handle = new T.Mesh(
    new T.TorusGeometry(0.36, 0.085, 12, 36, Math.PI * 1.7),
    ceramic,
  );
  handle.position.set(0.78, 0.62, 0);
  handle.rotation.z = -Math.PI * 0.85;
  handle.scale.x = 0.8;
  cup.add(handle);
  const saucer = new T.Mesh(
    new T.CylinderGeometry(1.15, 1.12, 0.065, 64),
    ceramic,
  );
  saucer.position.y = -0.055;
  cup.add(saucer);
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const x = c.getContext("2d"),
    g = x.createRadialGradient(128, 128, 5, 128, 128, 126);
  g.addColorStop(0, "#352015");
  g.addColorStop(0.87, "#56311b");
  g.addColorStop(0.94, "#af7c40");
  g.addColorStop(1, "#d0a163");
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  const coffeeMap = new T.CanvasTexture(c);
  coffeeMap.colorSpace = T.SRGBColorSpace;
  const coffee = new T.Mesh(
    new T.CircleGeometry(0.69, 64),
    new T.MeshStandardMaterial({
      map: coffeeMap,
      roughness: 0.23,
      metalness: 0.1,
    }),
  );
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 1.04;
  cup.add(coffee);
  const d = document.createElement("canvas");
  d.width = 512;
  d.height = 128;
  const dx = d.getContext("2d");
  dx.fillStyle = "#39261e";
  dx.textAlign = "center";
  dx.font = "91px Bebas";
  dx.fillText("ORIGIN", 256, 96);
  const dt = new T.CanvasTexture(d);
  dt.colorSpace = T.SRGBColorSpace;
  const decal = new T.Mesh(
    new T.PlaneGeometry(0.84, 0.2),
    new T.MeshBasicMaterial({ map: dt, transparent: true, depthWrite: false }),
  );
  decal.position.set(0, 0.55, 0.71);
  cup.add(decal);
  document.body.classList.add("webgl");
  control = createRenderControl({
    renderer,
    canvas,
    story,
    onResize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    paint,
  });
}
const dummy = new T.Object3D(),
  beanColour = new T.Color();
function paint() {
  const mobile = innerWidth < 701,
    i = Math.min(2, Math.floor(progress)),
    t = ease(progress - i),
    show = ease(progress / 0.55),
    land = ease(progress - 2);
  const x = [0, -1.6, 1.7, -1.6],
    y = [-0.95, -0.05, 0.05, 0.1],
    s = [1.16, 1.18, 0.77, 0.17];
  bag.position.set(mix(x[i], x[i + 1], t), mix(y[i], y[i + 1], t), 0);
  bag.scale.setScalar(mix(s[i], s[i + 1], t));
  bag.rotation.set(
    0.03,
    mix(-0.3, 0.2, ease(progress / 3)) + (reduced.matches ? 0 : px * 0.08),
    mix(-0.12, 0.09, ease(progress)),
  );
  bag.visible = land < 0.97;
  if (mobile) {
    const mx = [0.22, 0.66, 0.52, 0.2],
      my = [-1.2, -1.45, -1.62, -1.5],
      ms = [0.8, 0.62, 0.56, 0.13];
    bag.position.set(mix(mx[i], mx[i + 1], t), mix(my[i], my[i + 1], t), 0);
    bag.scale.setScalar(mix(ms[i], ms[i + 1], t));
  }
  if (reduced.matches) {
    bag.rotation.set(0, -0.2, -0.04);
    if (!mobile) bag.position.x = 1.8;
  }
  seam.position.y =
    1.31 +
    (reduced.matches ? 0 : Math.sin(clamp(progress / 2) * Math.PI) * 0.15);
  bagMaterial.color.set(origins[origin].colour);
  const bx = mobile ? 0.3 : mix(x[i], x[i + 1], t),
    by = mobile ? -1.1 : 0;
  beanColour.set(0xa87843).lerp(new T.Color(0x2d1710), roast / 100);
  beanMaterial.color.copy(beanColour);
  for (let n = 0; n < 44; n++) {
    const angle = (n / 44) * Math.PI * 2 + progress * 0.85,
      r = 1.1 + (n % 4) * 0.14;
    const sx = bx + Math.cos(angle) * r,
      sy = by + Math.sin(angle) * r * 0.88,
      sz = Math.sin(n * 1.8) * 0.5;
    const cx = mobile ? 0.2 : -1.6,
      cy = mobile ? -1.06 : 0.7;
    dummy.position.set(
      mix(sx, cx + Math.sin(n) * 0.3, land),
      mix(sy, cy, land),
      mix(sz, Math.cos(n) * 0.3, land),
    );
    dummy.rotation.set(n * 0.63 + progress, n * 0.4, n * 0.9 + progress);
    dummy.scale.setScalar(
      show * (1 - land * 0.97) * (mobile ? 0.34 : 0.48) * (1 + (n % 3) * 0.1),
    );
    if (reduced.matches) dummy.scale.setScalar(0);
    dummy.updateMatrix();
    beans.setMatrixAt(n, dummy.matrix);
  }
  beans.instanceMatrix.needsUpdate = true;
  cup.visible = land > 0.01;
  cup.position.set(mobile ? 0.2 : -1.6, mobile ? -1.82 : -0.95, 0);
  cup.scale.setScalar((mobile ? 0.84 : 1.65) * land);
  cup.rotation.set(0.27, -0.18, 0);
  document.querySelector(".scene-type").style.opacity = String(
    1 - ease(progress / 0.65),
  );
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
}
function scroll() {
  progress =
    clamp(
      -story.getBoundingClientRect().top / (story.offsetHeight - innerHeight),
    ) * 3;
  document.querySelector("#story-progress").style.width =
    `${(progress / 3) * 100}%`;
  document.querySelector("#chapter-count").textContent =
    `0${Math.min(4, Math.floor(progress) + 1)} / 04`;
  control?.invalidate();
}
addEventListener("scroll", scroll, { passive: true });
addEventListener(
  "pointermove",
  (e) => {
    if (reduced.matches) return;
    px = e.clientX / innerWidth - 0.5;
    control?.invalidate();
  },
  { passive: true },
);
reduced.addEventListener("change", () => control?.invalidate());
canvas.addEventListener("webglcontextlost", (e) => {
  e.preventDefault();
  control?.dispose();
  canvas.hidden = true;
  document.body.classList.remove("webgl");
});
Promise.all([
  document.fonts.load("100px Bebas"),
  document.fonts.load("30px DM"),
])
  .catch(() => {})
  .then(() => {
    try {
      build();
      scroll();
    } catch (e) {
      canvas.hidden = true;
      document.body.classList.remove("webgl");
      document.documentElement.dataset.renderMode = "fallback";
      console.warn("Using the static coffee illustration.", e.message);
    }
  });
