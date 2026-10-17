import { describe, expect, it } from 'vitest';
import Matter from 'matter-js';
import { SpaceEngine } from '../spaceEngine';

describe('OrbitalSalvager 2D Physics & Tether System', () => {
  it('should initialize ship with full fuel and zero velocity', () => {
    const engine = new SpaceEngine();
    const ship = engine.getShipBody();
    const state = engine.getShipState();

    expect(state.fuel).toBe(100);
    expect(state.hull).toBe(100);
    expect(state.score).toBe(0);
    expect(ship.velocity.x).toBe(0);
    expect(ship.velocity.y).toBe(0);
  });

  it('should apply thruster force and consume fuel', () => {
    const engine = new SpaceEngine();
    const ship = engine.getShipBody();

    engine.applyThrust();
    engine.update(16.66);

    const speed = Matter.Vector.magnitude(ship.velocity);
    expect(speed).toBeGreaterThan(0);
    expect(engine.getShipState().fuel).toBeLessThan(100);
  });

  it('should lock tether onto nearby salvage object and release cleanly', () => {
    const engine = new SpaceEngine();
    const ship = engine.getShipBody();

    // Position ship next to salvage-core (located around 950, 200)
    Matter.Body.setPosition(ship, { x: 920, y: 200 });

    const attached = engine.toggleTether();
    expect(attached).toBe(true);
    expect(engine.getTetherConstraint()).not.toBeNull();
    expect(engine.getShipState().tetherAttachedToId).toBe('salvage-core');

    // Toggle again to cut tether
    const released = engine.toggleTether();
    expect(released).toBe(false);
    expect(engine.getTetherConstraint()).toBeNull();
  });

  it('should dock salvage in Recovery Bay when brought inside at low speed', () => {
    const engine = new SpaceEngine();
    const salvageMap = engine.getSalvageBodies();
    const core = salvageMap.get('salvage-core')!;
    const bay = engine.getRecoveryBay();

    // Place core inside recovery bay
    Matter.Body.setPosition(core.body, { x: bay.x + 20, y: bay.y + 20 });
    Matter.Body.setVelocity(core.body, { x: 0.2, y: 0.1 });

    engine.update(16.66);

    expect(core.item.isSalvaged).toBe(true);
    expect(engine.getShipState().score).toBe(core.item.scoreValue);
  });
});
