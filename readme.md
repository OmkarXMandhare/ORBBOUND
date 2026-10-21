<p align="center">
  <a href="https://omkarxmandhare.github.io/ORBBOUND/">🌐 Live Website</a>
  •
  <a href="https://github.com/OmkarXMandhare">💻 GitHub Repository</a>
</p>
# 🔴 ORBBOUND

> A retro-inspired, physics-driven 2D platformer adventure built with HTML5 Canvas and vanilla JavaScript. Morph between distinct orb states, master cannon trajectories, survive hazardous laser citadels, and explore vast scrolling worlds.

---

## 🎮 Play & Controls

ORBBOUND supports **Keyboard**, **Mobile Touchscreens**, and **Gamepads (Xbox, PlayStation, USB/Bluetooth)** natively out of the box.

| Action | Keyboard | Touchscreen | Gamepad (Xbox / PS) |
| :--- | :--- | :--- | :--- |
| **Move Left / Right** | `A` / `D` or `←` / `→` | Virtual D-Pad (Left / Right) | Left Stick or D-Pad |
| **Jump / Swim** | `Space` / `W` / `↑` | `JUMP` Button | `A` (Xbox) / `Cross` (PS) |
| **Aim Cannon** | `W` / `S` or `↑` / `↓` | `▲` / `▼` Aim Buttons | Left Stick Y or D-Pad |
| **Fire Cannon** | `Space` or `Enter` | `JUMP` Button | `A` (Xbox) / `Cross` (PS) |
| **Normal Orb** | `1` | `🔴 NORM` Header Pill | `B` (Xbox) / `Circle` (PS) |
| **Balloon Orb** | `2` | `🔵 AIR` Header Pill | `X` (Xbox) / `Square` (PS) |
| **Stone Orb** | `3` | `⚪ STONE` Header Pill | `Y` (Xbox) / `Triangle` (PS) |
| **Toggle Radar** | `Tab` | Radar Header Tap | — |
| **Level Select** | `M` | `[M] Menu` HUD | `Start` / `Options` |
| **Quick Restart** | `R` | — | `Select` / `Share` |

---

## 🔮 Orb Forms & Physics

Transformation alters your physical mass, bounce coefficient, buoyancy, and environmental immunity:

* **🔴 Normal Orb:**
  * Balanced ground speed ($270\text{ px/s}$) and standard jump power ($560\text{ px/s}$).
  * Moderate density; slowly sinks in water pools with active swimming strokes.
* **🔵 Balloon Orb:**
  * Ultra-light gravity ($780\text{ px/s}^2$) and high vertical spring ($670\text{ px/s}$).
  * High elastic rebound ($0.55\times$ bounce factor).
  * Highly buoyant ($2.3\times$ lift)—floats and skims across deep water channels.
* **⚪ Stone Orb:**
  * Heavy density and rapid gravity drop ($2600\text{ px/s}^2$).
  * Zero bounce; drops like an anchor to navigate lakebeds under hazards.
  * **Immunity:** Deflects floor spikes and absorbs pulsing laser gates without damage.
  * **Destruction:** Smashes through cracked stone barriers on impact.

---

## 🚀 Key Features

* **Large-World Scrolling (2400 × 1000):** Levels extend across multiple screens horizontally and vertically, rendered with smooth lerp tracking ($0.08\times$ factor).
* **Picture-in-Picture (PiP) Radar:** Live mini-map in the bottom-right corner displaying platforms, water, hazards, checkpoints, uncollected rings, and camera frustum. Supports click/drag scouting.
* **Interactive Cannon Launchers:** Enter cannons, adjust launch angles dynamically, and fire at high velocity ($850\text{+ px/s}$) over spike beds.
* **Environmental Hazards:** Timed pulsing neon lasers, sinusoidal flying spike drones, moving floating lifts, deep water basins, and breakable walls.
* **Dynamic Particle Engine:** Procedural debris on block shattering, water entry splashes, bubble trails, landing dust puffs, cannon exhaust smoke, and form-morph novae.
* **Multi-Level Campaign:** Built-in progression with automatic stage transitions and a Level Select overlay.

---

## 📁 Project Structure

```text
orbbound/
├── index.html        # Game viewport, canvas, and UI overlay
├── style.css         # Styling for glassmorphic HUD and overlays
├── game.js           # Full game engine, physics, levels, and render loop
└── README.md         # Documentation and guide
🛠️ Getting Started
No build tools, bundlers, or package installations required.

Clone or download the repository:

Bash
git clone [https://github.com/your-username/orbbound.git](https://github.com/your-username/orbbound.git)
cd orbbound
Open index.html in any modern web browser (Chrome, Firefox, Safari, Edge).

Alternatively, run a lightweight local server:

Bash
npx serve .
# or
python3 -m http.server 8000
🗺️ Levels Overview
Level 1: The Great Expedition

Long-distance trek across ground reservoirs, high platforms, cannon puzzles, and cracked walls.

Level 2: Floating Caverns

Multi-tiered vertical climb featuring deep chasms, dual water channels, and laser security grids.

📄 License
This project is open-source and available under the MIT License.


<ElicitationsGroup message="Next steps for your ORBBOUND repository:">
  <Elicitation label="Create matching index.html and style.css files" query="Generate the production-ready index.html and style.css files matching this README and game.js."/>
  <Elicitation label="Add Web Audio API retro sound effects" query="Add procedural 8-bit sound effects using the Web Audio API for jumping, landing, laser hums, morphing, and cannon launches."/>
  <Elicitation label="Add Level 3 back into the large-world level list" query="Add the large 2400x1000 version of Level 3: Neon Citadel to the game.js level list."/>
</ElicitationsGroup>
