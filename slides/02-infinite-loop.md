## Infinite looping and colors!

---

To loop, we are going to use **mod(),** this function is the % operator in javascript.

Once it goes over the value, it loops.

```glsl
// glsl
float repeated = mod(seconds, 10.);
// Javascipt
let repeated = seconds % 10. 
```

---

A little re-write to begin.

Separate the z position into it’s own variable, **zPos**. And substract it from **transformed.y** so it goes in front of the camera

```glsl

float ringIndex = aInstance.y;
float loop = 80.;
float zPos = ringIndex * 2.;

float angle = aInstance.x;
float radius = 10.;

vec2 ringPos = vec2(cos(angle * PI * 2.), sin(angle * PI * 2.)) * radius;  

transformed = rotate(transformed,vec3(0., 0., 1.),  PI * 0.5);
transformed = rotate(transformed,vec3(0., 1., 0.),  angle * PI * 2.);

transformed.xz += ringPos;
transformed.y += -zPos;
```

---

Using **mod()** in negative is a bit confusing for me. So we keep the value positive and make it negative right before using it.

---

Define a loop point 80. After the instances move past z > 80. They will come back to 0.

It’s 80 because we have 40 instances, and we are multiplying that by two here **ringIndex * 2.** This will make the last item teleport to the first spot when it moves too far away.

```glsl
float loop = 80.;
float zPos = mod(ringIndex * 2. - uTime * 15.0 , loop);
```

---

From the outside it looks kinda ridiculous. But look at it from the inside by changing the camera position. And it becomes magic.

```glsl
rendering.camera.position.y = 0.1;
```

---

Fix the end of the tube by fading it out to the background color.

---

Add the uniforms for color work.

```glsl
let material = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  uniforms: {
    uTime: uTime,
    uBackground:    { value: palette.BG },
    uPalette0:      { value: sinPalette.c0},
    uPalette1:      { value: sinPalette.c1},
    uPalette2:      { value: sinPalette.c2},
    uPalette3:      { value: sinPalette.c3},
    uPaletteOffset: { value: sinPalette.offset},
  },
});

```

---

Delcare the uniforms in the shader and the palette function as well

```glsl
uniform vec3 uBackground;
uniform vec3 uPalette0;
uniform vec3 uPalette1;
uniform vec3 uPalette2;
uniform vec3 uPalette3;
uniform float uPaletteOffset;

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ){
  return a + b*cos( 6.28318*(c*t+d) );
}

void main() {
   vec3 color = vec3(0.);
    color = vec3(vUv.y);

gl_FragColor = vec4(color, 1.);
}
```

---

On the vertex shader, define the varying and send the normalized depth to the fragment shader.

The normalization makes it way easier to use.

```glsl
varying float vDepth;

void main() {
   // ... rest of the code
  vDepth = zPos / loop;
  vUv = uv;
  gl_Position =  projectionMatrix * modelViewMatrix * vec4(transformed, 1.);
}
```

---

On the fragment shader, declare the varying and fade the color into the background with vDepth as a mix value.

```glsl
varying float vDepth;
void main() {
    vec3 color = vec3(0.);
    color = vec3(vUv.y);
    
    color = mix(color, uBackground, vDepth );
    gl_FragColor = vec4(color, 1.);
  }
```

---

The color defined by the depth, so it’ll change color depending on how deep it is.

vUv.y makes the palette change slightly along the height of the tube. Little details that give depth.

```glsl
void main() {
    vec3 color = vec3(0.);
    vec3 colorPalette = palette(vUv.y  + vDepth * 4. + uPaletteOffset + uTime, 
        uPalette0 ,	uPalette1,	uPalette2,	uPalette3 );

    color = colorPalette;
    color = mix(color, uBackground, vDepth );
    gl_FragColor = vec4(color, 1.);
}
```

---

Same “ugly top faces” fix we used on previous project.

```glsl
varying float vDepth;

void main() {
   // ... rest of the code
  vDepth = zPos / loop;
  vUv = uv;
  if(position.y > 0.4999){
    vUv.y = 1.;
  }
  if(position.y < -0.4999){
    vUv.y = 0.;
  }
  gl_Position =  projectionMatrix * modelViewMatrix * vec4(transformed, 1.);
}
```

---

This is infinte looping not only works here but in any other context. At some point you move back to the start, and hide the looping point.

- [Everest Deconstruction](https://velasquezdaniel.com/blog/everest-agency-deconstruction/)

---

We are done for now. In the next lesson we are going to go hard on the transformations.

