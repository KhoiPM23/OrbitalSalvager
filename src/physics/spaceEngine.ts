import Matter from 'matter-js';
import { GameEvent, GameStatus, SalvageItem, ShipState } from './types';

const { Engine, World, Bodies, Body, Constraint, Vector, Events } = Matter;

export class SpaceEngine {
  private engine: Matter.Engine;
  private shipBody: Matter.Body;
  private salvageBodies: Map<string, { body: Matter.Body; item: SalvageItem }> = new Map();
  private tetherConstraint: Matter.Constraint | null = null;
  private attachedItemId: string | null = null;

  private shipState: ShipState = {
    fuel: 100,
    hull: 100,
    maxFuel: 100,
    maxHull: 100,
    score: 0,
    tetherAttachedToId: null,
    tetherLength: 0,
    tetherTension: 0,
    isThrusting: false,
    isTurningLeft: false,
    isTurningRight: false,
    isBraking: false
  };

  private gameStatus: GameStatus = 'PLAYING';
  private recoveryBay = { x: 120, y: 120, width: 150, height: 150 };
  private eventsQueue: GameEvent[] = [];

  constructor(arenaWidth = 1200, arenaHeight = 800) {
    this.engine = Engine.create({
      gravity: { x: 0, y: 0, scale: 0 }
    });

    // 1. Ship
    this.shipBody = Bodies.polygon(600, 500, 3, 18, {
      mass: 8,
      frictionAir: 0.012,
      restitution: 0.2,
      label: 'ship'
    });
    // Align forward facing
    Body.setAngle(this.shipBody, -Math.PI / 2);

    // 2. Boundary walls
    const wallThick = 40;
    const walls = [
      Bodies.rectangle(arenaWidth / 2, -wallThick / 2, arenaWidth, wallThick, { isStatic: true, label: 'wall' }),
      Bodies.rectangle(arenaWidth / 2, arenaHeight + wallThick / 2, arenaWidth, wallThick, { isStatic: true, label: 'wall' }),
      Bodies.rectangle(-wallThick / 2, arenaHeight / 2, wallThick, arenaHeight, { isStatic: true, label: 'wall' }),
      Bodies.rectangle(arenaWidth + wallThick / 2, arenaHeight / 2, wallThick, arenaHeight, { isStatic: true, label: 'wall' })
    ];

    // 3. Asteroid Hazards
    const asteroid1 = Bodies.polygon(450, 280, 6, 45, { isStatic: true, label: 'asteroid' });
    const asteroid2 = Bodies.polygon(850, 420, 5, 55, { isStatic: true, label: 'asteroid' });

    // 4. Salvage Items
    const items: SalvageItem[] = [
      {
        id: 'salvage-core',
        name: 'TITANIUM REACTOR CORE',
        type: 'CORE',
        mass: 38,
        radius: 20,
        color: '#00e5ff',
        initialPos: { x: 950, y: 200 },
        initialVel: { x: -0.4, y: 0.2 },
        isSalvaged: false,
        scoreValue: 1200
      },
      {
        id: 'salvage-fuel',
        name: 'VOLATILE FUEL CELL POD',
        type: 'FUEL_POD',
        mass: 18,
        radius: 16,
        color: '#ffaa00',
        initialPos: { x: 350, y: 650 },
        initialVel: { x: 0.3, y: -0.2 },
        isSalvaged: false,
        scoreValue: 800
      },
      {
        id: 'salvage-relay',
        name: 'COMMUNICATION SATELLITE DISH',
        type: 'RELAY',
        mass: 10,
        radius: 14,
        color: '#a855f7',
        initialPos: { x: 800, y: 680 },
        initialVel: { x: -0.2, y: -0.3 },
        isSalvaged: false,
        scoreValue: 600
      }
    ];

    World.add(this.engine.world, [this.shipBody, ...walls, asteroid1, asteroid2]);

    items.forEach((item) => {
      const b = Bodies.circle(item.initialPos.x, item.initialPos.y, item.radius, {
        mass: item.mass,
        frictionAir: 0.005,
        restitution: 0.4,
        label: `salvage-${item.id}`
      });
      Body.setVelocity(b, item.initialVel);
      World.add(this.engine.world, b);
      this.salvageBodies.set(item.id, { body: b, item });
    });

    // Collision listener for damage
    Events.on(this.engine, 'collisionStart', (evt) => {
      for (const pair of evt.pairs) {
        if (pair.bodyA === this.shipBody || pair.bodyB === this.shipBody) {
          const speed = Vector.magnitude(this.shipBody.velocity);
          if (speed > 1.2) {
            const damage = Math.round(speed * 4.5);
            this.shipState.hull = Math.max(0, this.shipState.hull - damage);
            this.eventsQueue.push({
              type: 'COLLISION_DAMAGE',
              message: `HULL IMPACT: -${damage}%`,
              intensity: damage
            });

            if (this.shipState.hull <= 0) {
              this.gameStatus = 'DESTROYED';
              this.eventsQueue.push({ type: 'GAME_OVER', message: 'HULL INTEGRITY COMPROMISED' });
            }
          }
        }
      }
    });
  }

