import Matter from 'matter-js';
import { ORBITAL_MISSIONS } from './missions';
import { AsteroidHazard, GameEvent, GameStatus, MissionData, MissionMetrics, SalvageItem, ShipState } from './types';

const { Engine, World, Bodies, Body, Constraint, Vector, Events } = Matter;

export class SpaceEngine {
  private engine: Matter.Engine;
  private currentMissionIndex = 0;
  private currentMission: MissionData;

  private shipBody!: Matter.Body;
  private salvageBodies: Map<string, { body: Matter.Body; item: SalvageItem }> = new Map();
  private asteroidBodies: Matter.Body[] = [];
  private boundaryWalls: Matter.Body[] = [];

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
  private eventsQueue: GameEvent[] = [];
  private missionStartTime = performance.now();

  private arenaWidth: number;
  private arenaHeight: number;

  constructor(arenaWidth = 1200, arenaHeight = 800, initialMission = 0) {
    this.arenaWidth = arenaWidth;
    this.arenaHeight = arenaHeight;

    this.engine = Engine.create({
      gravity: { x: 0, y: 0, scale: 0 }
    });

    this.currentMissionIndex = Math.max(0, Math.min(ORBITAL_MISSIONS.length - 1, initialMission));
    this.currentMission = JSON.parse(JSON.stringify(ORBITAL_MISSIONS[this.currentMissionIndex]));

    this.setupCollisionHandlers();
    this.loadMission(this.currentMissionIndex);
  }

