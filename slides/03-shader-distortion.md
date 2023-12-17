# Distortion and offseting

---

Before adding any distortions, lets also use the angle to blend into the background.

Send the angle to the fragment shader as a varying **vAngle**

```jsx
varying float vDepth;

void main() {
   // ... rest of the code
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
```

---

Then blend into the background using our angle and depth. 

```jsx
varying float vAngle;
varying float vDepth;
void main(){
  float mixVal =  (vDepth + vAngle);
  color = mix( colorPalette,uBackground, cos( mixVal * PI * 4. + uTime * 2.)   );
}
```

---

## Glow up

We’re almost there. All the pieces are in place, we only need to mofiy what we already made.

<div style="display: flex; justify-content: center; height: 400px;">
<img style="height: 100%;" src="../assets/start.png" />
<img style="height: 100%;" src="../assets/end.png" />
</div>

---

## Sun flower style

With another mod function, we can create interlacing effect by slightly offsetting the angle with the zPos.

---

Add the angle inside a mod function and add time and zPosition.

```glsl
float angle = mod(aInstance.x + uTime * 0.1 + zPos * 0.01, 1.);
```

---

This is why we generate the position in the shader instead on javascript. It allows us to modify the angle, and thus the circles, real time.

The **zPos** addition to the angle makes it rotate slightly as it moves away instead of all circles (and tubes) being aligned.

---

We have some holes in the bottom. Let’s scale the tubes FROM THE TOP.

```glsl
transformed.y += 0.5;
  transformed.y *= 2.;
  transformed.y += -0.5;

  transformed = rotate(transformed,vec3(0., 0., 1.),  PI * 0.5);
  transformed = rotate(transformed,vec3(0., 1., 0.),  angle * PI * 2.);

  transformed.xz += ringPos;
  transformed.y += -zPos;
```

---

This makes places the origin of the geometry in the bottom. Making the scaling grow from the top.

```glsl
transformed.y += 0.5;
// Oriign on the bottom
transformed.y += -0.5;
```

---

## Blend into the background

Using our previous variables to create cohesiveness. 

---

On the fragment shader and create a bit of a more interesting color. 

```glsl
float mixVal =  (vDepth + vAngle);
  color = mix( colorPalette,uBackground, cos( mixVal * PI * (4. ) + uTime * 2.)   );
```

---

The depth makes a linear gradient change as it moves in the z direction.

The addition of the angle is sort a rotation on that previous gradient, creating a more interesting effect.

Our angle is already modified extensively, so the result is even more interesting.

---

Every change we do has compounding effects. The depth modifies the angle, then the angles rotates the depths for the color.

Every value we build, affects the rest of them with it.

---

## Creating chaos

Our sketch is a bit too orderly at the moment, a bit boring. Let’s introduce some strong variation.

---

## Tube Scale

Scaling the each Tube instance up and down.

---

Add a sin function that takes in the angle and the Z position to create interesting scaling over time.

```glsl
transformed.y += -0.5;
  transformed.y *= 1.2 + sin( angle * PI * 12. + zPos * 0.08) * 0.4;
  transformed.y += 0.5;

transformed.y += 0.5;
  transformed.y *= 2.;
  transformed.y += -0.5;

  transformed = rotate(transformed,vec3(0., 0., 1.),  PI * 0.5);
  transformed = rotate(transformed,vec3(0., 1., 0.),  angle * PI * 2.);

```

---

While I’m not explicetly adding time here, it changes over time because the angle and the depth already change over time in sync with the other two.

---

## Whole Tunnel radius change

---

The previous scaling was on a instance to instance basis, on every cylinder. Notice that the tube is still the same radius by zooming out.

This scaling happens on top the tunnel of everything.

---

Change the radius by adding a sin wave that changes with the depth and the angle.

Now, to create more dramatic changes, we are going to change the radious of the tube completely

```glsl
float radius = 10. + sin(zPos* 0.1 + angle * PI * 2. + uTime * 1.  ) * 2.;
```

---

Adding time here makes it out of sync with the depths and angle, which creates an interesting effect.

---

Zoom out and notice that now the tunnel itsel is deformed.

 

---

We are done with the final project of the course! But you've got two more bonus lessons left.

Form here you can do a lot of things. Keep modifying the shader, adding more attribtes to group them together, or give a set color or even color palette to each one of them. The sky is the limit!

---

On the bonus lesson of this project we'll this effect further with a insane intro animation. 

And on the final lesson we'll explore other ways of using instancing in ThreeJS, as well as how to use regular materials with instancing through the use of “onBeforeCompile”. See you there!