  public getShipBody(): Matter.Body {
    return this.shipBody;
  }

  public getShipState(): Readonly<ShipState> {
    return this.shipState;
  }

  public getGameStatus(): GameStatus {
    return this.gameStatus;
  }

  public getSalvageBodies(): Map<string, { body: Matter.Body; item: SalvageItem }> {
    return this.salvageBodies;
  }

  public getTetherConstraint(): Matter.Constraint | null {
    return this.tetherConstraint;
  }

  public getRecoveryBay(): { x: number; y: number; width: number; height: number } {
    return this.recoveryBay;
  }

  public pollEvents(): GameEvent[] {
    const list = [...this.eventsQueue];
    this.eventsQueue = [];
    return list;
  }

  // Controls
  public applyThrust(): void {
    if (this.gameStatus !== 'PLAYING' || this.shipState.fuel <= 0) return;

    this.shipState.isThrusting = true;
    this.shipState.fuel = Math.max(0, this.shipState.fuel - 0.07);

    // Thrust vector in facing angle direction
    const angle = this.shipBody.angle + Math.PI / 2; // ship nose offset
    const forceMagnitude = 0.0035;
    const force = {
      x: Math.cos(angle) * forceMagnitude,
      y: Math.sin(angle) * forceMagnitude
    };
    Body.applyForce(this.shipBody, this.shipBody.position, force);

    if (this.shipState.fuel <= 0) {
      this.checkFuelExhaustion();
    }
  }

  public applyTurn(direction: -1 | 1): void {
    if (this.gameStatus !== 'PLAYING') return;
    if (direction < 0) this.shipState.isTurningLeft = true;
    if (direction > 0) this.shipState.isTurningRight = true;

    Body.setAngularVelocity(this.shipBody, direction * 0.05);
  }

  public applyBrake(): void {
    if (this.gameStatus !== 'PLAYING' || this.shipState.fuel <= 0) return;

    this.shipState.isBraking = true;
    this.shipState.fuel = Math.max(0, this.shipState.fuel - 0.05);
    Body.setVelocity(this.shipBody, {
      x: this.shipBody.velocity.x * 0.94,
      y: this.shipBody.velocity.y * 0.94
    });

    if (this.shipState.fuel <= 0) {
      this.checkFuelExhaustion();
    }
  }

  public toggleTether(): boolean {
    if (this.gameStatus !== 'PLAYING') return false;

    // If already attached, cut it
    if (this.tetherConstraint) {
      this.cutTether();
      return false;
    }

    // Find closest unsalvaged item in range (< 260px)
    let closestId: string | null = null;
    let closestDist = 260;

    for (const [id, entry] of this.salvageBodies.entries()) {
      if (entry.item.isSalvaged) continue;
      const dist = Vector.magnitude(Vector.sub(this.shipBody.position, entry.body.position));
      if (dist < closestDist) {
        closestDist = dist;
        closestId = id;
      }
    }

    if (closestId) {
      const target = this.salvageBodies.get(closestId)!;
      this.tetherConstraint = Constraint.create({
        bodyA: this.shipBody,
        bodyB: target.body,
        length: closestDist,
        stiffness: 0.06,
        damping: 0.12
      });
      World.add(this.engine.world, this.tetherConstraint);

      this.attachedItemId = closestId;
      this.shipState.tetherAttachedToId = closestId;
      this.shipState.tetherLength = closestDist;
      this.eventsQueue.push({ type: 'TETHER_LATCH', message: `GRAPPLE LOCKED ONTO ${target.item.name}` });
      return true;
    }

    return false;
  }

