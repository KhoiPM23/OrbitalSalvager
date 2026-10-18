import * as THREE from 'three';

/**
 * Procedural PBR and diffuse canvas textures for high-fidelity space environment.
 * Generated entirely client-side without external asset dependencies.
 */
export class ProceduralTextures {
  private static hullTexture: THREE.CanvasTexture | null = null;
  private static solarTexture: THREE.CanvasTexture | null = null;
  private static asteroidDiffuse: THREE.CanvasTexture | null = null;
  private static asteroidBump: THREE.CanvasTexture | null = null;
  private static hazardTexture: THREE.CanvasTexture | null = null;
  private static singularityTexture: THREE.CanvasTexture | null = null;

  public static getHullTexture(): THREE.CanvasTexture {
    if (this.hullTexture) return this.hullTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base gunmetal composite hull
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#1a2234');
    grad.addColorStop(0.5, '#0d1522');
    grad.addColorStop(1, '#1e293b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Fine brushed metal micro-noise
    const imgData = ctx.getImageData(0, 0, 512, 512);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 18;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Armor plating grid seams
    ctx.strokeStyle = '#050a12';
    ctx.lineWidth = 3;
    for (let x = 64; x < 512; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 64; y < 512; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // High-tech luminescent energy conduits
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(128, 64);
    ctx.lineTo(256, 192);
    ctx.lineTo(384, 192);
    ctx.lineTo(448, 320);
    ctx.stroke();

    // Secondary cyan chevron badges
    ctx.fillStyle = '#00ffaa';
    ctx.beginPath();
    ctx.moveTo(256, 256);
    ctx.lineTo(276, 276);
    ctx.lineTo(268, 276);
    ctx.lineTo(256, 264);
    ctx.lineTo(244, 276);
    ctx.lineTo(236, 276);
    ctx.closePath();
    ctx.fill();

    // Rivets at panel intersections
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#64748b';
    for (let x = 64; x < 512; x += 128) {
      for (let y = 64; y < 512; y += 128) {
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    this.hullTexture = new THREE.CanvasTexture(canvas);
    this.hullTexture.wrapS = THREE.RepeatWrapping;
    this.hullTexture.wrapT = THREE.RepeatWrapping;
    return this.hullTexture;
  }

  public static getSolarTexture(): THREE.CanvasTexture {
    if (this.solarTexture) return this.solarTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Deep photovoltaic silicon blue
    ctx.fillStyle = '#0a1636';
    ctx.fillRect(0, 0, 256, 256);

    // Silicon solar cells grid
    const cellSize = 32;
    for (let x = 4; x < 256; x += cellSize) {
      for (let y = 4; y < 256; y += cellSize) {
        const cellGrad = ctx.createLinearGradient(x, y, x + cellSize - 4, y + cellSize - 4);
        cellGrad.addColorStop(0, '#1e3a8a');
        cellGrad.addColorStop(0.5, '#172554');
        cellGrad.addColorStop(1, '#2563eb');
        ctx.fillStyle = cellGrad;
        ctx.fillRect(x, y, cellSize - 6, cellSize - 6);

        // Thin silver busbar contacts
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x + (cellSize - 6) / 2, y);
        ctx.lineTo(x + (cellSize - 6) / 2, y + cellSize - 6);
        ctx.stroke();
      }
    }

    this.solarTexture = new THREE.CanvasTexture(canvas);
    this.solarTexture.wrapS = THREE.RepeatWrapping;
    this.solarTexture.wrapT = THREE.RepeatWrapping;
    return this.solarTexture;
  }

  public static getAsteroidTextures(): { diffuse: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
    if (this.asteroidDiffuse && this.asteroidBump) {
      return { diffuse: this.asteroidDiffuse, bump: this.asteroidBump };
    }

    const size = 512;
    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = size;
    diffCanvas.height = size;
    const diffCtx = diffCanvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = size;
    bumpCanvas.height = size;
    const bumpCtx = bumpCanvas.getContext('2d')!;

    // Rocky charcoal base
    diffCtx.fillStyle = '#262626';
    diffCtx.fillRect(0, 0, size, size);

    bumpCtx.fillStyle = '#808080';
    bumpCtx.fillRect(0, 0, size, size);

    // Perlin-style craters and rock layers
    for (let c = 0; c < 28; c++) {
      const cx = Math.random() * size;
      const cy = Math.random() * size;
      const rad = 12 + Math.random() * 45;

      // Diffuse crater shadow/rim
      const craterGrad = diffCtx.createRadialGradient(cx, cy, rad * 0.2, cx, cy, rad);
      craterGrad.addColorStop(0, '#121212');
      craterGrad.addColorStop(0.7, '#1f1f1f');
      craterGrad.addColorStop(0.9, '#404040'); // bright lit rim
      craterGrad.addColorStop(1, '#262626');
      diffCtx.fillStyle = craterGrad;
      diffCtx.beginPath();
      diffCtx.arc(cx, cy, rad, 0, Math.PI * 2);
      diffCtx.fill();

      // Bump map indentation
      const bumpGrad = bumpCtx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      bumpGrad.addColorStop(0, '#202020'); // deep depression
      bumpGrad.addColorStop(0.8, '#505050');
      bumpGrad.addColorStop(0.95, '#e0e0e0'); // raised lip
      bumpGrad.addColorStop(1, '#808080');
      bumpCtx.fillStyle = bumpGrad;
      bumpCtx.beginPath();
      bumpCtx.arc(cx, cy, rad, 0, Math.PI * 2);
      bumpCtx.fill();
    }

    // Mineral vein streaks (pyrite / copper oxide)
    diffCtx.strokeStyle = 'rgba(180, 83, 9, 0.35)';
    diffCtx.lineWidth = 3;
    for (let v = 0; v < 6; v++) {
      diffCtx.beginPath();
      diffCtx.moveTo(Math.random() * size, Math.random() * size);
      diffCtx.bezierCurveTo(
        Math.random() * size, Math.random() * size,
        Math.random() * size, Math.random() * size,
        Math.random() * size, Math.random() * size
      );
      diffCtx.stroke();
    }

    this.asteroidDiffuse = new THREE.CanvasTexture(diffCanvas);
    this.asteroidBump = new THREE.CanvasTexture(bumpCanvas);
    this.asteroidDiffuse.wrapS = THREE.RepeatWrapping;
    this.asteroidDiffuse.wrapT = THREE.RepeatWrapping;
    this.asteroidBump.wrapS = THREE.RepeatWrapping;
    this.asteroidBump.wrapT = THREE.RepeatWrapping;

    return { diffuse: this.asteroidDiffuse, bump: this.asteroidBump };
  }

  public static getHazardTexture(): THREE.CanvasTexture {
    if (this.hazardTexture) return this.hazardTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Yellow background
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 0, 256, 256);

    // Carbon black 45-degree diagonal stripes
    ctx.fillStyle = '#0f172a';
    const stripeWidth = 32;
    for (let x = -256; x < 512; x += stripeWidth * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth + 256, 256);
      ctx.lineTo(x + 256, 256);
      ctx.closePath();
      ctx.fill();
    }

    this.hazardTexture = new THREE.CanvasTexture(canvas);
    this.hazardTexture.wrapS = THREE.RepeatWrapping;
    this.hazardTexture.wrapT = THREE.RepeatWrapping;
    return this.hazardTexture;
  }

  public static getSingularityTexture(): THREE.CanvasTexture {
    if (this.singularityTexture) return this.singularityTexture;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 250);
    grad.addColorStop(0, 'rgba(0, 229, 255, 0.95)');
    grad.addColorStop(0.2, 'rgba(168, 85, 247, 0.85)');
    grad.addColorStop(0.5, 'rgba(236, 72, 153, 0.45)');
    grad.addColorStop(0.8, 'rgba(56, 189, 248, 0.15)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Spiral swirl arms
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2.5;
    for (let arm = 0; arm < 4; arm++) {
      const baseAngle = (arm * Math.PI) / 2;
      ctx.beginPath();
      for (let r = 24; r < 240; r += 4) {
        const theta = baseAngle + r * 0.045;
        const x = 256 + Math.cos(theta) * r;
        const y = 256 + Math.sin(theta) * (r * 0.7);
        if (r === 24) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    this.singularityTexture = new THREE.CanvasTexture(canvas);
    return this.singularityTexture;
  }
}
