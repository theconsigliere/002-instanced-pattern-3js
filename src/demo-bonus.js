import "./style.css"
import { Rendering } from "./rendering"
import { gsap } from "gsap"
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { palettes, sinPalettes } from "./palettes";

let paletteKey = "blue"
let palette = palettes[paletteKey]
let sinPalette = sinPalettes[paletteKey]

// setting up
let rendering = new Rendering(document.querySelector("#canvas"), palette)
// rendering.camera.position.x = 80;
rendering.camera.position.y = 0.1;
rendering.camera.position.z = 0;

let controls = new OrbitControls(rendering.camera, rendering.canvas)

let uTime = { value: 0 };

// Init
//
let radius = 2 / 3;
let rings = 40;
let segments = 32;
let totalInstances = rings * segments

let geometry = new THREE.CylinderGeometry(radius, radius, 1,  8,2);
let instancedGeometry = (new THREE.InstancedBufferGeometry()).copy(geometry)
instancedGeometry.instanceCount =  totalInstances

let aInstance = new Float32Array(totalInstances * 2);

let i = 0;
for (let ringI = 0; ringI< rings; ringI++)
for (let segmentI = 0; segmentI < segments; segmentI++) {
  let angle = segmentI / segments
  aInstance[i] = angle;
  aInstance[i + 1] = ringI ;
  i+=2
}

instancedGeometry.setAttribute('aInstance', new THREE.InstancedBufferAttribute(aInstance, 2, false))

let vertexShader = glsl`
#define PI 3.141592653589793
attribute vec2 aInstance;
uniform float uTime;
uniform float uOutro;
varying vec2 vUv;
varying float vDepth;
varying float vAngle;

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

  float ringIndex = aInstance.y;
  float loop = 80.;
  float zPos = mod(ringIndex * 2. - uTime * 15.0 , loop);

  // float angle = aInstance.x;
  float angle = mod(aInstance.x + uTime * 0.1 + zPos * 0.01, 1.);

  float radius = 10. + 8. * (uOutro) + sin(zPos* 0.1 + angle * PI * 2. + uTime * 1.  ) * 2.;
  vec2 ringPos = vec2(cos(angle * PI * 2.), sin(angle * PI * 2.)) * radius;  

  transformed.y += -0.5;
  transformed.y *= 1.2 + sin( angle * PI * 12. + zPos * 0.08) * 0.4;
  transformed.y += 0.5;

  transformed.y += 0.5;
  transformed.y *= 2.;
  transformed *= 1.0 + 3.0 * uOutro;
  transformed.y += -0.5;



  transformed = rotate(transformed,vec3(0., 0., 1.),  PI * 0.5);
  transformed = rotate(transformed,vec3(0., 1., 0.),  angle * PI * 2.);

  transformed.xz += ringPos;
  transformed.y += -zPos;

  vDepth = zPos / loop;
  vAngle = angle;
  vUv = uv;
  if(position.y > 0.4999){
    vUv.y = 1.;
  }
  if(position.y < -0.4999){
    vUv.y = 0.;
  }
  gl_Position =  projectionMatrix * modelViewMatrix * vec4(transformed, 1.);
}

`
let fragmentShader = glsl`
#define PI 3.141592653589793
varying vec2 vUv;
varying float vDepth;
varying float vAngle;

uniform vec3 uBackground;
uniform vec3 uPalette0;
uniform vec3 uPalette1;
uniform vec3 uPalette2;
uniform vec3 uPalette3;
uniform float uPaletteOffset;

uniform float uTime;

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ){
  return a + b*cos( 6.28318*(c*t+d) );
}

float nsin(float val){
  return sin(val) * 0.5 + 0.5;
} 
void main() {
 vec3 color = vec3(0.);
  float time = uTime ;

  vec3 offsets = vec3( nsin(time), nsin(time + 0.3), nsin(time + 0.6));
 vec3 colorPalette = palette(vUv.y * 1. + vDepth * 4. + uPaletteOffset + uTime , 
    uPalette0 ,	uPalette1,	uPalette2,	uPalette3 + offsets);
  
  float mixVal =  (vDepth + vAngle);
  color = mix( colorPalette,uBackground, cos( mixVal * PI * (4. ) + uTime * 2.)   );
 color = mix(color, uBackground, vDepth );
 gl_FragColor = vec4(color, 1.);
}
`

let material = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  uniforms: {
    uTime: uTime,
    uOutro: {value: 0},
    uBackground:    { value: palette.BG },
    uPalette0:      { value: sinPalette.c0},
    uPalette1:      { value: sinPalette.c1},
    uPalette2:      { value: sinPalette.c2},
    uPalette3:      { value: sinPalette.c3},
    uPaletteOffset: { value: sinPalette.offset},
  },
});


let mesh = new THREE.Mesh(instancedGeometry, material);

mesh.frustumCulled = false;

let config = {
  speed: -1
}
let t1 = gsap.timeline({delay: 1})

t1.to(config, {
  speed: 4,
  duration: 2,
  ease: "power2.inOut"
})

t1.to(mesh.position, {
  y: 80,
  duration: 2,
  ease: "power2.in"
}, 1.8)


t1.fromTo(mesh.material.uniforms.uOutro, {value: 0.}, {
  value: 1,
  duration: 2,
  ease: "power4.in"
}, 0.2)

rendering.scene.add(mesh)


// Events

const tick = (t, delta)=>{
  uTime.value += delta * 0.001 * config.speed
  rendering.render()
}

gsap.ticker.add(tick)