  public cutTether(): void {
    if (this.tetherConstraint) {
      World.remove(this.engine.world, this.tetherConstraint);
      this.tetherConstraint = null;
      this.attachedItemId = null;
      this.shipState.tetherAttachedToId = null;
      this.shipState.tetherTension = 0;
      this.eventsQueue.push({ type: 'TETHER_CUT', message: 'TETHER DISENGAGED' });
    }
  }

  public update(deltaMs = 16.66): void {
    if (this.gameStatus !== 'PLAYING') return;

    Engine.update(this.engine, deltaMs);

    // Reset continuous frame inputs
    this.shipState.isThrusting = false;
    this.shipState.isTurningLeft = false;
    this.shipState.isTurningRight = false;
    this.shipState.isBraking = false;

    // Calculate tether tension
    if (this.tetherConstraint && this.attachedItemId) {
      const target = this.salvageBodies.get(this.attachedItemId);
      if (target) {
        const currentDist = Vector.magnitude(Vector.sub(this.shipBody.position, target.body.position));
        const stretch = Math.max(0, currentDist - this.shipState.tetherLength);
        this.shipState.tetherTension = Math.min(1.0, stretch / 120);

        // Snap constraint if stretched beyond breaking point (> 220px stretch)
        if (stretch > 220) {
          this.cutTether();
          this.eventsQueue.push({ type: 'TETHER_CUT', message: 'TETHER SNAPPED UNDER EXCESS TENSION!' });
        }
      }
    }

    // Check Recovery Bay docking for salvage items
    const rx = this.recoveryBay.x;
    const ry = this.recoveryBay.y;
    const rw = this.recoveryBay.width;
    const rh = this.recoveryBay.height;

    for (const [id, entry] of this.salvageBodies.entries()) {
      if (entry.item.isSalvaged) continue;

      const pos = entry.body.position;
      const speed = Vector.magnitude(entry.body.velocity);

      if (pos.x >= rx && pos.x <= rx + rw && pos.y >= ry && pos.y <= ry + rh) {
        if (speed < 2.0) {
          // Successfully secured!
          entry.item.isSalvaged = true;
          this.shipState.score += entry.item.scoreValue;

          // Fuel bonus for fuel pod
          if (entry.item.type === 'FUEL_POD') {
            this.shipState.fuel = Math.min(100, this.shipState.fuel + 40);
          }

          // Disengage tether if this was attached
          if (this.attachedItemId === id) {
            this.cutTether();
          }

          // Freeze and remove from active physics
          Body.setVelocity(entry.body, { x: 0, y: 0 });
          Body.setStatic(entry.body, true);

          this.eventsQueue.push({
            type: 'SALVAGE_SECURED',
            message: `SECURED: ${entry.item.name} (+${entry.item.scoreValue} PTS)`
          });

          this.checkVictoryCondition();
        }
      }
    }
  }

  private checkFuelExhaustion(): void {
    const unsalvagedCount = Array.from(this.salvageBodies.values()).filter(v => !v.item.isSalvaged).length;
    if (unsalvagedCount > 0 && Vector.magnitude(this.shipBody.velocity) < 0.1) {
      this.gameStatus = 'STRANDED';
      this.eventsQueue.push({ type: 'GAME_OVER', message: 'FUEL EXHAUSTED // STRANDED IN DEEP SPACE' });
    }
  }

  private checkVictoryCondition(): void {
    const unsalvaged = Array.from(this.salvageBodies.values()).filter(v => !v.item.isSalvaged);
    if (unsalvaged.length === 0) {
      this.gameStatus = 'WON';
      this.eventsQueue.push({ type: 'VICTORY', message: 'ALL SECTOR SALVAGE RETRIEVED!' });
    }
  }

  public reset(): void {
    this.cutTether();
    Body.setPosition(this.shipBody, { x: 600, y: 500 });
    Body.setVelocity(this.shipBody, { x: 0, y: 0 });
    Body.setAngle(this.shipBody, -Math.PI / 2);
    Body.setAngularVelocity(this.shipBody, 0);

    this.shipState.fuel = 100;
    this.shipState.hull = 100;
    this.shipState.score = 0;
    this.gameStatus = 'PLAYING';

    for (const entry of this.salvageBodies.values()) {
      entry.item.isSalvaged = false;
      Body.setStatic(entry.body, false);
      Body.setPosition(entry.body, entry.item.initialPos);
      Body.setVelocity(entry.body, entry.item.initialVel);
    }
  }
}
