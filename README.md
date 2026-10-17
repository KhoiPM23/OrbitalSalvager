# OrbitalSalvager — 2D Momentum & Tether Salvage

A tactical 2D physics-based space recovery game built around Newtonian inertia, Matter.js spring-constraint cable dynamics, and zero-gravity thruster navigation.

![OrbitalSalvager](https://img.shields.io/badge/License-MIT-blue.svg)
![Build](https://img.shields.io/badge/Build-Passing-brightgreen.svg)
![Tests](https://img.shields.io/badge/Tests-11%2F11%20Passing-brightgreen.svg)

---

## 🚀 Game Overview

Pilot an industrial salvage tug in Low Earth Orbit across 3 distinct hazard sectors. Grapple derelict wreckage, manage momentum transfer, avoid asteroid collisions, and dock cargo into the orbital station's **Recovery Bay**.

### 🌟 Handcrafted Missions

1. **Mission 01: Drift Recovery (Sector Alpha — Tutorial)**
   - *Objective*: Master zero-g thrusters and RCS rotational handling.
   - *Target*: 1x Communication Relay Dish (12t, light mass, clear sector).
   - *Fuel Budget*: 100%.

2. **Mission 02: Asteroid Belt Extraction (Sector Beta — Hazards & Fuel Economy)**
   - *Objective*: Retrieve salvage in an active asteroid field. Dock volatile fuel pods to replenish your thruster tanks.
   - *Targets*: 1x Volatile Fuel Cell Pod (18t, restores +40% fuel upon docking) + 1x Orbital Sensor Array (14t).
   - *Obstacles*: 2x irregular orbital asteroid bodies.
   - *Fuel Budget*: 85%.

3. **Mission 03: High-Mass Extraction (Sector Gamma — Master Trial)**
   - *Objective*: Heavy inertia management and counter-thrust braking under tight fuel constraints.
   - *Targets*: 1x Runaway Titanium Reactor Core (45t, extreme momentum), 1x Reserve Fuel Cell (20t), 1x Blackbox Flight Relay (12t).
   - *Obstacles*: 3x high-density asteroid clusters.
   - *Fuel Budget*: 75%.

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
