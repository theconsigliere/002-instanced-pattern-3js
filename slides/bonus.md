# Time and Space outro animation

Would be really cole to have this transition into a different page or a different effect. A tunnel to another dimension

---

To begin let’s just move through the tunnel

```javascript
let t1 = gsap.timeline({delay: 1})

t1.to(mesh.position, {
  y: 80,
  duration: 2,
  ease: "power2.in"
})
```

---

Without frustumCulled=false, the mesh will dissapear 

---

The tunnel dissapears because we already made the tunnel fade into the background when it’s at Z 80.

This calculation doesn’t take into account the model position becasue the modelMatrix is still not applied. So, it still works.

---

Because we are moving away from the original position, the camera might think our objects is out of view and frustrum cull it.

```javascript
mesh.frustumCulled = false;
```

---

## Pause the time

To pause the time we need to modify the template itself. Add a config object and change the uTime to use delta instead.

```javascript
let config = {
  speed: -1
}

const tick = (t, delta)=>{
  uTime.value += delta * 0.001 * config.speed
  rendering.render()
}
```

---

Adding delta instead of setting the time directly allows us to change this addition frame by frame without crazy time changes.

---

## Animating time and space

Update out animation. Add a time speed up, and offset the start time of the position by 1.8.

```javascript
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
```

---

## Shader animation

Let’s also animate values inside the shader.

---

Create **uOutro** uniform in the material, and declare it in the vertex shader

```javascript
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
```

---

Now, make the tunnel radius bigger when the animation is going towards 1.

When the uOutro is 0, nothing will be added.

But when uOutro is 1, the tunnel will grow

```glsl
float radius = 10. + 8. * uOutro + sin(zPos* 0.1 + angle * PI * 2. + uTime * 1.  ) * 2.;
```

---

Animate the outtro
```
t1.fromTo(mesh.material.uniforms.uOutro, {value: 0.}, {
  value: 1,
  duration: 2,
  ease: "power4.in"
}, 0.2)

```
---

Looks nice, but not interdimensional enough

---

Scale the cylinders themselves by a factor of 3 when the animation is playing.

```glsl
transformed.y += 0.5;
transformed.y *= 2.;
transformed *= 1.0 + 3.0 * uOutro;
transformed.y += -0.5;
```

---

## Tips for finding new ideas effects

---

## Build on terminology

Numbers are abstract and hard, concepts are easier.

- Increase the **radius** of the tunnel → cosine/sine amplitude
- Increate the **frequency** of the rotation → inside cosine/sine multiplication
- **Scale** the instance → Multiplication
- **Translate** the tube → Adittion/substraction

---

## Plug values everywhere.

See what happens. Every single effect I made was from trial and error.

---

With this we are done for this demo. However, there’s one last video on the course that will teach you the other ways of doing instancing in threeJS, more caveats, and how to work with threeJS materials for your instancing.
