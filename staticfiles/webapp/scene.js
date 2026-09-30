const heroCanvas = document.querySelector('#hero-canvas');
const finalCanvas = document.querySelector('#final-canvas');
const hero = document.querySelector('.hero');
const finalSection = document.querySelector('.contact-section');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function initFinalParticleWord() {
  if (!finalCanvas || reduceMotion) return;
  const context = finalCanvas.getContext('2d', { alpha: true });
  if (!context) return;
  const particles = [];
  let width = 0;
  let height = 0;
  let active = false;
  let frame = 0;
  let startTime = 0;
  const mobile = matchMedia('(max-width: 760px)').matches;
  const particleCount = mobile ? 54 : 104;

  function resize() {
    const rect = finalCanvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.4);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    finalCanvas.width = Math.round(width * ratio);
    finalCanvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    makeParticles();
  }

  function makeParticles() {
    const offscreen = document.createElement('canvas');
    offscreen.width = Math.ceil(width);
    offscreen.height = Math.ceil(height);
    const offscreenContext = offscreen.getContext('2d', { willReadFrequently: true });
    const fontSize = Math.min(mobile ? 47 : 94, width * (mobile ? .18 : .105));
    offscreenContext.font = `600 ${fontSize}px "Space Grotesk", sans-serif`;
    offscreenContext.textAlign = 'center';
    offscreenContext.textBaseline = 'middle';
    offscreenContext.fillStyle = '#fff';
    offscreenContext.fillText('AMLOPA', width * .52, height * .5);
    const pixels = offscreenContext.getImageData(0, 0, offscreen.width, offscreen.height).data;
    const targets = [];
    const gap = mobile ? 7 : 9;
    for (let y = Math.round(height * .34); y < height * .67; y += gap) {
      for (let x = Math.round(width * .13); x < width * .9; x += gap) {
        if (pixels[(y * offscreen.width + x) * 4 + 3] > 100) targets.push({ x, y });
      }
    }
    particles.length = 0;
    for (let index = 0; index < particleCount; index += 1) {
      const target = targets[Math.floor(index * targets.length / particleCount)] || { x: width / 2, y: height / 2 };
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.max(width, height) * (.45 + Math.random() * .5);
      particles.push({ x: width / 2 + Math.cos(angle) * distance, y: height / 2 + Math.sin(angle) * distance, originX: width / 2 + Math.cos(angle) * distance, originY: height / 2 + Math.sin(angle) * distance, targetX: target.x, targetY: target.y, phase: Math.random() * Math.PI * 2 });
    }
  }

  function draw(now) {
    frame = 0;
    if (!active || document.hidden) return;
    if (!startTime) startTime = now;
    const progress = clamp((now - startTime) / 1800, 0, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = 'lighter';
    context.fillStyle = '#a8c8ff';
    context.strokeStyle = 'rgba(130, 174, 242, .13)';
    const positions = particles.map((particle) => ({
      x: particle.originX + (particle.targetX - particle.originX) * ease,
      y: particle.originY + (particle.targetY - particle.originY) * ease + Math.sin(now * .0007 + particle.phase) * (1 - ease) * 10,
    }));
    for (let index = 0; index < positions.length; index += 1) {
      const point = positions[index];
      if (progress > .72) {
        for (let peer = index + 1; peer < Math.min(index + 5, positions.length); peer += 1) {
          const next = positions[peer];
          const distance = Math.hypot(point.x - next.x, point.y - next.y);
          if (distance < 13) {
            context.globalAlpha = (1 - distance / 13) * .2;
            context.beginPath();
            context.moveTo(point.x, point.y);
            context.lineTo(next.x, next.y);
            context.stroke();
          }
        }
      }
      context.globalAlpha = .35 + Math.sin(now * .001 + particles[index].phase) * .12;
      context.beginPath();
      context.arc(point.x, point.y, mobile ? 1 : 1.35, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
    finalCanvas.dataset.particleCount = String(particles.length);
    frame = window.requestAnimationFrame(draw);
  }

  const observer = new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting;
    if (active) {
      startTime = 0;
      if (!frame) frame = window.requestAnimationFrame(draw);
    } else if (frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }
  }, { threshold: .12 });
  observer.observe(finalSection);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && active && !frame) frame = window.requestAnimationFrame(draw);
  });
  new ResizeObserver(resize).observe(finalCanvas);
  resize();
}

