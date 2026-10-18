export type SalvageType = 'CORE' | 'FUEL_POD' | 'RELAY';

export interface SalvageItem {
  id: string;
  name: string;
  type: SalvageType;
  mass: number;
  radius: number;
  color: string;
  initialPos: { x: number; y: number };
  initialVel: { x: number; y: number };
  isSalvaged: boolean;
  scoreValue: number;
  derelictShip?: string;
  loreLog?: string;
  bountyCredits?: number;
}

export interface AsteroidHazard {
  id: string;
  x: number;
  y: number;
  radius: number;
  sides: number;
}

export interface WreckageHazard {
  id: string;
  x: number;
  y: number;
  type: 'HULL_FRAGMENT' | 'SOLAR_BOOM' | 'BEACON_BUOY';
  width: number;
  height: number;
  rotation: number;
}

export interface GravityAnomaly {
  id: string;
  x: number;
  y: number;
  mass: number;
  radius: number;
  color?: string;
}

export interface RadioCommMessage {
  trigger: 'START' | 'TETHER' | 'DOCK' | 'LOW_FUEL' | 'SINGULARITY';
  sender: string;
  callsign: string;
  text: string;
}

export interface MissionData {
  id: string;
  missionNumber: number;
  name: string;
  subtitle: string;
  description: string;
  sectorLore: string;
  initialFuel: number;
  shipSpawn: { x: number; y: number };
  recoveryBay: { x: number; y: number; width: number; height: number };
  asteroids: AsteroidHazard[];
  wreckage?: WreckageHazard[];
  salvageItems: SalvageItem[];
  gravityWells?: GravityAnomaly[];
  radioComms?: RadioCommMessage[];
}


export interface ShipUpgrades {
  thrusterTier: number; // 0..3 (+20% thrust per tier)
  tetherTier: number;   // 0..3 (+25% range & +30% snap tolerance)
  hullTier: number;     // 0..3 (+25 max hull per tier)
  gyroTier: number;     // 0..3 (+20% turning agility & braking)
}

export interface ShipState {
  fuel: number; // 0 to 100
  hull: number; // 0 to 100
  shield: number; // 0 to 100
  maxFuel: number;
  maxHull: number;
  maxShield: number;
  flightAssist: boolean; // Inertial dampener auto-stabilizer
  lockedTargetId: string | null;
  score: number;
  tetherAttachedToId: string | null;
  tetherLength: number;
  tetherTension: number; // 0 to 1
  isThrusting: boolean;
  isTurningLeft: boolean;
  isTurningRight: boolean;
  isBraking: boolean;
}

export interface MissionMetrics {
  missionNumber: number;
  missionName: string;
  score: number;
  fuelRemaining: number;
  hullRemaining: number;
  salvagedCount: number;
  totalItems: number;
  timeElapsedSeconds: number;
}

export type GameStatus = 'PLAYING' | 'PAUSED' | 'WON' | 'DESTROYED' | 'STRANDED';

export interface GameEvent {
  type: 'TETHER_LATCH' | 'TETHER_CUT' | 'SALVAGE_SECURED' | 'COLLISION_DAMAGE' | 'FUEL_EMPTY' | 'VICTORY' | 'GAME_OVER';
  message?: string;
  intensity?: number;
}
