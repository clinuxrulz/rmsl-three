import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RMSLShaderMaterial } from "../../src/RMSLShaderMaterial";
import {
  float, vec3, uniform, varying, Fn,
  output, vec2,
  uniformRaw,
  vec4, attribute, builtinPosition
} from '@random-mesh/rmsl'

const uTime = uniformRaw("uTime", "float");
const uv = varying('vec2');
const position = attribute('vec3');
const vPosition = varying('vec3');
const uColor1 = uniformRaw("uColor1", 'vec3');
const uColor2 = uniformRaw("uColor2", 'vec3');
const uColor3 = uniformRaw("uColor3", 'vec3');

// three.js built-in matrices, declared as RMSL uniforms with the exact names
// three.js uses so the renderer populates them automatically each frame.
const projectionMatrix = uniformRaw("projectionMatrix", "mat4");
const modelViewMatrix = uniformRaw("modelViewMatrix", "mat4");

// Create RMSL shaders
const vertexMain = Fn(() => {
  // Get UV coordinates using explicit variables
  const uvX = position.x.mult(0.5).toVar();
  const uvY = position.y.mult(0.5).toVar();
  uv.assign(vec2(uvX, uvY).add(0.5));

  // Displace the vertex based on time and position
  const displacement = position.x.mult(10.0).add(uTime.mult(2.0)).sin().mult(0.1).toVar();
  const displacedY = position.y.add(displacement).toVar();

  // Pass the (displaced) local position to the fragment shader as a varying
  const displaced = vec3(position.x, displacedY, position.z).toVar();
  vPosition.assign(displaced);

  // Transform local position by the model-view and projection matrices so the
  // solid mesh aligns with the rest of the scene (e.g. the wireframe overlay).
  const clipPos = projectionMatrix.mult(modelViewMatrix).mult(vec4(displaced, 1.0)).toVar();

  builtinPosition().assign(clipPos);
})

const fragmentMain = Fn(() => {

  // Create output
  const outputColor = output("vec4");

  // Create moving gradient pattern
  const gradient1 = uColor1.mix(uColor2, uv.x.mult(10.0).add(uTime.mult(0.5)).sin().mult(0.5).add(0.5)).toVar();
  const gradient2 = uColor2.mix(uColor3, uv.y.mult(10.0).add(uTime.mult(0.7)).sin().mult(0.5).add(0.5)).toVar();

  // Combine gradients
  const wave1 = vPosition.x.mult(10.0).add(uTime.mult(2.0)).sin().toVar();
  const wave2 = vPosition.z.mult(10.0).add(uTime.mult(2.0)).sin().toVar();
  const wave = wave1.add(wave2).div(2.0).toVar();

  // Mix with base color
  const finalColor = gradient1.mult(0.7).add(vec3(wave.mult(0.3))).toVar();

  // Add a gentle distance-based vignette (kept above 0.25 so the mesh never
  // fades to fully black and becomes invisible against the dark background)
  const distance = uv.sub(vec2(0.5)).length().mult(2.0).sub(1.0).toVar();
  const vignette = distance.mult(-1.0).clamp(0.25, 1.0).toVar();

  // Assign to output
  outputColor.assign(vec4(finalColor.mult(vignette), 1.0));

  return outputColor;
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
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
container.appendChild(renderer.domElement)

// Create controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05

// Create geometry and material
const geometry = new THREE.SphereGeometry(1, 64, 64)

const material = new RMSLShaderMaterial({
  vertex: vertexMain,
  fragment: fragmentMain,
  transparent: false,
  side: THREE.DoubleSide,
})

// Create mesh
const mesh = new THREE.Mesh(geometry, material)
material.attachGeometry(geometry)
scene.add(mesh)

// Add a wireframe mesh for visual interest
const wireframeGeometry = new THREE.SphereGeometry(1.05, 32, 32)
const wireframeMaterial = new THREE.MeshBasicMaterial({
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

// Start animation
animate()
