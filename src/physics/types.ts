export interface SalvageItem {
  id: string;
  name: string;
  type: 'CORE' | 'FUEL_POD' | 'RELAY';
  mass: number;
  radius: number;
  color: string;
  initialPos: { x: number; y: number };
  initialVel: { x: number; y: number };
  isSalvaged: boolean;
  scoreValue: number;
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

export type GameStatus = 'PLAYING' | 'WON' | 'DESTROYED' | 'STRANDED';

export interface GameEvent {
  type: 'TETHER_LATCH' | 'TETHER_CUT' | 'SALVAGE_SECURED' | 'COLLISION_DAMAGE' | 'FUEL_EMPTY' | 'VICTORY' | 'GAME_OVER';
  message?: string;
  intensity?: number;
}
