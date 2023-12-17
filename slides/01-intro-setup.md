# Infinite tunel instancing setup

---

Initial setup

```jsx
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
rendering.camera.position.x = 80;

let controls = new OrbitControls(rendering.camera, rendering.canvas)

let uTime = { value: 0 };

// Init

// Events

const tick = (t)=>{
  uTime.value = t
  rendering.render()
}

gsap.ticker.add(tick)
```

---

Add the basic geometry like in last lesson.

Don’t scale the mesh in either the geometry or the mesh. We’ll take care of that in the shader

```jsx
let radius = 2 / 3;
let geometry = new THREE.CylinderGeometry(radius, radius, 1,  8,2);

let vertexShader = glsl`
precision highp float;
uniform float uTime;
varying vec2 vUv;

  void main() {
    vec3 transformed = position;
        vUv = uv;
    gl_Position =  projectionMatrix * modelViewMatrix * vec4(transformed, 1.);
  }

`
let fragmentShader = glsl`
varying vec2 vUv;
uniform float uTime;
  void main() {
       vec3 color = vec3(0.);
        color = vec3(vUv.y);
    gl_FragColor = vec4(color, 1.);
  }
`

let material = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  uniforms: {
    uTime: uTime,
  },
});

let mesh = new THREE.Mesh(geometry, material);
```

---

## Instancing in circles

For our purposes, we can think of a tube like a series of circles. Circles are way easier to code and modify. We are going to line of circles

---

Create instanced attribute “aInstance”

Instead of directly calculating the position in javascript, we’ll send the angle to the shaders and calculate it there as well as the Ring Index.

- The angle in the ring/circle → to position correctly
- The ring Index → To displace the ring’s depth

---

## Starting with ONE ring.

Start with single ring for easier debugging, and 32 segments. Each segment is going to be an instance along the circle.

The total number of instances is the ammount of rings, by how many instances per circles.

```jsx
let rings = 1;
let segments = 32;
let totalInstances = rings * segments

let geometry = new THREE.CylinderGeometry(radius, radius, 1,  8,2);
let instancedGeometry = (new THREE.InstancedBufferGeometry()).copy(geometry)
instancedGeometry.instanceCount =  totalInstances
```

---

Short trigonometry → Circles

With an angle in radians we can use the angle to get X and Y with cosine, and sine.

![Untitled](../assets/Notion.png)


---

So:

1. Store normalized angle in the attribute
2. Multiply by PI * 2. in the shader to get the actual angle
3. Use cosine, and sine to get X,Y.

---

Loop through the rings and the segments of each ring and store it in the attribute.

Same as before, each instance has two values. Our total Instance count is instanceCount * 2.

```jsx

let aInstance = new Float32Array(totalInstances * 2);

let i.= 0;
for (let ringI = 0; ringI< rings; ringI++)
for (let segmentI = 0; segmentI < segments; segmentI++) {
  
}
```

---

Inside the loop, calculate the angle by dividing the segment Index by the total segments. The result is a range of 0 to 1, we’ll turn this into an angle later.

Normalized values, between 0 and 1, are extremely useful because you can transform them in the range you want.

```jsx

let aInstance = new Float32Array(totalInstances * 2);

let i.= 0;
for (let ringI = 0; ringI< rings; ringI++)
for (let segmentI = 0; segmentI < segments; segmentI++) {
  let angle = segmentI / segments
  aInstance[i  ] = angle;
  aInstance[i + 1] = ringI ;
  i+= 2
}

```

---

Add the instanced attribute to the geometry and the geometry to the mesh

```jsx
geometry.setAttribute('aInstance', new THREE.InstancedBufferAttribute(aInstance, 2, false))
```

```jsx
let mesh = new THREE.Mesh(geometry, material);
```

---

On the vertex shader, declare the attribute **aInstance** at the top. And add the aInstance.x to the Z coordinate, to test that our instances are working.

```glsl
precision highp float;
attribute vec2 aInstance;
uniform float uTime;
varying vec2 vUv;

  void main() {
    vec3 transformed = position;
    transformed.z += aInstance.x * 50.;
        vUv = uv;
    gl_Position =  projectionMatrix * modelViewMatrix * vec4(transformed, 1.);
  }
```

