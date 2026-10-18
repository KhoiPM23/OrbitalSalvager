# OrbitalSalvager — 3D Momentum & Tether Salvage

A tactical 3D WebGL physics-based space recovery game built with Three.js and Matter.js, featuring Newtonian zero-g inertia, procedural PBR textures, spring-constraint cable dynamics, and gravitational singularities.

![OrbitalSalvager](https://img.shields.io/badge/License-MIT-blue.svg)
![Build](https://img.shields.io/badge/Build-Passing-brightgreen.svg)
![Tests](https://img.shields.io/badge/Tests-16%2F16%20Passing-brightgreen.svg)
![Graphics](https://img.shields.io/badge/Graphics-Three.js%203D%20WebGL-cyan.svg)

---

## 🚀 Game Overview

Pilot an industrial salvage tug in deep space across 5 challenging mission sectors. Grapple derelict wreckage, manage momentum transfer, deflect asteroid collisions with rechargeable force-field shields, navigate around gravitational singularities, and dock cargo into the orbital station's **Recovery Bay**.

### 🌟 Handcrafted Missions

1. **Mission 01: Drift Recovery (Sector Alpha — Tutorial)**
   - *Objective*: Master zero-g thrusters, Flight Assist dampeners, and grapple tethering.
   - *Target*: 1x Communication Relay Dish (12t, light mass, clear sector).
   - *Fuel Budget*: 100%.

2. **Mission 02: Asteroid Belt Extraction (Sector Beta — Hazards & Fuel Economy)**
   - *Objective*: Retrieve salvage in an active asteroid field. Dock volatile fuel pods to replenish thruster tanks.
   - *Targets*: 1x Volatile Fuel Cell Pod (18t, restores +40% fuel) + 1x Orbital Sensor Array (14t).
   - *Obstacles*: 2x irregular 3D textured asteroid hazards.
   - *Fuel Budget*: 85%.

3. **Mission 03: High-Mass Extraction (Sector Gamma — Master Trial)**
   - *Objective*: Heavy inertia management and counter-thrust braking under tight fuel constraints.
   - *Targets*: 1x Runaway Titanium Reactor Core (45t, extreme momentum), 1x Reserve Fuel Cell (20t), 1x Blackbox Flight Relay (12t).
   - *Obstacles*: 3x high-density asteroid clusters.
   - *Fuel Budget*: 75%.

4. **Mission 04: Singularity Horizon (Sector Delta — Gravitational Slingshot)**
   - *Objective*: Exploit Newtonian gravitational pull from a micro-singularity to slingshot salvage containers.
   - *Targets*: 1x Volatile Antimatter Pod (25t), 1x Encrypted Nav Beacon (15t).
   - *Obstacles*: 1x active gravitational anomaly well with swirling accretion disk.

5. **Mission 05: The Binary Pulsars (Sector Omega — Endgame Gravity Ballet)**
   - *Objective*: Navigate complex dual gravitational wells to extract ultra-heavy dark matter salvage.
   - *Targets*: 1x Dark Matter Core (50t), 1x Deep Space Transponder (18t).
   - *Obstacles*: 2x binary gravitational singularities + dense asteroid perimeter.

---

## 🕹️ Flight Controls

| Key | Action | Description |
| :--- | :--- | :--- |
| `W` / `↑` | **Main Forward Thrusters** | Fires main engine, consumes fuel, applies prograde momentum |
| `A` / `D` / `←` / `→` | **Lateral RCS Attitude** | Angular rotation of the salvage tug |
| `S` / `↓` | **Retro-Brake Thrusters** | Burns counter-thrust to rapidly bleed linear velocity |
| `Space` | **Grapple Tether Toggle** | Locks magnetic cable onto nearest salvage object (< 280px); press again to disconnect |
| `R` | **Reset Sector** | Instantly reloads current mission sector |
| `P` | **Pause / Resume** | Freezes Matter.js simulation and timer |
| `M` | **Mute Audio** | Toggles procedural Web Audio SFX on/off |

---

## 🛠️ Architecture & Physics Implementation

- **Matter.js 2D Rigid-Body Dynamics**: Full Newtonian zero-g simulation (`gravity = { x: 0, y: 0, scale: 0 }`). Handles angular inertia, mass scaling (12t to 45t), and elastic `Constraint` spring-cable mechanics with tuned stiffness (0.06) and damping (0.12).
- **Dynamic Cable Strain & Whiplash Snapping**: The tether computes real-time stretch distance. Strain is rendered dynamically (`Cyan` at 0% strain -> `Yellow` at 50% -> `Red` at 85%+). Exceeding 220px stretch snaps the tether instantly to prevent numerical instability.
- **Predictive Flight Vector**: Canvas2D renders real-time prograde velocity vectors and distance telemetry from the tug's nose.
- **Hull Collision & Impact Shake**: High-speed collisions (> 1.2 px/ms) inflict hull integrity damage and trigger screen shake. Hull reaching 0% triggers mission failure.
- **Clean Physics Lifecycle**: Switching missions or resetting calls `World.clear(engine.world, false)`, completely removing old bodies and constraints to avoid memory leaks or ghost collisions.
- **100% Procedural Web Audio**: Native Web Audio API synthesis without external audio files. Generates thruster low-pass rumbles, RCS white-noise bursts, metallic latch clanks, high-tension snap twangs, and harmonic docking chimes.

---

## 🧪 Testing & Verification

Run the Vitest test suite (11 unit tests covering flight, RCS, tether latch/break, docking, fuel restoration, multi-missions, and pause/resume):
```bash
npm test
```

Build production bundle:
```bash
npm run build
```

Run local dev server (Dedicated port `7004` — no port collision):
```bash
npm run dev
# Open http://localhost:7004
```

---

## 📜 Asset & Dependency Licenses

- **Engine & Libraries**:
  - `matter-js` (MIT License) — 2D rigid-body physics engine.
  - `vite` & `typescript` (MIT License) — Build toolchain.
  - `vitest` (MIT License) — Testing framework.
- **Graphics & Sounds**:
  - 100% original Canvas2D procedural geometry, vector CRT radar grid, and procedural Web Audio API sound effects. Zero external asset packs or commercial audio files used.
- **Game Project**: MIT License.
