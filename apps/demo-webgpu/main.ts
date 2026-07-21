import * as THREE from 'three'
import { WebGPURenderer, MeshBasicNodeMaterial, attribute, uniform, positionLocal } from 'three/webgpu'
import { RMSLNodeMaterial } from "../../src/RMSLNodeMaterial";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  Fn,
  Node,
  vec2,
  vec3,
  vec4,
} from '@random-mesh/rmsl'

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

// Create scene
const container = document.getElementById('container')!
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x111111)

// Add some lights
const ambientLight = new THREE.AmbientLight(0x404040, 2)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

const pointLight = new THREE.PointLight(0x00ffff, 1, 100)
pointLight.position.set(-5, -5, 5)
scene.add(pointLight)

// Create camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.z = 3

// Create renderer
const renderer = new WebGPURenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
container.appendChild(renderer.domElement)

// Create controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05

// Create geometry
const geometry = new THREE.SphereGeometry(1, 64, 64)

const uTime = uniform(0)
const uColor1 = uniform(new THREE.Color(0xff0000))
const uColor2 = uniform(new THREE.Color(0x00ff00))
const uColor3 = uniform(new THREE.Color(0x0000ff))
const position = attribute('position')
const uv = attribute('uv')

// Create RMSL material with proper RMSLStageDef objects
const material = new RMSLNodeMaterial({
  vertex: {
    fn: vertexMain,
    params: [
      { name: 'uTime', type: 'float' },
      { name: 'position', type: 'vec3' },
      { name: 'uv', type: 'vec2' },
    ],
    tsl: {
      position,
      uv,
      uTime,
    },
  },
  fragment: {
    fn: fragmentMain,
    params: [
      { name: 'uTime', type: 'float' },
      { name: 'uColor1', type: 'vec3' },
      { name: 'uColor2', type: 'vec3' },
      { name: 'uColor3', type: 'vec3' },
      { name: 'uv', type: 'vec2' },
      { name: 'posLocal', type: 'vec3' },
    ],
    tsl: {
      uTime,
      uColor1,
      uColor2,
      uColor3,
      uv,
      posLocal: positionLocal,
    },
  },
  transparent: false,
  side: THREE.DoubleSide,
})

// Create mesh
const mesh = new THREE.Mesh(geometry, material)
material.attachGeometry(geometry)
scene.add(mesh)

// Add a wireframe mesh for visual interest
const wireframeGeometry = new THREE.SphereGeometry(1.05, 32, 32)
const wireframeMaterial = new MeshBasicNodeMaterial({
  color: 0x00ffff,
  wireframe: true,
  transparent: true,
  opacity: 0.1,
})
const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial)
scene.add(wireframeMesh)

// Animation loop
const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  
  const time = clock.getElapsedTime()
  
  // Update uniforms
  material.setUniform('uTime', time)
  material.setUniform('uColor1', new THREE.Color("red"))
  material.setUniform('uColor2', new THREE.Color("green"))
  material.setUniform('uColor3', new THREE.Color("blue"))
  
  // Rotate the mesh
  mesh.rotation.y = time * 0.2
  mesh.rotation.x = Math.sin(0.3*time) * 0.1
  
  wireframeMesh.rotation.y = time * 0.2
  wireframeMesh.rotation.x = Math.sin(0.3*time) * 0.1
  
  controls.update()
  renderer.render(scene, camera)
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}
window.addEventListener('resize', onWindowResize)

// WebGPURenderer initialization is async
renderer.init().then(() => {
  animate()
}).catch((err) => {
  console.error(err)
  const el = document.getElementById('error')!
  el.style.display = 'block'
  el.textContent = 'WebGPU is not available in this browser: ' + err.message
})
