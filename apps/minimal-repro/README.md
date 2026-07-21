# Chrome Bug: WebGPURenderer WebGL fallback + TSL shaders

## The Bug

The demo at `apps/demo-webgpu/` uses `WebGPURenderer` with custom TSL shaders compiled from RMSL. When Chrome fails to initialize WebGPU (adapter null, device creation failure, or canvas context failure), three.js falls back to `WebGLBackend` on the **same** `<canvas>`. This crashes in Chrome but works in Firefox.

## How to reproduce

1. Open `index.html` in **Chrome** (open directly, no server needed)
2. Open `index.html` in **Firefox**
3. Compare: in Firefox the scene renders (either via WebGPU or WebGL fallback), in Chrome it may crash or show errors

## What makes this minimal

- **No build step** — single HTML file, open directly in browser
- **No RMSL compiler** — pre-compiled GLSL/WGSL shader strings embedded as constants
- **No bundler** — uses importmap + CDN for three.js only
- **Same code path** as the original demo: `WebGPURenderer` → `NodeMaterial.build()` → backend-detect → `glslFn`/`wgslFn`

## Files

| File | Purpose |
|------|---------|
| `index.html` | Self-contained reproduction |
| `extract-shaders.ts` | Script used to extract shader strings from RMSL compiler (not needed to run the repro) |
