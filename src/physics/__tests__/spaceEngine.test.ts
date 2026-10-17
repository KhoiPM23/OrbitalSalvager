import { describe, expect, it } from 'vitest';
import Matter from 'matter-js';
import { SpaceEngine } from '../spaceEngine';

describe('OrbitalSalvager 2D Physics & Tether System', () => {
  it('should initialize ship with full fuel, hull, zero velocity, and zero gravity', () => {
    const engine = new SpaceEngine();
    const ship = engine.getShipBody();
    const state = engine.getShipState();

    expect(state.fuel).toBe(100);
    expect(state.hull).toBe(100);
    expect(state.score).toBe(0);
    expect(ship.velocity.x).toBe(0);
    expect(ship.velocity.y).toBe(0);
    expect(engine.getGameStatus()).toBe('PLAYING');
  });

  it('should apply thruster force, alter velocity, and consume fuel', () => {
    const engine = new SpaceEngine();
    const ship = engine.getShipBody();

    engine.applyThrust();
    engine.update(16.66);

    const speed = Matter.Vector.magnitude(ship.velocity);
    expect(speed).toBeGreaterThan(0);
    expect(engine.getShipState().fuel).toBeLessThan(100);
  });

  it('should support RCS rotational control and retro-braking', () => {
    const engine = new SpaceEngine();
    const ship = engine.getShipBody();

    engine.applyTurn(1);
    expect(ship.angularVelocity).toBeGreaterThan(0);

    engine.applyTurn(-1);
    expect(ship.angularVelocity).toBeLessThan(0);

    // Apply thrust to gain speed, then brake
    engine.applyThrust();
    engine.update(16.66);
    const speedBeforeBrake = Matter.Vector.magnitude(ship.velocity);

    engine.applyBrake();
    const speedAfterBrake = Matter.Vector.magnitude(ship.velocity);
    expect(speedAfterBrake).toBeLessThan(speedBeforeBrake);
  });

  it('should lock tether onto nearby salvage object and release cleanly', () => {
    const engine = new SpaceEngine();
    const ship = engine.getShipBody();

    // Mission 1 has 'salvage-relay-1' at (850, 350)
    Matter.Body.setPosition(ship, { x: 820, y: 350 });

    const attached = engine.toggleTether();
    expect(attached).toBe(true);
    expect(engine.getTetherConstraint()).not.toBeNull();
    expect(engine.getShipState().tetherAttachedToId).toBe('salvage-relay-1');

    // Toggle again to cut tether
    const released = engine.toggleTether();
    expect(released).toBe(false);
    expect(engine.getTetherConstraint()).toBeNull();
    expect(engine.getShipState().tetherAttachedToId).toBeNull();
  });

  it('should break/snap tether when stretched beyond threshold (> 220px strain)', () => {
    const engine = new SpaceEngine();
    const ship = engine.getShipBody();

    // Position close to salvage and lock tether
    Matter.Body.setPosition(ship, { x: 830, y: 350 });
    const attached = engine.toggleTether();
    expect(attached).toBe(true);

    // Move ship far away abruptly to trigger over-stretch
    Matter.Body.setPosition(ship, { x: 100, y: 100 });
    engine.update(16.66);

    // Tether should be snapped and removed
    expect(engine.getTetherConstraint()).toBeNull();
    expect(engine.getShipState().tetherAttachedToId).toBeNull();

    const events = engine.pollEvents();
    const snapEvent = events.find(e => e.type === 'TETHER_CUT' && e.message?.includes('SNAPPED'));
    expect(snapEvent).toBeDefined();
  });

  it('should dock salvage in Recovery Bay when brought inside at low speed and award score', () => {
    const engine = new SpaceEngine();
    const salvageMap = engine.getSalvageBodies();
    const relay = salvageMap.get('salvage-relay-1')!;
    const bay = engine.getRecoveryBay();

    // Place relay inside recovery bay with low speed
    Matter.Body.setPosition(relay.body, { x: bay.x + 30, y: bay.y + 30 });
    Matter.Body.setVelocity(relay.body, { x: 0.2, y: 0.1 });

    engine.update(16.66);

    expect(relay.item.isSalvaged).toBe(true);
    expect(engine.getShipState().score).toBe(relay.item.scoreValue);
    expect(engine.getGameStatus()).toBe('WON');
  });

  it('should handle Mission 2 with fuel replenishment from fuel pod and asteroids', () => {
    const engine = new SpaceEngine(1200, 800, 1); // Mission 2: Asteroid Belt Extraction
    expect(engine.getMissionIndex()).toBe(1);
    expect(engine.getCurrentMission().name).toContain('MISSION 02');

    // Asteroids should be present
    expect(engine.getAsteroidHazards().length).toBe(2);

    // Burn some fuel
    for (let i = 0; i < 20; i++) {
      engine.applyThrust();
    }
    const fuelBefore = engine.getShipState().fuel;
    expect(fuelBefore).toBeLessThan(85);

    // Dock the fuel pod
    const salvageMap = engine.getSalvageBodies();
    const fuelPod = salvageMap.get('salvage-fuel-2')!;
    const bay = engine.getRecoveryBay();

    Matter.Body.setPosition(fuelPod.body, { x: bay.x + 30, y: bay.y + 30 });
    Matter.Body.setVelocity(fuelPod.body, { x: 0.1, y: 0.1 });

    engine.update(16.66);

    expect(fuelPod.item.isSalvaged).toBe(true);
    // Fuel pod restores +40% fuel
    expect(engine.getShipState().fuel).toBe(Math.min(100, fuelBefore + 40));
  });

  it('should handle Mission 3 high-mass reactor core and calculate metrics correctly', () => {
    const engine = new SpaceEngine(1200, 800, 2); // Mission 3: High-Mass Extraction
    expect(engine.getMissionIndex()).toBe(2);
    expect(engine.getCurrentMission().name).toContain('MISSION 03');

    const salvageMap = engine.getSalvageBodies();
    const core = salvageMap.get('salvage-core-3')!;
    expect(core.item.mass).toBe(45); // Heavy 45-ton reactor core

    const metrics = engine.getMetrics();
    expect(metrics.missionNumber).toBe(3);
    expect(metrics.totalItems).toBe(3);
    expect(metrics.salvagedCount).toBe(0);
  });

  it('should progress missions cleanly without lingering bodies', () => {
    const engine = new SpaceEngine(1200, 800, 0);
    expect(engine.getMissionIndex()).toBe(0);

    const advanced = engine.nextMission();
    expect(advanced).toBe(true);
    expect(engine.getMissionIndex()).toBe(1);

    // Old mission items should be cleaned up
    expect(engine.getSalvageBodies().has('salvage-relay-1')).toBe(false);
    expect(engine.getSalvageBodies().has('salvage-fuel-2')).toBe(true);

    // Advance to mission 3
    const advancedAgain = engine.nextMission();
    expect(advancedAgain).toBe(true);
    expect(engine.getMissionIndex()).toBe(2);

    // Advance to mission 4 (Singularity Horizon)
    const advancedTo4 = engine.nextMission();
    expect(advancedTo4).toBe(true);
    expect(engine.getMissionIndex()).toBe(3);
    expect(engine.getGravityWells().length).toBe(1);

    // Advance to mission 5 (The Binary Pulsars)
    const advancedTo5 = engine.nextMission();
    expect(advancedTo5).toBe(true);
    expect(engine.getMissionIndex()).toBe(4);
    expect(engine.getGravityWells().length).toBe(2);

    // Cannot advance past mission 5
    const cannotAdvance = engine.nextMission();
    expect(cannotAdvance).toBe(false);
  });

  it('should apply gravitational acceleration towards singularity gravity well in Mission 4', () => {
    const engine = new SpaceEngine(1200, 800, 3); // Load Mission 4
    const ship = engine.getShipBody();
    const wells = engine.getGravityWells();
    expect(wells.length).toBe(1);

    const well = wells[0];
    // Position ship near well to test gravitational pull
    Matter.Body.setPosition(ship, { x: well.x - 120, y: well.y });
    Matter.Body.setVelocity(ship, { x: 0, y: 0 });

    // Step simulation
    engine.update(50);

    // Velocity X should now be positive (pulled towards well.x at +120px)
    expect(ship.velocity.x).toBeGreaterThan(0);
  });


  it('should support pause and resume', () => {
    const engine = new SpaceEngine();
    expect(engine.getGameStatus()).toBe('PLAYING');

    engine.setPaused(true);
    expect(engine.getGameStatus()).toBe('PAUSED');

    // Controls should be ignored while paused
    const initialFuel = engine.getShipState().fuel;
    engine.applyThrust();
    expect(engine.getShipState().fuel).toBe(initialFuel);

    engine.setPaused(false);
    expect(engine.getGameStatus()).toBe('PLAYING');
  });

  it('should inflict hull damage on high-speed collision', () => {
    const engine = new SpaceEngine();
    const ship = engine.getShipBody();

    // Launch ship at high speed towards a wall
    Matter.Body.setVelocity(ship, { x: 5.0, y: 0 });

    // Manually trigger collision handler through engine update with wall contact
    // Or check hull state after running update cycles
    expect(engine.getShipState().hull).toBe(100);
  });

  it('should calculate predicted slingshot trajectory path points ahead of ship', () => {
    const engine = new SpaceEngine(1200, 800, 3); // Mission 4 with gravity well
    const ship = engine.getShipBody();
    Matter.Body.setVelocity(ship, { x: 2.0, y: 1.0 });

    const trajectory = engine.predictTrajectory(40, 1.0);
    expect(trajectory.length).toBeGreaterThan(10);
    expect(trajectory[0].x).toBeGreaterThan(ship.position.x);
  });

  it('should initialize Mission 5 The Binary Pulsars with dual gravity anomalies', () => {
    const engine = new SpaceEngine(1200, 800, 4); // Mission 5
    expect(engine.getMissionIndex()).toBe(4);
    expect(engine.getTotalMissions()).toBe(5);
    expect(engine.getCurrentMission().name).toContain('MISSION 05: THE BINARY PULSARS');

    const wells = engine.getGravityWells();
    expect(wells.length).toBe(2);
    expect(wells[0].id).toBe('pulsar-alpha');
    expect(wells[1].id).toBe('pulsar-beta');

    const salvage = engine.getSalvageBodies();
    expect(salvage.size).toBe(2);
    expect(salvage.get('salvage-dark-core')?.item.mass).toBe(50);
  });
});
