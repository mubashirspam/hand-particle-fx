# ✦ Particle FX — Hand Gesture Particle Engine

> Real-time 3D particle system controlled by hand gestures using Three.js + MediaPipe.  
> 30,000 particles morphing between 12 shapes with 11 color palettes — all driven by your webcam.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)
![Three.js](https://img.shields.io/badge/Three.js-r162-black?style=flat-square&logo=three.js)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)

---

## 🎬 What Is This?

This is the tech behind viral Instagram hand gesture animations — where hand movements trigger AI-like visual particle effects in real-time. Built as a professional-grade web app, deployable to Vercel in one click.

## ✋ Gesture Controls

| Gesture | Effect | Shape | Colors |
|---------|--------|-------|--------|
| 🖐️ Open Palm | Energy Sphere | Sphere | Aurora (cyan/purple/green) |
| ✊ Fist | Power Charge | Firework | Fire Storm (red/orange/gold) |
| 🤏 Pinch | Micro Galaxy | Galaxy | Cosmic Purple |
| 👆 Point | Energy Beam | Spiral | Neon City (magenta/cyan) |
| ✌️ Peace | Butterfly Effect | Butterfly | Rose Gold |
| 👍 Thumbs Up | Phoenix Rise | Phoenix | Sunset Blaze |
| 🤙 Iron Man | Repulsor Blast | Heart | Iron Man (red/gold/white) |
| 🤘 Rock | Rock & Code | DNA Helix | Emerald |
| 👌 OK Sign | Perfect Loop | Infinity | Ocean Deep |
| 🖐️✨ Spread | Cosmic Bloom | Lotus | Ice Storm |

## 🏗 Tech Stack

- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript (strict mode)
- **3D Engine**: Three.js with custom GLSL shaders
- **Hand Tracking**: Google MediaPipe Hands
- **Styling**: Tailwind CSS
- **Deployment**: Vercel-ready

## 📁 Project Structure

```
hand-particle-fx/
├── src/
│   ├── components/
│   │   ├── ParticleScene.tsx    # Main scene orchestrator
│   │   ├── HUD.tsx              # Heads-up display overlay + brand watermark
│   │   ├── CameraFeed.tsx       # Webcam preview with hand skeleton overlay
│   │   └── StartScreen.tsx      # (unused — app auto-starts on load)
│   ├── hooks/
│   │   └── useHandTracking.ts   # MediaPipe hand tracking hook
│   ├── lib/
│   │   ├── particleEngine.ts    # Three.js particle system core
│   │   ├── shapeGenerator.ts    # 12 parametric shape generators
│   │   ├── gestureDetector.ts   # Gesture recognition from landmarks
│   │   └── palettes.ts          # Color palettes & gesture mapping
│   ├── shaders/
│   │   └── particle.ts          # Custom GLSL vertex/fragment shaders
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── styles/
│   │   └── globals.css          # Tailwind + custom styles
│   └── pages/
│       ├── _app.tsx
│       ├── _document.tsx
│       └── index.tsx
├── public/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── vercel.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Webcam

### Install & Run

```bash
# Clone the repo
git clone https://github.com/mubashirspam/hand-particle-fx.git
cd hand-particle-fx

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the camera starts automatically. Allow webcam access when prompted, then make gestures!

### Deploy to Vercel

```bash
# Option 1: Vercel CLI
npm i -g vercel
vercel

# Option 2: Connect GitHub repo to Vercel dashboard
# → Import Project → Select repo → Deploy
```

## ⚡ Performance

- **30,000 particles** rendered with custom GLSL shaders
- **Additive blending** for glow effects
- **GPU-accelerated** — runs at 60fps on modern hardware
- **Gesture smoothing** buffer prevents jitter
- **Lerped transitions** between shapes and positions
- **Fully responsive** — works on mobile and tablet browsers

## 🔧 Customization

### Add a New Shape
1. Add shape name to `ParticleShape` enum in `src/types/index.ts`
2. Create generator function in `src/lib/shapeGenerator.ts`
3. Map it to a gesture in `src/lib/palettes.ts`

### Add a New Color Palette
1. Add palette to `PALETTES` in `src/lib/palettes.ts`
2. Assign it to a gesture action in `GESTURE_ACTIONS`

### Adjust Particle Count
Change `PARTICLE_COUNT` in `src/lib/particleEngine.ts` (default: 30,000)

## 📄 License

MIT — use it, remix it, make it go viral.