  private setupCollisionHandlers(): void {
    Events.on(this.engine, 'collisionStart', (evt) => {
      if (this.gameStatus !== 'PLAYING') return;

      for (const pair of evt.pairs) {
        if (pair.bodyA === this.shipBody || pair.bodyB === this.shipBody) {
          const speed = Vector.magnitude(this.shipBody.velocity);
          if (speed > 1.2) {
            const damage = Math.round(speed * 4.2);
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

  public loadMission(index: number): void {
    if (index < 0 || index >= ORBITAL_MISSIONS.length) return;

    this.cutTether();

    // 1. Clear previous world bodies
    World.clear(this.engine.world, false);
    this.salvageBodies.clear();
    this.asteroidBodies = [];
    this.boundaryWalls = [];

    // 2. Clone mission data
    this.currentMissionIndex = index;
    this.currentMission = JSON.parse(JSON.stringify(ORBITAL_MISSIONS[this.currentMissionIndex]));
    const mission = this.currentMission;

    // 3. Rebuild Ship
    this.shipBody = Bodies.polygon(mission.shipSpawn.x, mission.shipSpawn.y, 3, 18, {
      mass: 8,
      frictionAir: 0.012,
      restitution: 0.2,
      label: 'ship'
    });
    Body.setAngle(this.shipBody, -Math.PI / 2);

    // 4. Boundary Walls
    const wallThick = 40;
    const w = this.arenaWidth;
    const h = this.arenaHeight;
    this.boundaryWalls = [
      Bodies.rectangle(w / 2, -wallThick / 2, w, wallThick, { isStatic: true, label: 'wall' }),
      Bodies.rectangle(w / 2, h + wallThick / 2, w, wallThick, { isStatic: true, label: 'wall' }),
      Bodies.rectangle(-wallThick / 2, h / 2, wallThick, h, { isStatic: true, label: 'wall' }),
      Bodies.rectangle(w + wallThick / 2, h / 2, wallThick, h, { isStatic: true, label: 'wall' })
    ];

    // 5. Asteroids
    for (const ast of mission.asteroids) {
      const b = Bodies.polygon(ast.x, ast.y, ast.sides, ast.radius, {
        isStatic: true,
        label: `asteroid-${ast.id}`
      });
      this.asteroidBodies.push(b);
    }

    // 6. Salvage items
    const salvageList: Matter.Body[] = [];
    for (const item of mission.salvageItems) {
      const b = Bodies.circle(item.initialPos.x, item.initialPos.y, item.radius, {
        mass: item.mass,
        frictionAir: 0.005,
        restitution: 0.4,
        label: `salvage-${item.id}`
      });
      Body.setVelocity(b, item.initialVel);
      this.salvageBodies.set(item.id, { body: b, item });
      salvageList.push(b);
    }

    // Add all to World
    World.add(this.engine.world, [this.shipBody, ...this.boundaryWalls, ...this.asteroidBodies, ...salvageList]);

    // Reset state
    this.shipState.fuel = mission.initialFuel;
    this.shipState.maxFuel = 100;
    this.shipState.hull = 100;
    this.shipState.maxHull = 100;
    this.shipState.tetherAttachedToId = null;
    this.shipState.tetherLength = 0;
    this.shipState.tetherTension = 0;

    this.gameStatus = 'PLAYING';
    this.missionStartTime = performance.now();
  }

  public getCurrentMission(): Readonly<MissionData> {
    return this.currentMission;
  }

  public getMissionIndex(): number {
    return this.currentMissionIndex;
  }

  public getTotalMissions(): number {
    return ORBITAL_MISSIONS.length;
  }

  public nextMission(): boolean {
    if (this.currentMissionIndex < ORBITAL_MISSIONS.length - 1) {
      this.loadMission(this.currentMissionIndex + 1);
      return true;
    }
    return false;
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

  public setPaused(paused: boolean): void {
    if (paused && this.gameStatus === 'PLAYING') {
      this.gameStatus = 'PAUSED';
    } else if (!paused && this.gameStatus === 'PAUSED') {
      this.gameStatus = 'PLAYING';
    }
  }

  public getSalvageBodies(): Map<string, { body: Matter.Body; item: SalvageItem }> {
    return this.salvageBodies;
  }

  public getAsteroidHazards(): AsteroidHazard[] {
    return this.currentMission.asteroids;
  }

  public getTetherConstraint(): Matter.Constraint | null {
    return this.tetherConstraint;
  }

  public getRecoveryBay(): { x: number; y: number; width: number; height: number } {
    return this.currentMission.recoveryBay;
  }

  public pollEvents(): GameEvent[] {
    const list = [...this.eventsQueue];
    this.eventsQueue = [];
    return list;
  }

  public getMetrics(): MissionMetrics {
    const salvaged = Array.from(this.salvageBodies.values()).filter(v => v.item.isSalvaged).length;
    const elapsed = (performance.now() - this.missionStartTime) / 1000;

    return {
      missionNumber: this.currentMission.missionNumber,
      missionName: this.currentMission.name,
      score: this.shipState.score,
      fuelRemaining: Math.round(this.shipState.fuel),
      hullRemaining: Math.round(this.shipState.hull),
      salvagedCount: salvaged,
      totalItems: this.salvageBodies.size,
      timeElapsedSeconds: Math.round(elapsed)
    };
  }

  // Controls
  public applyThrust(): void {
    if (this.gameStatus !== 'PLAYING' || this.shipState.fuel <= 0) return;

    this.shipState.isThrusting = true;
    this.shipState.fuel = Math.max(0, this.shipState.fuel - 0.07);

    const angle = this.shipBody.angle + Math.PI / 2;
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

    if (this.tetherConstraint) {
      this.cutTether();
      return false;
    }

    let closestId: string | null = null;
    let closestDist = 280;

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

    this.shipState.isThrusting = false;
    this.shipState.isTurningLeft = false;
    this.shipState.isTurningRight = false;
    this.shipState.isBraking = false;

    // Calculate tether tension & snapping
    if (this.tetherConstraint && this.attachedItemId) {
      const target = this.salvageBodies.get(this.attachedItemId);
      if (target) {
        const currentDist = Vector.magnitude(Vector.sub(this.shipBody.position, target.body.position));
        const stretch = Math.max(0, currentDist - this.shipState.tetherLength);
        this.shipState.tetherTension = Math.min(1.0, stretch / 120);

        if (stretch > 220) {
          this.cutTether();
          this.eventsQueue.push({ type: 'TETHER_CUT', message: 'TETHER SNAPPED UNDER EXCESS TENSION!' });
        }
      }
    }

    // Check Recovery Bay docking for salvage items
    const bay = this.currentMission.recoveryBay;
    for (const [id, entry] of this.salvageBodies.entries()) {
      if (entry.item.isSalvaged) continue;

      const pos = entry.body.position;
      const speed = Vector.magnitude(entry.body.velocity);

      if (pos.x >= bay.x && pos.x <= bay.x + bay.width && pos.y >= bay.y && pos.y <= bay.y + bay.height) {
        if (speed < 2.2) {
          entry.item.isSalvaged = true;
          this.shipState.score += entry.item.scoreValue;

          if (entry.item.type === 'FUEL_POD') {
            this.shipState.fuel = Math.min(100, this.shipState.fuel + 40);
          }

          if (this.attachedItemId === id) {
            this.cutTether();
          }

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
    this.loadMission(this.currentMissionIndex);
  }
}
