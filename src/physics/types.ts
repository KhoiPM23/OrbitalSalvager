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
}

export interface AsteroidHazard {
  id: string;
  x: number;
  y: number;
  radius: number;
  sides: number;
}

export interface MissionData {
  id: string;
  missionNumber: number;
  name: string;
  subtitle: string;
  description: string;
  initialFuel: number;
  shipSpawn: { x: number; y: number };
  recoveryBay: { x: number; y: number; width: number; height: number };
  asteroids: AsteroidHazard[];
  salvageItems: SalvageItem[];
}

export interface ShipState {
  fuel: number; // 0 to 100
  hull: number; // 0 to 100
  maxFuel: number;
  maxHull: number;
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
