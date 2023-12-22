import "./style.css"
import { gsap } from "gsap"

import { Rendering } from "./rendering"

import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

import { palettes, sinPalettes } from "./palettes"

let paletteKey = "blue"
let palette = palettes[paletteKey]
let sinPalette = sinPalettes[paletteKey]

// setting up
let rendering = new Rendering(document.querySelector("#canvas"), palette)
rendering.camera.position.x = 80

let controls = new OrbitControls(rendering.camera, rendering.canvas)

let uTime = { value: 0 }

// Init

let radius = 2 / 3
let rings = 1
let segments = 32
let totalInstances = rings * segments
let geometry = new THREE.CylinderGeometry(radius, radius, 1, 8, 2)
let instanceGeomtery = new THREE.InstancedBufferGeometry().copy(geometry)
instanceGeomtery.instancedCount = totalInstances

let vertexShader = glsl`
  precision highp float;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec3 transformed = position;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`

let fragmentShader = glsl`
  varying vec2 vUv;
  uniform float uTime;

  void main() {
    vec3 color = vec3(0.);
    color = vec3(vUv.y);
    gl_FragColor = vec4(color, 1.0);
  }
`

let material = new THREE.ShaderMaterial({
  fragmentShader,
  vertexShader,
  uniforms: {
    uTime,
  },
})

let mesh = new THREE.Mesh(geometry, material)

rendering.scene.add(mesh)

// Events

const tick = (t) => {
  uTime.value = t
  rendering.render()
}

gsap.ticker.add(tick)
