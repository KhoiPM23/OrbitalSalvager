import { SpaceEngine } from '../physics/spaceEngine';
import { GravityAnomaly, ShipState } from '../physics/types';

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class SpaceView {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animTimer = 0;
  private screenShakeAmount = 0;

  private stars: Star[] = [];
  private particles: Particle[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No 2D context for SpaceView');
    this.ctx = context;

    this.initStarfield();
  }

  private initStarfield(): void {
    const w = this.canvas.width || 1200;
    const h = this.canvas.height || 700;
    const starColors = ['#ffffff', '#a5f3fc', '#cbd5e1', '#fde68a', '#c084fc'];

    for (let i = 0; i < 180; i++) {
      this.stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: 0.6 + Math.random() * 1.6,
        baseAlpha: 0.2 + Math.random() * 0.7,
        twinkleSpeed: 1.5 + Math.random() * 3.5,
        color: starColors[Math.floor(Math.random() * starColors.length)]
      });
    }
  }

  public triggerShake(amount = 8): void {
    this.screenShakeAmount = amount;
  }

  public render(engine: SpaceEngine): void {
    this.animTimer += 0.04;
    const { ctx } = this;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const shipBody = engine.getShipBody();
    const shipState = engine.getShipState();
    const salvageMap = engine.getSalvageBodies();
    const asteroids = engine.getAsteroidHazards();
    const bay = engine.getRecoveryBay();
    const tether = engine.getTetherConstraint();
    const gravityWells = engine.getGravityWells();

    ctx.save();

    // 1. Screen Shake
    if (this.screenShakeAmount > 0.1) {
      const sx = (Math.random() * 2 - 1) * this.screenShakeAmount;
      const sy = (Math.random() * 2 - 1) * this.screenShakeAmount;
      ctx.translate(sx, sy);
      this.screenShakeAmount *= 0.88;
    }

    // 2. Deep Space Backdrop with Nebula Clouds
    ctx.fillStyle = '#03060c';
    ctx.fillRect(0, 0, w, h);

    // Nebula dust clouds
    const grad1 = ctx.createRadialGradient(280, 200, 20, 280, 200, 360);
    grad1.addColorStop(0, 'rgba(56, 189, 248, 0.06)');
    grad1.addColorStop(0.5, 'rgba(99, 102, 241, 0.03)');
    grad1.addColorStop(1, 'rgba(3, 6, 12, 0)');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, w, h);

    const grad2 = ctx.createRadialGradient(920, 520, 30, 920, 520, 420);
    grad2.addColorStop(0, 'rgba(168, 85, 247, 0.05)');
    grad2.addColorStop(0.6, 'rgba(236, 72, 153, 0.02)');
    grad2.addColorStop(1, 'rgba(3, 6, 12, 0)');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, w, h);

    // Twinkling Starfield
    for (const star of this.stars) {
      const alpha = star.baseAlpha * (0.65 + 0.35 * Math.sin(this.animTimer * star.twinkleSpeed + star.x));
      ctx.fillStyle = star.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Subtle coordinate navigation grid
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 3. Gravity Wells / Micro-Singularities
    for (const gw of gravityWells) {
      this.drawGravityWell(ctx, gw);
    }

    // 4. Recovery Bay (Mothership Dock)
    this.drawRecoveryBay(ctx, bay);

    // 5. Asteroid Hazards
    for (const ast of asteroids) {
      this.drawAsteroid(ctx, ast, shipBody.position);
    }

    // 6. Tether Cable
    if (tether && tether.bodyB) {
      this.drawTether(ctx, shipBody.position, tether.bodyB.position, shipState.tetherTension);
    }

    // 7. Salvage Items
    for (const entry of salvageMap.values()) {
      if (entry.item.isSalvaged) continue;
      this.drawSalvageItem(ctx, entry.body.position, entry.item);
    }

    // 8. Flight Trajectory & Gravitational Slingshot Curve
    const trajectory = engine.predictTrajectory(60, 1.2);
    if (trajectory.length > 2) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(shipBody.position.x, shipBody.position.y);
      for (const pt of trajectory) {
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      // Slingshot trajectory apex indicator
      const lastPt = trajectory[trajectory.length - 1];
      ctx.fillStyle = '#00e5ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(lastPt.x, lastPt.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 9. Particle Updates & Rendering (Exhaust sparks & RCS puffs)
    this.updateAndDrawParticles(ctx);

    // 9.5. Tactical Target Lock Reticle
    this.drawTargetLockReticle(ctx, shipState, salvageMap);

    // 10. Player Spacecraft (2.5D Metallic Chassis)
    this.drawPlayerShip(ctx, shipBody, shipState);

    // 11. Navigational Reticle towards nearest salvage item
    this.drawNavArrow(ctx, shipBody.position, salvageMap);

    ctx.restore();
  }

  private drawGravityWell(
    ctx: CanvasRenderingContext2D,
    gw: GravityAnomaly
  ): void {
    ctx.save();
    const { x, y } = gw;
    const pullRadius = gw.radius;

    // Pull influence boundary
    ctx.save();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(x, y, pullRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Inward gravitational flow vectors (animated suction effect)
    const numRays = 12;
    ctx.save();
    ctx.strokeStyle = 'rgba(192, 132, 252, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i < numRays; i++) {
      const angle = (i / numRays) * Math.PI * 2 + (this.animTimer * 0.2);
      const phase = (this.animTimer * 1.5 + i * 0.5) % 1;
      const r1 = pullRadius * (1 - phase * 0.7);
      const r2 = r1 - 25;
      if (r2 > 20) {
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * r1, y + Math.sin(angle) * r1);
        ctx.lineTo(x + Math.cos(angle) * r2, y + Math.sin(angle) * r2);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Swirling Accretion Disk
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.animTimer * 0.8);

    const accretionGrad = ctx.createRadialGradient(0, 0, 18, 0, 0, 75);
    accretionGrad.addColorStop(0, 'rgba(0, 229, 255, 0.85)');
    accretionGrad.addColorStop(0.3, 'rgba(168, 85, 247, 0.65)');
    accretionGrad.addColorStop(0.7, 'rgba(236, 72, 153, 0.3)');
    accretionGrad.addColorStop(1, 'rgba(3, 6, 12, 0)');

    ctx.fillStyle = accretionGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 75, 42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Spiral accretion filaments
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 4; a += 0.2) {
      const r = 18 + a * 4.5;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * (r * 0.55);
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();

    // Gravitational lensing photon ring
    ctx.save();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(x, y, 22 + Math.sin(this.animTimer * 3) * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Event Horizon (Absolute Void Core)
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Warning marker
    ctx.fillStyle = '#c084fc';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ MICRO-SINGULARITY', x, y + pullRadius + 14);

    ctx.restore();
  }

  private drawRecoveryBay(
    ctx: CanvasRenderingContext2D,
    bay: { x: number; y: number; width: number; height: number }
  ): void {
    ctx.save();

    // Bay containment backdrop
    const bayGrad = ctx.createLinearGradient(bay.x, bay.y, bay.x + bay.width, bay.y + bay.height);
    bayGrad.addColorStop(0, 'rgba(0, 255, 170, 0.08)');
    bayGrad.addColorStop(1, 'rgba(0, 229, 255, 0.03)');
    ctx.fillStyle = bayGrad;
    ctx.fillRect(bay.x, bay.y, bay.width, bay.height);

    // Industrial perimeter frame
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 12;
    ctx.strokeRect(bay.x, bay.y, bay.width, bay.height);

    // Hazard chevron corner markings
    ctx.fillStyle = 'rgba(0, 255, 170, 0.5)';
    const cornerSize = 14;
    // Top-left
    ctx.fillRect(bay.x, bay.y, cornerSize, 3);
    ctx.fillRect(bay.x, bay.y, 3, cornerSize);
    // Top-right
    ctx.fillRect(bay.x + bay.width - cornerSize, bay.y, cornerSize, 3);
    ctx.fillRect(bay.x + bay.width - 3, bay.y, 3, cornerSize);
    // Bottom-left
    ctx.fillRect(bay.x, bay.y + bay.height - 3, cornerSize, 3);
    ctx.fillRect(bay.x, bay.y + bay.height - cornerSize, 3, cornerSize);
    // Bottom-right
    ctx.fillRect(bay.x + bay.width - cornerSize, bay.y + bay.height - 3, cornerSize, 3);
    ctx.fillRect(bay.x + bay.width - 3, bay.y + bay.height - cornerSize, 3, cornerSize);

    // Animated tractor beam chevron rings
    const chevronPulse = (Math.sin(this.animTimer * 4) + 1) * 0.5;
    ctx.fillStyle = `rgba(0, 255, 170, ${0.12 + chevronPulse * 0.18})`;
    ctx.beginPath();
    ctx.arc(bay.x + bay.width / 2, bay.y + bay.height / 2, 45 + chevronPulse * 15, 0, Math.PI * 2);
    ctx.stroke();

    // Laser crosshair
    const cx = bay.x + bay.width / 2;
    const cy = bay.y + bay.height / 2;
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy);
    ctx.lineTo(cx + 20, cy);
    ctx.moveTo(cx, cy - 20);
    ctx.lineTo(cx, cy + 20);
    ctx.stroke();

    ctx.fillStyle = '#00ffaa';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RECOVERY BAY', cx, cy + 34);
    ctx.restore();
  }

  private drawAsteroid(
    ctx: CanvasRenderingContext2D,
    ast: { x: number; y: number; radius: number; sides: number },
    shipPos: { x: number; y: number }
  ): void {
    ctx.save();
    const distToShip = Math.hypot(ast.x - shipPos.x, ast.y - shipPos.y);
    const isProximityAlert = distToShip < ast.radius + 60;

    // Outer glow / proximity alert
    ctx.shadowColor = isProximityAlert ? '#ef4444' : '#f59e0b';
    ctx.shadowBlur = isProximityAlert ? 16 : 8;

    // Rock shading gradient (directional light from top-left)
    const rockGrad = ctx.createRadialGradient(
      ast.x - ast.radius * 0.3,
      ast.y - ast.radius * 0.3,
      ast.radius * 0.1,
      ast.x,
      ast.y,
      ast.radius
    );
    rockGrad.addColorStop(0, '#2d3748');
    rockGrad.addColorStop(0.7, '#1a202c');
    rockGrad.addColorStop(1, '#0f172a');

    ctx.fillStyle = rockGrad;
    ctx.strokeStyle = isProximityAlert ? '#ef4444' : '#f59e0b';
    ctx.lineWidth = 2;

    ctx.beginPath();
    for (let i = 0; i < ast.sides; i++) {
      const a = (i / ast.sides) * Math.PI * 2;
      const px = ast.x + Math.cos(a) * ast.radius;
      const py = ast.y + Math.sin(a) * ast.radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crater details
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(ast.x + ast.radius * 0.25, ast.y - ast.radius * 0.2, ast.radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(ast.x - ast.radius * 0.3, ast.y + ast.radius * 0.25, ast.radius * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Warning marker in center
    ctx.fillStyle = isProximityAlert ? '#ef4444' : '#f59e0b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ HAZARD', ast.x, ast.y + 3);

    ctx.restore();
  }

  private drawTether(
    ctx: CanvasRenderingContext2D,
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    tension: number
  ): void {
    ctx.save();

    let cableColor = '#00e5ff';
    if (tension > 0.8) cableColor = '#ef4444';
    else if (tension > 0.45) cableColor = '#f59e0b';

    ctx.strokeStyle = cableColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = cableColor;
    ctx.shadowBlur = 12;

    // Dynamic physical catenary sag curve
    const sagAmount = (1 - tension) * 22;
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2 + sagAmount;

    // Laser core
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
    ctx.stroke();

    // White core laser line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
    ctx.stroke();

    // High tension electrical spark discharges
    if (tension > 0.75) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const t = (this.animTimer * 4 + i * 0.33) % 1;
        const sx = p1.x * (1 - t) + p2.x * t + (Math.random() * 8 - 4);
        const sy = p1.y * (1 - t) + p2.y * t + (Math.random() * 8 - 4);
        ctx.beginPath();
        ctx.arc(sx, sy, 2 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Tension readout tag
    ctx.fillStyle = cableColor;
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`TENSION: ${(tension * 100).toFixed(0)}%`, midX, midY - 8);

    ctx.restore();
  }

  private drawSalvageItem(
    ctx: CanvasRenderingContext2D,
    pos: { x: number; y: number },
    item: { type: string; name: string; radius: number; mass: number; color: string }
  ): void {
    ctx.save();
    const r = item.radius;

    // Outer beacon pulse
    const beaconPulse = (Math.sin(this.animTimer * 5) + 1) * 0.5;
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3 + beaconPulse * 0.4;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r + 4 + beaconPulse * 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // Item Body
    ctx.fillStyle = item.color;
    ctx.shadowColor = item.color;
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Metallic rim ring
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Type-specific inner details
    if (item.type === 'CORE' || item.type === 'TITANIUM_REACTOR_CORE') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Rotating magnetic field arms
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(this.animTimer * 2);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-r * 0.6, -r * 0.6, r * 1.2, r * 1.2);
      ctx.restore();
    } else if (item.type === 'FUEL_POD') {
      // Fuel canister stripes
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(pos.x - r * 0.6, pos.y - 2, r * 1.2, 4);
    } else if (item.type === 'ANTIMATTER_CELL' || item.type === 'DARK_MATTER_CORE') {
      // Exotic singularity containment core
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r * 0.35, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Cargo Label
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${item.name} (${item.mass}t)`, pos.x, pos.y - r - 6);

    ctx.restore();
  }

  private drawTargetLockReticle(
    ctx: CanvasRenderingContext2D,
    shipState: ShipState,
    salvageMap: Map<string, { body: Matter.Body; item: { name: string; isSalvaged: boolean } }>
  ): void {
    if (!shipState.lockedTargetId) return;
    const entry = salvageMap.get(shipState.lockedTargetId);
    if (!entry || entry.item.isSalvaged) return;

    const pos = entry.body.position;
    const boxSize = 26;

    ctx.save();
    ctx.translate(pos.x, pos.y);

    // Rotating target bracket corners
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;

    const cornerLen = 8;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(-boxSize, -boxSize + cornerLen);
    ctx.lineTo(-boxSize, -boxSize);
    ctx.lineTo(-boxSize + cornerLen, -boxSize);
    ctx.stroke();

    // Top-right
    ctx.beginPath();
    ctx.moveTo(boxSize - cornerLen, -boxSize);
    ctx.lineTo(boxSize, -boxSize);
    ctx.lineTo(boxSize, -boxSize + cornerLen);
    ctx.stroke();

    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(-boxSize, boxSize - cornerLen);
    ctx.lineTo(-boxSize, boxSize);
    ctx.lineTo(-boxSize + cornerLen, boxSize);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(boxSize - cornerLen, boxSize);
    ctx.lineTo(boxSize, boxSize);
    ctx.lineTo(boxSize, boxSize - cornerLen);
    ctx.stroke();

    // Pulsing central lock diamond
    const diamondScale = 4 + Math.sin(this.animTimer * 6) * 1.5;
    ctx.fillStyle = 'rgba(0, 229, 255, 0.7)';
    ctx.beginPath();
    ctx.moveTo(0, -diamondScale);
    ctx.lineTo(diamondScale, 0);
    ctx.lineTo(0, diamondScale);
    ctx.lineTo(-diamondScale, 0);
    ctx.closePath();
    ctx.fill();

    // HUD Target Lock Prompt
    ctx.font = 'bold 9px "Share Tech Mono", monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'center';
    ctx.fillText('TARGET LOCKED [SPACE]', 0, boxSize + 14);

    ctx.restore();
  }

  private drawPlayerShip(
    ctx: CanvasRenderingContext2D,
    shipBody: Matter.Body,
    shipState: ShipState
  ): void {
    ctx.save();
    const sp = shipBody.position;
    ctx.translate(sp.x, sp.y);
    ctx.rotate(shipBody.angle + Math.PI / 2);

    // Deflector Force-field Shield Bubble (when shield > 0)
    if (shipState.shield > 0) {
      ctx.save();
      const shieldAlpha = Math.min(0.7, (shipState.shield / 100) * 0.45 + Math.sin(this.animTimer * 5) * 0.1);
      ctx.strokeStyle = `rgba(0, 229, 255, ${shieldAlpha})`;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 12;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.ellipse(0, 2, 22, 28, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Subtle atmospheric shield glow
      ctx.fillStyle = `rgba(0, 229, 255, ${shieldAlpha * 0.15})`;
      ctx.beginPath();
      ctx.ellipse(0, 2, 22, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Thruster exhaust flame & particle emissions
    if (shipState.isThrusting && shipState.fuel > 0) {
      ctx.save();
      const flameLen = 22 + Math.random() * 16;
      ctx.fillStyle = '#ffaa00';
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 18;

      // Outer dual plume
      ctx.beginPath();
      ctx.moveTo(-8, -12);
      ctx.lineTo(8, -12);
      ctx.lineTo(0, -12 - flameLen);
      ctx.closePath();
      ctx.fill();

      // Inner cyan ion core
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.moveTo(-4, -12);
      ctx.lineTo(4, -12);
      ctx.lineTo(0, -12 - flameLen * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Emit exhaust sparks into global particle system
      const angle = shipBody.angle + Math.PI / 2;
      const backX = sp.x - Math.cos(angle) * 16;
      const backY = sp.y - Math.sin(angle) * 16;
      for (let i = 0; i < 2; i++) {
        const spread = (Math.random() - 0.5) * 0.5;
        this.particles.push({
          x: backX + (Math.random() * 6 - 3),
          y: backY + (Math.random() * 6 - 3),
          vx: -Math.cos(angle + spread) * (2.5 + Math.random() * 3),
          vy: -Math.sin(angle + spread) * (2.5 + Math.random() * 3),
          alpha: 1.0,
          life: 0,
          maxLife: 14 + Math.random() * 10,
          color: Math.random() > 0.4 ? '#ffaa00' : '#00e5ff',
          size: 1.8 + Math.random() * 2.2
        });
      }
    }

    // RCS gas puffs
    if (shipState.isTurningLeft || shipState.isTurningRight) {
      const rcsX = shipState.isTurningLeft ? 14 : -14;
      ctx.save();
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(rcsX, 0, 3.5 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2.5D Spacecraft Hull Plating
    // Shaded starboard wing panel
    ctx.fillStyle = '#008f60';
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(14, -14);
    ctx.lineTo(0, -6);
    ctx.closePath();
    ctx.fill();

    // Lit port wing panel
    ctx.fillStyle = '#00ffaa';
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(-14, -14);
    ctx.lineTo(0, -6);
    ctx.closePath();
    ctx.fill();

    // Perimeter metallic outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(14, -14);
    ctx.lineTo(0, -6);
    ctx.lineTo(-14, -14);
    ctx.closePath();
    ctx.stroke();

    // Cockpit Canopy (Dark Glass with glare)
    ctx.fillStyle = '#050c18';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(0, 2, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Navigation LEDs (Port = Red, Starboard = Green)
    const ledBlink = Math.sin(this.animTimer * 6) > 0;
    if (ledBlink) {
      // Port red light
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-13, -12, 2, 0, Math.PI * 2);
      ctx.fill();

      // Starboard green light
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(13, -12, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private updateAndDrawParticles(ctx: CanvasRenderingContext2D): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.alpha = 1 - p.life / p.maxLife;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawNavArrow(
    ctx: CanvasRenderingContext2D,
    shipPos: { x: number; y: number },
    salvageMap: Map<string, { body: { position: { x: number; y: number } }; item: { isSalvaged: boolean } }>
  ): void {
    let nearestDist = Infinity;
    let targetPos: { x: number; y: number } | null = null;

    for (const entry of salvageMap.values()) {
      if (entry.item.isSalvaged) continue;
      const dx = entry.body.position.x - shipPos.x;
      const dy = entry.body.position.y - shipPos.y;
      const dist = Math.hypot(dx, dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        targetPos = entry.body.position;
      }
    }

    if (targetPos && nearestDist > 120) {
      ctx.save();
      const angle = Math.atan2(targetPos.y - shipPos.y, targetPos.x - shipPos.x);
      const arrowDist = 52;
      const ax = shipPos.x + Math.cos(angle) * arrowDist;
      const ay = shipPos.y + Math.sin(angle) * arrowDist;

      ctx.translate(ax, ay);
      ctx.rotate(angle);

      ctx.fillStyle = '#00e5ff';
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-6, -6);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}
