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

// change camrea to look at circle
//rendering.camera.position.x = 80
rendering.camera.position.y = 40
rendering.camera.position.z = 0

let controls = new OrbitControls(rendering.camera, rendering.canvas)

let uTime = { value: 0 }

// Init

let radius = 2 / 3
let rings = 40
let segments = 32
let totalInstances = rings * segments
let geometry = new THREE.CylinderGeometry(radius, radius, 1, 8, 2)
let instanceGeomtery = new THREE.InstancedBufferGeometry().copy(geometry)
instanceGeomtery.instanceCount = totalInstances

// loop through the rings and segments of each ring and store it in an attribute

// each instance needs an angle & a ring index position hence multiplying by 2
let aInstance = new Float32Array(totalInstances * 2)

let i = 0
for (let ringIndex = 0; ringIndex < rings; ringIndex++)
  for (let segmentIndex = 0; segmentIndex < segments; segmentIndex++) {
    // Inside the loop calculate the angle by dividing the segment index by the total number of segments.
    // The results is a range between 0 and 1 we will turn this into an angle later.
    let angle = segmentIndex / segments // range between 0 & 1
    // first position is the angle
    aInstance[i] = angle
    // second posittion is the ring index
    aInstance[i + 1] = ringIndex

    // moving up the array by 2 values
    i += 2
  }

// add to the instance geometry as an attribute
instanceGeomtery.setAttribute(
  "aInstance",
  new THREE.InstancedBufferAttribute(aInstance, 2, false)
)

let vertexShader = glsl`
  #define PI 3.14159265358979323846
  precision highp float;
  attribute vec2 aInstance;
  uniform float uTime;
  varying vec2 vUv;

  // functions to help rotate the instances
  mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
          oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
          oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
          0.0,                                0.0,                                0.0,                                1.0);
  }
  
  vec3 rotate(vec3 v, vec3 axis, float angle) {
    mat4 m = rotationMatrix(axis, angle);
    return (m * vec4(v, 1.0)).xyz;
  }

  void main() {
    vec3 transformed = position;

    // get the angle and ring index from the instance attribute
    float angle = aInstance.x;
    float ringIndex = aInstance.y;
    float radius = 10.;

    // calculate the distance around the angle
    vec2 ringPos = vec2(
      cos(angle * PI * 2.),
      sin(angle * PI * 2.)
    ) * radius;


    // now apply a rotation on the Z axis to place the tubes on their side
    transformed = rotate(transformed, vec3(0., 0., 1.), PI * 0.5);
    // rotaion for Y axis for tube to stare at center of the circle depending on instances angle
    transformed = rotate(transformed, vec3(0., 1., 0.), angle * PI * 2.);


    // add our ring position
    transformed.xz += ringPos;
    transformed.y += ringIndex * 2.;

    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`

let fragmentShader = glsl`
 #define PI 3.14159265358979323846
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

let mesh = new THREE.Mesh(instanceGeomtery, material)
// stop mesh being culled one first intanced mesh is out of view
mesh.frustumCulled = false

rendering.scene.add(mesh)

// Events

const tick = (t) => {
  uTime.value = t
  rendering.render()
}

gsap.ticker.add(tick)
