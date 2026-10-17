import { SpaceEngine } from '../physics/spaceEngine';

export class SpaceView {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animTimer = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No 2D context for SpaceView');
    this.ctx = context;
  }

  public render(engine: SpaceEngine): void {
    this.animTimer += 0.04;
    const { ctx } = this;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const shipBody = engine.getShipBody();
    const shipState = engine.getShipState();
    const salvageMap = engine.getSalvageBodies();
    const bay = engine.getRecoveryBay();
    const tether = engine.getTetherConstraint();

    // 1. Deep Space Vector Background
    ctx.fillStyle = '#060911';
    ctx.fillRect(0, 0, w, h);

    // Stardust grid
    ctx.strokeStyle = '#0e1626';
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
    ctx.fillStyle = 'rgba(0, 255, 170, 0.05)';
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

    // 3. Asteroids
    const asteroids = [
      { x: 450, y: 280, r: 45, sides: 6 },
      { x: 850, y: 420, r: 55, sides: 5 }
    ];
    for (const ast of asteroids) {
      ctx.save();
      ctx.fillStyle = '#141d2b';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;

      ctx.beginPath();
      for (let i = 0; i < ast.sides; i++) {
        const a = (i / ast.sides) * Math.PI * 2;
        const px = ast.x + Math.cos(a) * ast.r;
        const py = ast.y + Math.sin(a) * ast.r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Tether Cable
    if (tether && tether.bodyB) {
      ctx.save();
      const p1 = shipBody.position;
      const p2 = tether.bodyB.position;
      const tension = shipState.tetherTension;

      // Color from cyan to orange to red on snap danger
      let cableColor = '#00e5ff';
      if (tension > 0.8) cableColor = '#ff3333';
      else if (tension > 0.4) cableColor = '#ffaa00';

      ctx.strokeStyle = cableColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = cableColor;
      ctx.shadowBlur = 10;

      // Sag curve when relaxed, straight line when under high tension
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

      // Inner details based on type
      if (entry.item.type === 'CORE') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(entry.item.name, pos.x, pos.y - r - 6);
      ctx.restore();
    }

    // 6. Player Spacecraft
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

    // Ship Hull (Triangular vector scout)
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
    ctx.fillStyle = '#060911';
    ctx.beginPath();
    ctx.arc(0, 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 7. Navigational Vector Arrow towards nearest salvage item
    this.drawNavArrow(ctx, shipBody.position, salvageMap);
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
