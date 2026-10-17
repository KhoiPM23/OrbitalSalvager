# OrbitalSalvager — 2D Momentum & Tether Salvage

A 2D physics-based space recovery game built around inertial momentum, Matter.js spring-constraint cable mechanics, and zero-gravity thruster navigation.

![OrbitalSalvager](https://img.shields.io/badge/License-MIT-blue.svg)
![Build](https://img.shields.io/badge/Build-Passing-brightgreen.svg)
![Tests](https://img.shields.io/badge/Tests-4%2F4%20Passing-brightgreen.svg)

---

## 🚀 The Mission

Pilot an industrial recovery tug in Low Earth Orbit. Secure valuable derelict wreckage floating in Sector 4 and tow each object into the Mothership's **Recovery Bay**:

1. **Titanium Reactor Core** (Heavy mass: 38t) — High salvage bounty, significant towing inertia.
2. **Volatile Fuel Pod** (Medium mass: 18t) — Refuels your ship by +40% upon safe docking!
3. **Comm Satellite Relay** (Light mass: 10t) — Fragile high-frequency orbital dish.

---

## 🕹️ Controls

| Control | Function |
| :--- | :--- |
| `W` / `ArrowUp` | **Main Forward Thrusters** (Consumes fuel, applies forward momentum) |
| `A` / `D` / `ArrowLeft` / `ArrowRight` | **RCS Lateral Thrusters** (Rotates spacecraft) |
| `S` / `ArrowDown` | **Retro-Brake Thrusters** (Bleeds off orbital velocity) |
| `Space` | **Grapple Tether Toggle**: Locks cable onto nearest salvage object; press again to release |
| `R` | **Reset Sector**: Resets spacecraft and floating salvage objects |

---

## 🛠️ Architecture & Physics

- **Matter.js 2D Rigid-Body Dynamics**: Full Newtonian zero-g simulation with angular momentum, inertia tensor, and elastic `Constraint` spring-cable physics with configurable stiffness and damping.
- **Dynamic Cable Tension System**: The tether stretches under load with color-coded strain warnings (`Cyan` -> `Yellow` -> `Red`) and will snap if subjected to violent whiplash forces (> 220px stretch).
- **Procedural Space Audio**: Native Web Audio API synthesizing thruster engine rumble, RCS gas puffs, tether latch metallic clanks, and dock chimes.
- **Vector CRT Radar Display**: 60 FPS Canvas2D graphics with stardust grid, animated tractor beam rings, and directional guidance arrows.

---

## 🧪 Testing & Verification

Run the Vitest test suite:
```bash
npm test
```

Build production bundle:
```bash
npm run build
```

Run local dev server:
```bash
npm run dev
```

---

## 📜 License
MIT License.