function initHeroScene(THREE) {
  if (!heroCanvas || reduceMotion || !('WebGLRenderingContext' in window)) return;
  const mobile = matchMedia('(max-width: 760px)').matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: heroCanvas, alpha: true, antialias: !mobile, powerPreference: 'low-power' });
  } catch {
    hero.dataset.scene = 'fallback';
    return;
  }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, .1, 60);
  camera.position.set(0, 0, 5.5);
  const world = new THREE.Group();
  world.position.x = mobile ? 0 : 1.25;
  scene.add(world);

  const coreGeometry = new THREE.IcosahedronGeometry(1.08, 3);
  const coreEdges = new THREE.EdgesGeometry(coreGeometry, 9);
  const coreWire = new THREE.LineSegments(coreEdges, new THREE.LineBasicMaterial({ color: 0x86b7ff, transparent: true, opacity: .25 }));
  world.add(coreWire);
  const innerCore = new THREE.Mesh(new THREE.IcosahedronGeometry(.72, 2), new THREE.MeshBasicMaterial({ color: 0x4b85d6, transparent: true, opacity: .09, wireframe: true }));
  world.add(innerCore);
  const coreGlow = new THREE.Mesh(new THREE.SphereGeometry(.56, 24, 24), new THREE.MeshBasicMaterial({ color: 0x1c4b86, transparent: true, opacity: .12, blending: THREE.AdditiveBlending, depthWrite: false }));
  world.add(coreGlow);

  const surfacePoints = mobile ? 480 : 1450;
  const positions = new Float32Array(surfacePoints * 3);
  const colors = new Float32Array(surfacePoints * 3);
  const pointColor = new THREE.Color();
  for (let index = 0; index < surfacePoints; index += 1) {
    const y = 1 - (index / (surfacePoints - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const angle = Math.PI * (3 - Math.sqrt(5)) * index;
    const shell = 1.08 + Math.random() * .58;
    positions[index * 3] = Math.cos(angle) * radius * shell;
    positions[index * 3 + 1] = y * shell;
    positions[index * 3 + 2] = Math.sin(angle) * radius * shell;
    pointColor.setHSL(.59 + Math.random() * .04, .6, .57 + Math.random() * .2);
    colors[index * 3] = pointColor.r;
    colors[index * 3 + 1] = pointColor.g;
    colors[index * 3 + 2] = pointColor.b;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const particleMaterial = new THREE.PointsMaterial({ size: mobile ? .026 : .019, vertexColors: true, transparent: true, opacity: .82, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
  const particleCloud = new THREE.Points(particleGeometry, particleMaterial);
  world.add(particleCloud);

  const ambientCount = mobile ? 180 : 560;
  const ambientPositions = new Float32Array(ambientCount * 3);
  for (let index = 0; index < ambientCount; index += 1) {
    const theta = Math.random() * Math.PI * 2;
    const z = Math.random() * 2 - 1;
    const ring = Math.sqrt(1 - z * z);
    const radius = 1.65 + Math.random() * 1.45;
    ambientPositions[index * 3] = Math.cos(theta) * ring * radius;
    ambientPositions[index * 3 + 1] = z * radius;
    ambientPositions[index * 3 + 2] = Math.sin(theta) * ring * radius;
  }
  const ambientGeometry = new THREE.BufferGeometry();
  ambientGeometry.setAttribute('position', new THREE.BufferAttribute(ambientPositions, 3));
  const ambientField = new THREE.Points(ambientGeometry, new THREE.PointsMaterial({ color: 0x739ee0, size: mobile ? .015 : .012, transparent: true, opacity: .43, blending: THREE.AdditiveBlending, depthWrite: false }));
  world.add(ambientField);

  const networkNodes = [];
  const networkCount = mobile ? 38 : 76;
  for (let index = 0; index < networkCount; index += 1) {
    const y = 1 - (index / (networkCount - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const angle = Math.PI * (3 - Math.sqrt(5)) * index;
    networkNodes.push(new THREE.Vector3(Math.cos(angle) * radius * 1.17, y * 1.17, Math.sin(angle) * radius * 1.17));
  }
  const edges = [];
  for (let index = 0; index < networkNodes.length; index += 1) {
    let nearestDistance = 10;
    let nearestIndex = -1;
    for (let other = index + 1; other < networkNodes.length; other += 1) {
      const distance = networkNodes[index].distanceTo(networkNodes[other]);
      if (distance < .52) edges.push(networkNodes[index], networkNodes[other]);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = other;
      }
    }
    if (nearestIndex >= 0 && nearestDistance > .52) edges.push(networkNodes[index], networkNodes[nearestIndex]);
  }
  const networkGeometry = new THREE.BufferGeometry().setFromPoints(edges);
  const networkLines = new THREE.LineSegments(networkGeometry, new THREE.LineBasicMaterial({ color: 0x6895d5, transparent: true, opacity: .19, depthWrite: false }));
  world.add(networkLines);

  const nodeDirections = [
    new THREE.Vector3(1, .12, .28), new THREE.Vector3(-1, .24, -.18), new THREE.Vector3(.28, 1, .1), new THREE.Vector3(-.35, -1, .18),
    new THREE.Vector3(.2, .2, 1), new THREE.Vector3(-.15, .3, -1), new THREE.Vector3(.72, -.68, .18), new THREE.Vector3(-.76, .62, -.13),
  ];
  const nodeGeometry = new THREE.SphereGeometry(.026, 8, 8);
  const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xb4d1ff });
  const nodeLines = [];
  nodeDirections.forEach((direction, index) => {
    const point = direction.clone().normalize().multiplyScalar(1.72 + (index % 3) * .18);
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
    node.position.copy(point);
    world.add(node);
    const connector = new THREE.Line(new THREE.BufferGeometry().setFromPoints([direction.clone().normalize().multiplyScalar(.45), point]), new THREE.LineBasicMaterial({ color: 0x7fa8e5, transparent: true, opacity: .3 }));
    world.add(connector);
    nodeLines.push(connector);
  });

  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x5d89c4, transparent: true, opacity: .13, wireframe: true });
  const ringOne = new THREE.Mesh(new THREE.TorusGeometry(1.82, .004, 5, 140), ringMaterial);
  ringOne.rotation.set(.8, .3, -.38);
  world.add(ringOne);
  const ringTwo = new THREE.Mesh(new THREE.TorusGeometry(2.02, .003, 5, 140), ringMaterial.clone());
  ringTwo.rotation.set(-.6, .4, .57);
  world.add(ringTwo);

  const flowCurves = nodeDirections.slice(0, 5).map((direction, index) => {
    const end = direction.clone().normalize().multiplyScalar(1.68 + (index % 3) * .18);
    const start = direction.clone().normalize().multiplyScalar(.52);
    const middle = start.clone().lerp(end, .52).add(new THREE.Vector3(0, .12 * (index % 2 ? 1 : -1), 0));
    return new THREE.CatmullRomCurve3([start, middle, end]);
  });
  const flowParticleCount = mobile ? 8 : 22;
  const flowPositions = new Float32Array(flowParticleCount * 3);
  const flowGeometry = new THREE.BufferGeometry();
  flowGeometry.setAttribute('position', new THREE.BufferAttribute(flowPositions, 3));
  const flowParticles = new THREE.Points(flowGeometry, new THREE.PointsMaterial({ color: 0xe0edff, size: mobile ? .048 : .037, transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false }));
  world.add(flowParticles);

  let width = 1;
  let height = 1;
  let pointerX = 0;
  let pointerY = 0;
  let scrollProgress = 0;
  let visible = true;
  let animationFrame = 0;
  let firstPixelCheck = false;
  const clock = new THREE.Clock();
  const flowOffsets = Array.from({ length: flowParticleCount }, (_, index) => index / flowParticleCount);

  function resize() {
    const rect = hero.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.35));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    heroCanvas.dataset.viewport = mobile ? 'mobile' : 'desktop';
  }

  function updatePointer(event) {
    const rect = hero.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width - .5) * 2;
    pointerY = ((event.clientY - rect.top) / rect.height - .5) * 2;
  }

  function updateScroll() {
    scrollProgress = clamp(-hero.getBoundingClientRect().top / Math.max(hero.offsetHeight, 1), 0, 1);
  }

  function checkPixels() {
    if (firstPixelCheck || !renderer) return;
    firstPixelCheck = true;
    const gl = renderer.getContext();
    const pixelData = new Uint8Array(24 * 24 * 4);
    const sampleX = Math.floor(width * renderer.getPixelRatio() * (mobile ? .5 : .68)) - 12;
    const sampleY = Math.floor(height * renderer.getPixelRatio() * .5) - 12;
    gl.readPixels(Math.max(0, sampleX), Math.max(0, sampleY), 24, 24, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);
    let illuminated = 0;
    for (let index = 0; index < pixelData.length; index += 4) {
      if (pixelData[index] + pixelData[index + 1] + pixelData[index + 2] > 34 && pixelData[index + 3] > 8) illuminated += 1;
    }
    heroCanvas.dataset.pixelSamples = String(illuminated);
  }

  function render() {
    animationFrame = 0;
    if (!visible || document.hidden) return;
    const elapsed = clock.getElapsedTime();
    const intro = clamp(elapsed / 1.15, 0, 1);
    const introEase = 1 - Math.pow(1 - intro, 3);
    const targetX = (mobile ? 0 : 1.25) + pointerX * .13;
    world.position.x += (targetX - world.position.x) * .045;
    world.rotation.y += .0011;
    world.rotation.y += (pointerX * .17 + scrollProgress * .19 - world.rotation.y) * .015;
    world.rotation.x += (pointerY * .12 + scrollProgress * .11 - world.rotation.x) * .025;
    const scale = introEase * (1 - scrollProgress * .12);
    world.scale.setScalar(scale);
    particleMaterial.opacity = .82 * introEase;
    ambientField.material.opacity = .4 * introEase;
    coreWire.material.opacity = .23 * introEase;
    coreWire.rotation.y = elapsed * .065;
    innerCore.rotation.x = elapsed * .08;
    innerCore.rotation.y = -elapsed * .11;
    coreGlow.scale.setScalar(.93 + Math.sin(elapsed * 1.3) * .045);
    ringOne.rotation.z += .0007;
    ringTwo.rotation.x -= .00045;
    const flowAttribute = flowGeometry.getAttribute('position');
    for (let index = 0; index < flowParticleCount; index += 1) {
      const curve = flowCurves[index % flowCurves.length];
      const progress = (elapsed * (mobile ? .09 : .12) + flowOffsets[index]) % 1;
      const point = curve.getPointAt(progress);
      flowAttribute.setXYZ(index, point.x, point.y, point.z);
    }
    flowAttribute.needsUpdate = true;
    camera.position.z = 5.5 + scrollProgress * .56;
    camera.position.x += (pointerX * .12 - camera.position.x) * .025;
    camera.position.y += (-pointerY * .08 - camera.position.y) * .025;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    heroCanvas.dataset.rendered = 'true';
    if (!firstPixelCheck && elapsed > .3) checkPixels();
    animationFrame = window.requestAnimationFrame(render);
  }

  hero.addEventListener('pointermove', updatePointer, { passive: true });
  hero.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
  window.addEventListener('scroll', updateScroll, { passive: true });
  new ResizeObserver(resize).observe(hero);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && animationFrame) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    } else if (!document.hidden && visible && !animationFrame) {
      animationFrame = window.requestAnimationFrame(render);
    }
  });
  hero.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    visible = false;
    heroCanvas.dataset.scene = 'fallback';
  });
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !animationFrame) animationFrame = window.requestAnimationFrame(render);
    else if (!visible && animationFrame) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
  }, { threshold: 0 });
  visibilityObserver.observe(hero);
  resize();
  updateScroll();
  heroCanvas.dataset.scene = 'ready';
  animationFrame = window.requestAnimationFrame(render);
}

initFinalParticleWord();
if (!reduceMotion && heroCanvas) {
  import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js')
    .then(initHeroScene)
    .catch(() => { hero.dataset.scene = 'fallback'; });
} else if (hero) {
  hero.dataset.scene = reduceMotion ? 'reduced-motion' : 'fallback';
}
