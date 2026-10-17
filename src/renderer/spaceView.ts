import { SpaceEngine } from '../physics/spaceEngine';

export class SpaceView {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animTimer = 0;
  private screenShakeAmount = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No 2D context for SpaceView');
    this.ctx = context;
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

    ctx.save();

    // Apply screen shake if active
    if (this.screenShakeAmount > 0.1) {
      const sx = (Math.random() * 2 - 1) * this.screenShakeAmount;
      const sy = (Math.random() * 2 - 1) * this.screenShakeAmount;
      ctx.translate(sx, sy);
      this.screenShakeAmount *= 0.88;
    }

    // 1. Deep Space Vector Background
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, w, h);

    // Stardust coordinate grid
    ctx.strokeStyle = '#0e1728';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // 2. Recovery Bay (Mothership Dock)
    ctx.save();
    ctx.fillStyle = 'rgba(0, 255, 170, 0.04)';
    ctx.fillRect(bay.x, bay.y, bay.width, bay.height);
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 12;
    ctx.strokeRect(bay.x, bay.y, bay.width, bay.height);

    // Animated tractor beam chevron rings
    const chevronPulse = (Math.sin(this.animTimer * 4) + 1) * 0.5;
    ctx.fillStyle = `rgba(0, 255, 170, ${0.1 + chevronPulse * 0.2})`;
    ctx.beginPath();
    ctx.arc(bay.x + bay.width / 2, bay.y + bay.height / 2, 45 + chevronPulse * 15, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#00ffaa';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('RECOVERY BAY', bay.x + bay.width / 2, bay.y + bay.height / 2 + 4);
    ctx.restore();

    // 3. Asteroid Hazards
    for (const ast of asteroids) {
      ctx.save();
      ctx.fillStyle = '#141d2b';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;

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

      // Warning marker in center
      ctx.fillStyle = '#f59e0b';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚠ HAZARD', ast.x, ast.y + 3);
      ctx.restore();
    }

    // 4. Tether Cable
    if (tether && tether.bodyB) {
      ctx.save();
      const p1 = shipBody.position;
      const p2 = tether.bodyB.position;
      const tension = shipState.tetherTension;

      let cableColor = '#00e5ff';
      if (tension > 0.8) cableColor = '#ff3333';
      else if (tension > 0.45) cableColor = '#ffaa00';

      ctx.strokeStyle = cableColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = cableColor;
      ctx.shadowBlur = 10;

      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2 + (1 - tension) * 18;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
      ctx.stroke();

      // Tension strain label
      ctx.fillStyle = cableColor;
      ctx.font = '10px monospace';
      ctx.fillText(`TENSION: ${(tension * 100).toFixed(0)}%`, midX, midY - 8);
      ctx.restore();
    }

    // 5. Salvage Items
    for (const entry of salvageMap.values()) {
      if (entry.item.isSalvaged) continue;

      ctx.save();
      const pos = entry.body.position;
      const r = entry.item.radius;

      ctx.fillStyle = entry.item.color;
      ctx.shadowColor = entry.item.color;
      ctx.shadowBlur = 14;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Core details
      if (entry.item.type === 'CORE') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${entry.item.name} (${entry.item.mass}t)`, pos.x, pos.y - r - 6);
      ctx.restore();
    }

    // 6. Flight Path Trajectory Vector (Prograde Line)
    const speed = Math.hypot(shipBody.velocity.x, shipBody.velocity.y);
    if (speed > 0.2) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(shipBody.position.x, shipBody.position.y);
      ctx.lineTo(
        shipBody.position.x + shipBody.velocity.x * 24,
        shipBody.position.y + shipBody.velocity.y * 24
      );
      ctx.stroke();
      ctx.restore();
    }

    // 7. Player Spacecraft
    ctx.save();
    const sp = shipBody.position;
    ctx.translate(sp.x, sp.y);
    ctx.rotate(shipBody.angle + Math.PI / 2);

    // Thruster exhaust flame
    if (shipState.isThrusting && shipState.fuel > 0) {
      ctx.save();
      const flameLen = 18 + Math.random() * 14;
      ctx.fillStyle = '#ffaa00';
      ctx.shadowColor = '#ff4400';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(-7, -12);
      ctx.lineTo(7, -12);
      ctx.lineTo(0, -12 - flameLen);
      ctx.closePath();
      ctx.fill();

      // Inner blue core flame
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.moveTo(-3, -12);
      ctx.lineTo(3, -12);
      ctx.lineTo(0, -12 - flameLen * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // RCS puffs when turning
    if (shipState.isTurningLeft || shipState.isTurningRight) {
      ctx.save();
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      const rcsX = shipState.isTurningLeft ? 12 : -12;
      ctx.beginPath();
      ctx.arc(rcsX, 0, 3 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Ship Hull
    ctx.fillStyle = '#00ffaa';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.lineTo(12, -12);
    ctx.lineTo(0, -6);
    ctx.lineTo(-12, -12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Canopy
    ctx.fillStyle = '#050811';
    ctx.beginPath();
    ctx.arc(0, 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 8. Navigational Arrow towards nearest salvage item
    this.drawNavArrow(ctx, shipBody.position, salvageMap);

    ctx.restore();
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
      const arrowDist = 48;
      const ax = shipPos.x + Math.cos(angle) * arrowDist;
      const ay = shipPos.y + Math.sin(angle) * arrowDist;

      ctx.translate(ax, ay);
      ctx.rotate(angle);

      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-6, -5);
      ctx.lineTo(-6, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}
