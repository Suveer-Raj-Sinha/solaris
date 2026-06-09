# 🪐 Solaris — 3D Interactive Solar System Explorer

Solaris is a production-quality, cinematic, and educational 3D digital planetarium that lets users explore the cosmos from a spaceship cockpit, navigate via warp speed travel, and decrypt geological planetary anomalies. 

Built as an interactive museum, the project combines high-performance WebGL graphics, physical orbital simulation, dynamic audio feedback, and modern web technologies to turn learning about space into an adventure.

---

## 🚀 Key Features

### 1. Dynamic Physics Simulation & Time Warp
- **Time Accelerator**: Accelerate planetary orbits in real-time from `0x` (paused) up to `50x` speeds.
- **Display Toggles**: Customize the cockpit interface by toggling orbital line rings and floating planet name tags dynamically.

### 2. Warp Speed Post-Processing Blur
- **Hyperspace Motion Blur**: Driven by `@react-three/postprocessing` utilizing custom `<Bloom>`, `<ChromaticAberration>`, and `<Vignette>` nodes.
- **GSAP Timelines**: Synchronized camera transitions that trigger vignette tunneling, a chromatic aberration spike (`0.09` offset) at takeoff, high-frequency cruise vibration noise, and a smooth deceleration decay upon arrival.

### 3. Atmospheric Scattering Shaders
- **GLSL Shaders**: Custom vertex/fragment atmospheric rim shaders mapped on Earth, Venus, and Neptune.
- **Sun-Facing Corona Glow**: Confines the colored scattering halo to the sunlit side of the planet relative to the Sun's coordinates, fading realistically into the shadow side.

### 4. Saturn Ring Self-Shadowing
- **Ray-Sphere Intersection Shader**: A custom double-sided GLSL material for Saturn and Uranus rings that calculates light-blocking from the planet's spherical body.
- **Realistic Soft Shadows**: Casts dynamic, soft-edged planet shadows across the concentric ring bands in real-time as the planets orbit.

### 5. Detailed Moon & Telemetry Systems
- **Interactive Orbiters**: Maps and renders 15 moons across the Solar System (including Earth, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto).
- **Retrograde Physics**: Simulates retrograde orbits (e.g. Neptune's moon Triton) revolving in reverse.
- **Science Telemetry**: Clicking on moons locks camera targets with zoom limits and slides open fact sheets (gravity, orbital periods, radius, temperatures).

### 6. Audio-Guided Geiger Scanner
- **Geiger Proximity Scanner**: Calculates camera vector dot products with undiscovered geological anomalies on planetary surfaces.
- **Dynamic Sonar Ping**: High-frequency FM synth beeps accelerate as the camera directly faces a hotspot coordinates.

---

## 🛠️ Technology Stack

- **3D Graphics Engine**: Three.js, React Three Fiber (R3F), and `@react-three/drei`
- **Post-Processing**: `@react-three/postprocessing`
- **Asset Optimizer**: Procedural 3D noise canvas texture generator (FBM value noise cached globally for offline-first resilience)
- **State Architecture**: Zustand (unified deterministic clock orbits)
- **Transitions & Math**: GSAP (GreenSock Animation Platform)
- **Sound Synth**: Web Audio API (Synthesized ambient pads, low cockpit hum, FM sweep warp tones, and geiger pings)
- **Styling**: Tailwind CSS & Vanilla CSS

---

## 📂 Directory Structure

```text
├── data/
│   ├── planets.json         # Physical statistics, colors, sizes, and hotspot coordinates
│   ├── moons.json           # Orbit speeds, parent keys, descriptions, and telemetry
│   ├── discoveries.json     # Decryptable log sheet descriptions of anomalies
│   └── facts.json           # Cockpit monitor sliding factual cards
├── src/
│   ├── components/
│   │   ├── Cockpit.jsx      # Command deck overlays and takeoff speed indicators
│   │   ├── SpaceHUD.jsx     # Navigation maps, time factor switches, and telemetry tabs
│   │   └── JournalModal.jsx # Nav computer logs and About the Creator profile
│   ├── planets/
│   │   ├── Sun.jsx          # Custom bubbling plasma core shader & corona halo
│   │   ├── ProceduralPlanet.jsx # Dynamic rings, atmospheres, hotspots, and moons
│   │   └── AsteroidBelt.jsx # InstancedMesh rendering of 1500 organic irregular rocks
│   ├── scenes/
│   │   ├── SolarSystemScene.jsx # Scene setup, lighting, stars, and post-effects
│   │   ├── CameraController.jsx # GSAP orbit targets, takeoff shakes, and G-force FOVs
│   │   └── PostEffects.jsx  # Vignette, Bloom, and Chromatic Aberration warp controllers
│   ├── utils/
│   │   ├── textureGenerator.js # Procedural seamless planet/ring texture generator canvas
│   │   └── soundSynth.js    # Web Audio synthesizers (pad hums, warp sweeps, scanner pings)
│   └── store/
│       └── useStore.js      # Zustand global state database
```

---

## 🔧 Getting Started

To run the application locally on your machine:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/solaris.git
   cd solaris
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the local development server**:
   ```bash
   npm run dev
   ```
   Open the provided URL (e.g. `http://localhost:5173/` or `http://localhost:5174/`) in your browser to start your space mission!

4. **Build the production bundle**:
   ```bash
   npm run build
   ```
   Generates a highly optimized, minified production build in the `dist/` directory.

---

## 👨‍🚀 About the Creator

Solaris was designed and engineered by **Suveer Raj Sinha**, a Computer Science student and developer. 

*“Sometimes, the best way to understand the universe is to explore it yourself.”* 🚀🪐✨

- **GitHub**: [github.com/suveer-raj-sinha](https://github.com)
- **Portfolio**: [portfolio.com](https://portfolio.com)
