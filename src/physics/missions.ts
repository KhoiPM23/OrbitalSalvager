import { MissionData } from './types';

export const ORBITAL_MISSIONS: MissionData[] = [
  // MISSION 1: TUTORIAL / SECTOR ALPHA
  {
    id: 'mission-1',
    missionNumber: 1,
    name: 'MISSION 01: DRIFT RECOVERY',
    subtitle: 'Primary flight telemetry and grapple tow basics.',
    description: 'A light communication relay has drifted away from the orbital outpost. Use thrusters [W] and RCS [A/D] to approach, attach grapple [SPACE], and gently tow it into the Recovery Bay.',
    initialFuel: 100,
    shipSpawn: { x: 600, y: 550 },
    recoveryBay: { x: 100, y: 100, width: 180, height: 180 },
    asteroids: [],
    salvageItems: [
      {
        id: 'salvage-relay-1',
        name: 'COMMUNICATION RELAY DISH',
        type: 'RELAY',
        mass: 12,
        radius: 16,
        color: '#a855f7',
        initialPos: { x: 850, y: 350 },
        initialVel: { x: -0.2, y: 0.1 },
        isSalvaged: false,
        scoreValue: 800
      }
    ]
  },

  // MISSION 2: SECTOR BETA
  {
    id: 'mission-2',
    missionNumber: 2,
    name: 'MISSION 02: ASTEROID BELT EXTRACTION',
    subtitle: 'Navigating hazardous orbital obstacles & fuel replenishment.',
    description: 'Two salvage targets detected in an active asteroid field. Retrieve the volatile fuel pod first to replenish your thruster tanks (+40% fuel) before hauling the sensor pod.',
    initialFuel: 85,
    shipSpawn: { x: 600, y: 600 },
    recoveryBay: { x: 100, y: 100, width: 170, height: 170 },
    asteroids: [
      { id: 'ast-1', x: 420, y: 340, radius: 48, sides: 6 },
      { id: 'ast-2', x: 780, y: 440, radius: 56, sides: 5 }
    ],
    salvageItems: [
      {
        id: 'salvage-fuel-2',
        name: 'VOLATILE FUEL CELL POD',
        type: 'FUEL_POD',
        mass: 18,
        radius: 18,
        color: '#ffaa00',
        initialPos: { x: 320, y: 650 },
        initialVel: { x: 0.25, y: -0.15 },
        isSalvaged: false,
        scoreValue: 1000
      },
      {
        id: 'salvage-relay-2',
        name: 'ORBITAL SENSOR ARRAY',
        type: 'RELAY',
        mass: 14,
        radius: 16,
        color: '#a855f7',
        initialPos: { x: 950, y: 250 },
        initialVel: { x: -0.3, y: 0.2 },
        isSalvaged: false,
        scoreValue: 900
      }
    ]
  },

  // MISSION 3: SECTOR GAMMA
  {
    id: 'mission-3',
    missionNumber: 3,
    name: 'MISSION 03: HIGH-MASS EXTRACTION',
    subtitle: 'Master Trial: Heavy inertia management & tight fuel budget.',
    description: 'A runaway 45-ton Titanium Reactor Core threatens orbital shipping. Its high mass has enormous momentum: apply counter-thrust to slow it down and prevent tether snapping!',
    initialFuel: 75,
    shipSpawn: { x: 600, y: 620 },
    recoveryBay: { x: 100, y: 100, width: 160, height: 160 },
    asteroids: [
      { id: 'ast-1', x: 360, y: 320, radius: 42, sides: 6 },
      { id: 'ast-2', x: 680, y: 380, radius: 52, sides: 7 },
      { id: 'ast-3', x: 920, y: 560, radius: 46, sides: 5 }
    ],
    salvageItems: [
      {
        id: 'salvage-core-3',
        name: 'TITANIUM REACTOR CORE',
        type: 'CORE',
        mass: 45,
        radius: 24,
        color: '#00e5ff',
        initialPos: { x: 1000, y: 220 },
        initialVel: { x: -0.4, y: 0.25 },
        isSalvaged: false,
        scoreValue: 1800
      },
      {
        id: 'salvage-fuel-3',
        name: 'EMERGENCY FUEL RESERVE',
        type: 'FUEL_POD',
        mass: 20,
        radius: 18,
        color: '#ffaa00',
        initialPos: { x: 260, y: 640 },
        initialVel: { x: 0.2, y: -0.2 },
        isSalvaged: false,
        scoreValue: 1200
      },
      {
        id: 'salvage-relay-3',
        name: 'ENCRYPTED BLACKBOX DISH',
        type: 'RELAY',
        mass: 12,
        radius: 15,
        color: '#a855f7',
        initialPos: { x: 750, y: 700 },
        initialVel: { x: -0.25, y: -0.2 },
        isSalvaged: false,
        scoreValue: 1000
      }
    ]
  },

  // MISSION 4: SECTOR DELTA (Climax Black Hole Singularity)
  {
    id: 'mission-4',
    missionNumber: 4,
    name: 'MISSION 04: SINGULARITY HORIZON',
    subtitle: 'Gravitational slingshot maneuver around a micro-black-hole anomaly.',
    description: 'A dark matter core and high-yield fuel cell are caught in a gravitational anomaly! Slingshot around the gravity well, tow the cargo with your tether, and escape the gravitational pull into the Recovery Bay.',
    initialFuel: 85,
    shipSpawn: { x: 320, y: 680 },
    recoveryBay: { x: 100, y: 100, width: 170, height: 170 },
    asteroids: [
      { id: 'ast-sing-1', x: 440, y: 260, radius: 48, sides: 6 },
      { id: 'ast-sing-2', x: 880, y: 560, radius: 54, sides: 5 }
    ],
    gravityWells: [
      {
        id: 'singularity-core',
        x: 640,
        y: 400,
        mass: 26000,
        radius: 34,
        color: '#ec4899'
      }
    ],
    salvageItems: [
      {
        id: 'salvage-antimatter',
        name: 'VOLATILE ANTIMATTER CELL',
        type: 'FUEL_POD',
        mass: 18,
        radius: 18,
        color: '#ffaa00',
        initialPos: { x: 500, y: 490 },
        initialVel: { x: 0.35, y: 0.15 },
        isSalvaged: false,
        scoreValue: 1200
      },
      {
        id: 'salvage-sing-core',
        name: 'SINGULARITY POWER CORE',
        type: 'CORE',
        mass: 42,
        radius: 24,
        color: '#00e5ff',
        initialPos: { x: 840, y: 280 },
        initialVel: { x: -0.35, y: -0.2 },
        isSalvaged: false,
        scoreValue: 2200
      }
    ]
  }
];

