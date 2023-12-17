import "./style.css"
import { gsap } from "gsap"

import { Rendering } from "./rendering"

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

import { palettes, sinPalettes } from "./palettes";

let paletteKey = "blue"
let palette = palettes[paletteKey]
let sinPalette = sinPalettes[paletteKey]

// setting up
let rendering = new Rendering(document.querySelector("#canvas"), palette)
rendering.camera.position.x = 80;

let controls = new OrbitControls(rendering.camera, rendering.canvas)

let uTime = { value: 0 };

// Init

let geometry = new THREE.BoxGeometry();
let material = new THREE.MeshNormalMaterial();
let mesh = new THREE.Mesh(geometry, material);
rendering.scene.add(mesh)

// Events

const tick = (t)=>{
  uTime.value = t 
  rendering.render()
}

gsap.ticker.add(tick)