---

## frustrum culled  = false

Frustrum culling makes meshes dissapear when they are offscreen. However, this doesn’t take into account instances. It only checks for the orignal object bounding box.

A common thing with isntancing is to disable the frustrum culling.

If your instance doesn’t show, try:

```glsl
mesh.frustrumCulled = false
```

---

## Instancing working

First step is to just check the instancing is working.

---

## Calculating the circles

Before making tubes, we need to make circles. Tubes are a line of circles.

---

Define Pi at the top. When working with circles you always need **PI**

 

```glsl
#define PI 3.141592653589793
```

---

Insite the vertex shader’s main function. Define the variables from the instanced attribute.

```glsl

void main() {
  vec3 transformed = position;

  float ringIndex = aInstance.y;
  float angle = aInstance.x;
  float radius = 10.;

    transformed.z += aInstance.x * 50.;

  vUv = uv;
  gl_Position =  projectionMatrix * modelViewMatrix * vec4(transformed, 1.);
}
```

---

Use cosine to calculate the X position.

And use sine to calculate the Y position.

Both of these functions expect the angle to start at 0, and end at 6.28 ( Two PI )

```glsl

void main() {
  vec3 transformed = position;

  float ringIndex = aInstance.y;
  float angle = aInstance.x;
  float radius = 10.;

  vec2 ringPos = vec2(
            cos(angle * PI * 2.), 
            sin(angle * PI * 2.)
    ) * radius;

  transformed.z += aInstance.x * 50.;

  vUv = uv;
  gl_Position =  projectionMatrix * modelViewMatrix * vec4(transformed, 1.);
}
```

---

Then, let’s change our debug transformation and add our actual ring position.

```glsl
void main() {
  vec3 transformed = position;

  float ringIndex = aInstance.y;
  float angle = aInstance.x;
  float radius = 10.;

  vec2 ringPos = vec2(cos(angle * PI * 2.), sin(angle * PI * 2.)) * radius;  

  transformed.xz += ringPos;

  vUv = uv;
  gl_Position =  projectionMatrix * modelViewMatrix * vec4(transformed, 1.);
}
```

---

## First ring done!

---

Change our camera to look into the tube instead from the outside

```glsl
// rendering.camera.position.x = 80;
rendering.camera.position.y = 40.;
rendering.camera.position.z = 0;
```

---

Now, we need to make the tubes look towards the center.

---

Add the **rotationMatrix** and **rotate** functions to the top of your fragment shaders

```glsl
#define PI 3.141592653589793
attribute vec2 aInstance;
uniform float uTime;
varying vec2 vUv;

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
```

---

Now apply a rotation on the Z axis to place the tubes on their side.

The order of operations is key. This needs to happen before translation of the rings.

```glsl
transformed = rotate(transformed,vec3(0., 0., 1.),  PI * 0.5);

transformed.xz += ringPos; // translation
```

---

Then, apply another rotation on the Y axis to look at the center.

Because we already have the angle, we use that as the rotation vector.

```glsl
transformed = rotate(transformed,vec3(0., 0., 1.),  PI * 0.5);
transformed = rotate(transformed,vec3(0., 1., 0.),  angle * PI * 2.);

transformed.xz += ringPos;
```

---

These rotations needed to happen in this specific order. They build on each other.

This is also we you can’t scale the geometry using **mesh.scale.y.** The scaling would build on top of every other rotation and the result wouldn’t be what we want.

---

With the circles done,  add the ring Index to the y position.

```glsl
transformed = rotate(transformed,vec3(0., 0., 1.),  PI * 0.5);
transformed = rotate(transformed,vec3(0., 1., 0.),  angle * PI * 2.);

transformed.xz += ringPos;
transformed.y += ringIndex * 2.; 
```

---

Then, in our javascript variables, increase the number of rings!

```jsx
let rings = 40;
```

![Screenshot 2023-11-15 at 11.17.21 PM.png](../assets/tube-small.png)

---

## Instance attributes done!

In the next lesson, we’ll learn how to make this loop infinite and start adding some color.

