import { Fn, compileGLSLFn, compileWGSLFn, compileGLSL, compileWGSL, vec2, vec3, vec4, type Node } from '@random-mesh/rmsl'

// Replicate the exact same shader functions from apps/demo-webgpu/main.ts
const vertexMain = Fn((
  uTime: Node<"float">,
  position: Node<"vec3">,
  uv: Node<"vec2">,
) => {
  const displacement = position.x.mult(10.0).add(uTime.mult(2.0)).sin().mult(0.1)
  const displacedY = position.y.add(displacement)
  const displaced = vec3(position.x, displacedY, position.z)
  return vec4(displaced, 1.0)
})

const fragmentMain = Fn((
  uTime: Node<"float">,
  uColor1: Node<"vec3">,
  uColor2: Node<"vec3">,
  uColor3: Node<"vec3">,
  uv: Node<"vec2">,
  posLocal: Node<"vec3">
) => {
  const gradient1 = uColor1.mix(uColor2, uv.x.mult(10.0).add(uTime.mult(0.5)).sin().mult(0.5).add(0.5)).toVar();
  const gradient2 = uColor2.mix(uColor3, uv.y.mult(10.0).add(uTime.mult(0.7)).sin().mult(0.5).add(0.5)).toVar();
  const wave1 = posLocal.x.mult(10.0).add(uTime.mult(2.0)).sin().toVar();
  const wave2 = posLocal.z.mult(10.0).add(uTime.mult(2.0)).sin().toVar();
  const wave = wave1.add(wave2).div(2.0).toVar();
  const finalColor = gradient1.mult(0.7).add(vec3(wave.mult(0.3))).toVar();
  const distance = uv.sub(vec2(0.5)).length().mult(2.0).sub(1.0).toVar();
  const vignette = distance.mult(-1.0).clamp(0.25, 1.0).toVar();
  return vec4(finalColor.mult(vignette), 1.0);
})

const vertexParams = [
  { name: 'uTime', type: 'float' },
  { name: 'position', type: 'vec3' },
  { name: 'uv', type: 'vec2' },
]

const fragmentParams = [
  { name: 'uTime', type: 'float' },
  { name: 'uColor1', type: 'vec3' },
  { name: 'uColor2', type: 'vec3' },
  { name: 'uColor3', type: 'vec3' },
  { name: 'uv', type: 'vec2' },
  { name: 'posLocal', type: 'vec3' },
]

const vertexGLSL = compileGLSLFn(vertexMain, {
  name: 'vertexMain',
  params: vertexParams,
})

const vertexWGSL = compileWGSLFn(vertexMain, {
  name: 'vertexMain',
  params: vertexParams,
})

const fragmentGLSL = compileGLSLFn(fragmentMain, {
  name: 'fragmentMain',
  params: fragmentParams,
})

const fragmentWGSL = compileWGSLFn(fragmentMain, {
  name: 'fragmentMain',
  params: fragmentParams,
})

console.log('// === VERTEX GLSL ===')
console.log(JSON.stringify(vertexGLSL))
console.log()
console.log('// === VERTEX WGSL ===')
console.log(JSON.stringify(vertexWGSL))
console.log()
console.log('// === FRAGMENT GLSL ===')
console.log(JSON.stringify(fragmentGLSL))
console.log()
console.log('// === FRAGMENT WGSL ===')
console.log(JSON.stringify(fragmentWGSL))
