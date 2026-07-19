# RMSL Three.js Demo

A vanilla TypeScript demo application to showcase the RMSL Three.js adapter.

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm

### Installation

```bash
# Install dependencies for the main package
pnpm install

# Install dependencies for the demo app
cd apps/demo
pnpm install
```

### Running the Demo

```bash
# Build the main library first
cd ../..
pnpm build

# Then build and run the demo
cd apps/demo
pnpm build
pnpm start
```

The demo will open at `http://localhost:5173`

## What the Demo Shows

- A 3D sphere with a procedurally generated shader using RMSL
- Interactive controls (orbit controls) for rotating and zooming
- A complex shader effect with:
  - Animated gradient colors
  - Time-based patterns
  - Vignette effect
- Visual layering with wireframe overlay

## Features

- **RMSL Integration**: Uses RMSL to compile GLSL shaders dynamically
- **WebGL Renderer**: Full 3D rendering with Three.js
- **Interactive Controls**: OrbitControls for user interaction
- **Responsive Design**: Adapts to window size changes
- **Type Safety**: Full TypeScript support throughout
