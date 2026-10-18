import { MissionData } from './types';

export const ORBITAL_MISSIONS: MissionData[] = [
  // MISSION 1: TUTORIAL / SECTOR ALPHA
  {
    id: 'mission-1',
    missionNumber: 1,
    name: 'MISSION 01: DRIFT RECOVERY',
    subtitle: 'Outer Belt Graveyard — Debris Sector Alpha-9.',
    description: 'A stranded orbital relay from the decommissioned freighter USSC Daedalus has drifted off-course. Fire thrusters [W] and toggle Flight Assist [X] to stabilize your vector, tether the cargo [SPACE], and guide it into Hephaestus Station Recovery Bay.',
    sectorLore: 'Year 2184: Following the Treaty of Ceres, corporate mining vessels abandoned deep-orbit logistics corridors. The Outer Belt Scavengers Guild (OBSG) now retrieves abandoned high-value tech before decaying orbits burn up in planetary entry.',
    initialFuel: 100,
    shipSpawn: { x: 600, y: 550 },
    recoveryBay: { x: 100, y: 100, width: 180, height: 180 },
    asteroids: [],
    wreckage: [
      { id: 'wrk-1-1', x: 400, y: 250, type: 'HULL_FRAGMENT', width: 64, height: 28, rotation: 0.4 },
      { id: 'wrk-1-2', x: 750, y: 180, type: 'SOLAR_BOOM', width: 80, height: 16, rotation: -0.6 },
      { id: 'wrk-1-3', x: 920, y: 480, type: 'BEACON_BUOY', width: 20, height: 20, rotation: 0 }
    ],
    radioComms: [
      {
        trigger: 'START',
        sender: 'Station Dispatcher Vane',
        callsign: 'HEPHAESTUS-1',
        text: 'Tug-07, you are green for salvage. Lock onto the Daedalus transponder and bring her home in one piece.'
      },
      {
        trigger: 'TETHER',
        sender: 'Station Dispatcher Vane',
        callsign: 'HEPHAESTUS-1',
        text: 'Tether locked! Watch the strain gauge. Gentle thrusters — let Newtonian momentum do the heavy lifting.'
      },
      {
        trigger: 'DOCK',
        sender: 'Station Dispatcher Vane',
        callsign: 'HEPHAESTUS-1',
        text: 'Salvage secured in airlock! Blackbox data decrypted. Corporate payout credited to your account.'
      }
    ],
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
        scoreValue: 800,
        derelictShip: 'USSC Daedalus (Registry: SOL-4912)',
        loreLog: 'Transponder Log #08: Navigational computer failure after micrometeorite shower. Auxiliary power routed to distress beacon.',
        bountyCredits: 25000
      }
    ]
  },

  // MISSION 2: SECTOR BETA
  {
    id: 'mission-2',
    missionNumber: 2,
    name: 'MISSION 02: ASTEROID BELT EXTRACTION',
    subtitle: 'Sector Beta — The Iron Shallows.',
    description: 'Two salvage targets detected in an active asteroid field. Retrieve the volatile fuel pod first to replenish your thruster tanks (+40% fuel) before hauling the sensor pod.',
    sectorLore: 'The Iron Shallows was once a bustling refinery hub operated by Weyland-Cobalt Mining Corp. An uncontrolled blast in Ore Silo 4 shattered the station into tumbling metallic asteroids and derelict pods.',
    initialFuel: 85,
    shipSpawn: { x: 600, y: 600 },
    recoveryBay: { x: 100, y: 100, width: 170, height: 170 },
    asteroids: [
      { id: 'ast-1', x: 420, y: 340, radius: 48, sides: 6 },
      { id: 'ast-2', x: 780, y: 440, radius: 56, sides: 5 }
    ],
    wreckage: [
      { id: 'wrk-2-1', x: 550, y: 220, type: 'HULL_FRAGMENT', width: 72, height: 32, rotation: 1.2 },
      { id: 'wrk-2-2', x: 260, y: 480, type: 'SOLAR_BOOM', width: 90, height: 18, rotation: -0.3 },
      { id: 'wrk-2-3', x: 650, y: 150, type: 'BEACON_BUOY', width: 22, height: 22, rotation: 0 }
    ],
    radioComms: [
      {
        trigger: 'START',
        sender: 'Station Dispatcher Vane',
        callsign: 'HEPHAESTUS-1',
        text: 'Caution, pilot. Heavy iron asteroids in this corridor. Use deflector shields if you graze an outcrop.'
      },
      {
        trigger: 'TETHER',
        sender: 'Station Dispatcher Vane',
        callsign: 'HEPHAESTUS-1',
        text: 'Fuel pod hitched! Don’t rupture the containment valves — tow it smoothly into bay docking clamps.'
      },
      {
        trigger: 'DOCK',
        sender: 'Station Dispatcher Vane',
        callsign: 'HEPHAESTUS-1',
        text: 'Docking clamps engaged. Fuel transferred to your primary tanks. Sensor array next!'
      }
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
        scoreValue: 1000,
        derelictShip: 'Refinery Barge Weyland-3',
        loreLog: 'Cargo Manifest #104: Pressurized hydrazine fuel pod jettisoned during evacuation. 92% purity verified.',
        bountyCredits: 35000
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
        scoreValue: 900,
        derelictShip: 'Survey Craft Kepler-X',
        loreLog: 'Science Log #19: Deep-space telemetry array containing classified gravitational anomaly readings in Sector Delta.',
        bountyCredits: 40000
      }
    ]
  },

  // MISSION 3: SECTOR GAMMA
  {
    id: 'mission-3',
    missionNumber: 3,
    name: 'MISSION 03: HIGH-MASS EXTRACTION',
    subtitle: 'Sector Gamma — The Wreck of Battleship Ares.',
    description: 'A runaway 45-ton Titanium Reactor Core threatens orbital shipping. Its high mass has enormous momentum: apply counter-thrust to slow it down and prevent tether snapping!',
    sectorLore: 'The Ares was the flagship of the Martian Coalition during the border skirmishes of 2179. Her shattered reactor compartment still leaks plasma through an asteroid choke point.',
    initialFuel: 75,
    shipSpawn: { x: 600, y: 620 },
    recoveryBay: { x: 100, y: 100, width: 160, height: 160 },
    asteroids: [
      { id: 'ast-1', x: 360, y: 320, radius: 42, sides: 6 },
      { id: 'ast-2', x: 680, y: 380, radius: 52, sides: 7 },
      { id: 'ast-3', x: 920, y: 560, radius: 46, sides: 5 }
    ],
    wreckage: [
      { id: 'wrk-3-1', x: 500, y: 180, type: 'HULL_FRAGMENT', width: 110, height: 45, rotation: 0.8 },
      { id: 'wrk-3-2', x: 800, y: 250, type: 'SOLAR_BOOM', width: 95, height: 22, rotation: -1.1 },
      { id: 'wrk-3-3', x: 300, y: 480, type: 'BEACON_BUOY', width: 24, height: 24, rotation: 0 }
    ],
    radioComms: [
      {
        trigger: 'START',
        sender: 'Station Dispatcher Vane',
        callsign: 'HEPHAESTUS-1',
        text: 'Attention Tug-07: The Ares reactor core weighs 45 tons! If it builds up speed, it will drag your tug with it.'
      },
      {
        trigger: 'TETHER',
        sender: 'Station Dispatcher Vane',
        callsign: 'HEPHAESTUS-1',
        text: 'Tether locked on the Core! Reverse thrusters immediately — do not let the cable snap from strain.'
      },
      {
        trigger: 'DOCK',
        sender: 'Station Dispatcher Vane',
        callsign: 'HEPHAESTUS-1',
        text: 'Titanium core secured in stasis field! That reactor alone could power Hephaestus for a decade.'
      }
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
        scoreValue: 1800,
        derelictShip: 'Battleship Ares (Flagship)',
        loreLog: 'Tactical Log #99: Magnetic containment breach. Reactor jettisoned prior to catastrophic hull fracture.',
        bountyCredits: 75000
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
        scoreValue: 1200,
        derelictShip: 'Battleship Ares (Auxiliary)',
        loreLog: 'Quartermaster Log #12: Military-grade refined deuterium. Restores +40% ship fuel upon bay contact.',
        bountyCredits: 30000
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
        scoreValue: 1000,
        derelictShip: 'Fleet Command Envoy',
        loreLog: 'Intelligence File #881: Classified war records detailing the hidden singularity experiments in Sector Delta.',
        bountyCredits: 45000
      }
    ]
  },

  // MISSION 4: SECTOR DELTA (Black Hole Singularity)
  {
    id: 'mission-4',
    missionNumber: 4,
    name: 'MISSION 04: SINGULARITY HORIZON',
    subtitle: 'Sector Delta — The Gravity Well of Outpost Hades.',
    description: 'A dark matter core and high-yield fuel cell are caught in a gravitational anomaly! Slingshot around the gravity well, tow the cargo with your tether, and escape the gravitational pull into the Recovery Bay.',
    sectorLore: 'Project Hades was a covert dark-matter research station that suffered a micro-singularity containment breach in 2182. The station imploded, creating an active black hole that traps surrounding debris.',
    initialFuel: 85,
    shipSpawn: { x: 320, y: 680 },
    recoveryBay: { x: 100, y: 100, width: 170, height: 170 },
    asteroids: [
      { id: 'ast-sing-1', x: 440, y: 260, radius: 48, sides: 6 },
      { id: 'ast-sing-2', x: 880, y: 560, radius: 54, sides: 5 }
    ],
    wreckage: [
      { id: 'wrk-4-1', x: 720, y: 220, type: 'HULL_FRAGMENT', width: 90, height: 35, rotation: -0.5 },
      { id: 'wrk-4-2', x: 500, y: 600, type: 'SOLAR_BOOM', width: 120, height: 20, rotation: 0.9 },
      { id: 'wrk-4-3', x: 820, y: 380, type: 'BEACON_BUOY', width: 22, height: 22, rotation: 0 }
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
    radioComms: [
      {
        trigger: 'START',
        sender: 'Station Dispatcher Vane',
        callsign: 'HEPHAESTUS-1',
        text: 'Warning: Micro-singularity detected! Keep outside the event horizon photon ring. Use the gravity well for slingshot acceleration.'
      },
      {
        trigger: 'TETHER',
        sender: 'Station Dispatcher Vane',
        callsign: 'HEPHAESTUS-1',
        text: 'Antimatter tethered! Gravitational gradient is severe — boost tangentially to break orbit!'
      },
      {
        trigger: 'DOCK',
        sender: 'Station Dispatcher Vane',
        callsign: 'HEPHAESTUS-1',
        text: 'Incredible recovery! The Hades antimatter payload is safely isolated in magnetic containment.'
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
        scoreValue: 1200,
        derelictShip: 'Research Outpost Hades',
        loreLog: 'Lab Record #442: Pure antimatter containment pod. Extreme energy density, handles with utmost care.',
        bountyCredits: 50000
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
        scoreValue: 2200,
        derelictShip: 'Hades Quantum Collider',
        loreLog: 'Incident Report #01: Experimental gravimetric stabilizer prototype. Irreplaceable pre-war scientific relic.',
        bountyCredits: 90000
      }
    ]
  },

  // MISSION 5: THE BINARY PULSARS
  {
    id: 'mission-5',
    missionNumber: 5,
    name: 'MISSION 05: THE BINARY PULSARS',
    subtitle: 'Sector Omega — The Ancient Gravitational Crucible.',
    description: 'Two co-orbiting micro-pulsars create a chaotic gravitational field! Retrieve the 50t Hyper-Density Dark Matter Core and emergency fuel cells caught between the twin singularities.',
    sectorLore: 'Sector Omega was considered impassable navigation space. Ancient alien artifacts orbit between two hyper-dense micro-pulsars. The Guild has authorized maximum bounty compensation for pilots who retrieve the Dark Core.',
    initialFuel: 90,
    shipSpawn: { x: 200, y: 350 },
    recoveryBay: { x: 960, y: 80, width: 180, height: 160 },
    asteroids: [
      { id: 'ast-bin-1', x: 260, y: 160, radius: 44, sides: 6 },
      { id: 'ast-bin-2', x: 880, y: 520, radius: 52, sides: 7 }
    ],
    wreckage: [
      { id: 'wrk-5-1', x: 420, y: 180, type: 'HULL_FRAGMENT', width: 95, height: 38, rotation: 0.3 },
      { id: 'wrk-5-2', x: 780, y: 580, type: 'SOLAR_BOOM', width: 110, height: 24, rotation: -0.8 },
      { id: 'wrk-5-3', x: 580, y: 220, type: 'BEACON_BUOY', width: 24, height: 24, rotation: 0 }
    ],
    gravityWells: [
      {
        id: 'pulsar-alpha',
        x: 480,
        y: 280,
        mass: 22000,
        radius: 30,
        color: '#06b6d4'
      },
      {
        id: 'pulsar-beta',
        x: 720,
        y: 460,
        mass: 24000,
        radius: 32,
        color: '#a855f7'
      }
    ],
    radioComms: [
      {
        trigger: 'START',
        sender: 'Station Dispatcher Vane',
        callsign: 'HEPHAESTUS-1',
        text: 'This is the big one, Tug-07. Binary singularities ahead. If you retrieve that Dark Matter Core, you’ll be a Guild legend.'
      },
      {
        trigger: 'TETHER',
        sender: 'Station Dispatcher Vane',
        callsign: 'HEPHAESTUS-1',
        text: 'Hyper-Density Core hooked! 50 tons in a dual gravity vortex — toggle dampeners and burn retro-thrusters!'
      },
      {
        trigger: 'DOCK',
        sender: 'Station Dispatcher Vane',
        callsign: 'HEPHAESTUS-1',
        text: 'MISSION ACCOMPLISHED! Dark Matter Core safely docked. The entire Guild salutes your navigation skills, pilot.'
      }
    ],
    salvageItems: [
      {
        id: 'salvage-fuel-bin',
        name: 'STABILIZED DEUTERIUM CELL',
        type: 'FUEL_POD',
        mass: 16,
        radius: 17,
        color: '#ffaa00',
        initialPos: { x: 380, y: 540 },
        initialVel: { x: 0.2, y: -0.2 },
        isSalvaged: false,
        scoreValue: 1400,
        derelictShip: 'Deep-Space Explorer Chronos',
        loreLog: 'Navigation Log #310: Antimatter fuel capsule jettisoned when navigational chronometers desynced near the pulsar pair.',
        bountyCredits: 60000
      },
      {
        id: 'salvage-dark-core',
        name: 'HYPER-DENSITY DARK CORE',
        type: 'CORE',
        mass: 50,
        radius: 26,
        color: '#c084fc',
        initialPos: { x: 600, y: 370 },
        initialVel: { x: 0.1, y: 0.25 },
        isSalvaged: false,
        scoreValue: 3000,
        derelictShip: 'The Obelisk Megastructure',
        loreLog: 'Archive File #Omega: Extraterrestrial hyper-density artifact. Distorts localized spacetime metrics within 500 meters.',
        bountyCredits: 150000
      }
    ]
  }
];
