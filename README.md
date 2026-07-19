# RMSL Three.js

[![npm](https://img.shields.io/badge/npm-@random--mesh/rmsl--three-blue)](https://www.npmjs.com/package/@random-mesh/rmsl-three)
[![GitHub](https://img.shields.io/badge/github-clinuxrulz/rmsl--three-181717?logo=github)](https://github.com/clinuxrulz/rmsl-three)

Three.js adapter for [RMSL](https://github.com/clinuxrulz/rmsl) (Random Mesh Shading Language) — a TypeScript DSL that compiles to GLSL ES 3.0 or WGSL.

Provides two material classes that accept raw RMSL node graph definitions and produce the appropriate shader code for your chosen renderer.

## Materials

| Class | Renderer | Description |
|---|---|---|
| `RMSLShaderMaterial` | `WebGLRenderer` | Extends `RawShaderMaterial`. Compiles RMSL to GLSL ES 3.0. |
| `RMSLNodeMaterial` | `WebGPURenderer` | Extends `NodeMaterial` (TSL). Compiles RMSL to both GLSL and WGSL, selecting the correct variant at build time based on the backend. |

> `RMSLShaderMaterial` is designed for use with `WebGLRenderer` only.  
> `RMSLNodeMaterial` is designed for use with `WebGPURenderer` only.

## Project Structure

```
rmsl-three/
├── apps/
│   ├── demo/              # WebGL demo application
│   │   ├── index.html
│   │   ├── main.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   └── demo-webgpu/       # WebGPU demo application
│       ├── index.html
│       ├── main.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
├── src/
│   ├── RMSLNodeMaterial.ts
│   ├── RMSLShaderMaterial.ts
│   ├── index.ts
│   └── types.d.ts
├── dist/                  # Build output (generated)
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Build the Library

```bash
pnpm build
```

### 3. Run a Demo

**WebGL demo** (uses `RMSLShaderMaterial` with `WebGLRenderer`):

```bash
pnpm demo:start
```

**WebGPU demo** (uses `RMSLNodeMaterial` with `WebGPURenderer`):

```bash
pnpm demo:webgpu:start
```

Each command will:
1. Build the RMSL Three.js adapter
2. Build the demo application
3. Start a dev server at `http://localhost:5173`

## Usage

### WebGL — `RMSLShaderMaterial`

```typescript
import { WebGLRenderer, Scene, Mesh, SphereGeometry } from 'three';
import { RMSLShaderMaterial } from '@random-mesh/rmsl-three';
import { Fn, vec4, uniformRaw, output, builtinPosition } from '@random-mesh/rmsl';

const vertexMain = Fn(() => {
  // ... RMSL vertex shader graph
  builtinPosition().assign(vec4(/* ... */));
});

const fragmentMain = Fn(() => {
  const outputColor = output('vec4');
  // ... RMSL fragment shader graph
  outputColor.assign(vec4(1.0));
  return outputColor;
});

const material = new RMSLShaderMaterial({
  vertex: vertexMain,
  fragment: fragmentMain,
});
material.attachGeometry(geometry);
```

See the [WebGL demo source](https://github.com/clinuxrulz/rmsl-three/blob/main/apps/demo/main.ts) for a complete example.

### WebGPU — `RMSLNodeMaterial`

```typescript
import { WebGPURenderer, Scene, Mesh, SphereGeometry } from 'three/webgpu';
import { RMSLNodeMaterial } from '@random-mesh/rmsl-three';
import { Fn, vec4 } from '@random-mesh/rmsl';

const vertexMain = Fn((uTime, position, uv) => {
  // ... RMSL vertex shader graph
  return vec4(/* ... */);
});

const material = new RMSLNodeMaterial({
  vertex: {
    fn: vertexMain,
    params: [
      { name: 'uTime', type: 'float' },
      { name: 'position', type: 'vec3' },
      { name: 'uv', type: 'vec2' },
    ],
    tsl: {
      uTime: /* three.js uniform node */,
      position: /* three.js attribute node */,
      uv: /* three.js attribute node */,
    },
  },
  fragment: { /* ... */ },
});
```

See the [WebGPU demo source](https://github.com/clinuxrulz/rmsl-three/blob/main/apps/demo-webgpu/main.ts) for a complete example.

## Development Scripts

```bash
pnpm type-check          # TypeScript type checking
pnpm build               # Build the library
pnpm demo:dev            # WebGL demo dev mode (hot-reload)
pnpm demo:start          # Build + run WebGL demo
pnpm demo:webgpu:dev     # WebGPU demo dev mode (hot-reload)
pnpm demo:webgpu:start   # Build + run WebGPU demo
pnpm demo:setup          # Install demo dependencies
```

## Technical Details

- **RMSL Version**: ^1.0.6
- **Three.js Version**: ^0.170.0
- **Build Tool**: Vite
- **Monorepo**: pnpm workspaces
- **Language**: TypeScript

## License

MIT
