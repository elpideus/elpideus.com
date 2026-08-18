"use client";

/**
 * Gargantua, rendered inside the 404's scene.
 *
 * The hole is a full screen quad that raymarches null geodesics per pixel, but
 * it is driven by the scene camera rather than by a camera of its own: the
 * quad reads position, orientation and field of view from whatever camera is
 * rendering it. That is what lets real geometry share the shot. Move the
 * camera and the lensing answers, so the debris drifting in front and the sky
 * bending behind belong to the same space.
 *
 * The quad writes no depth and ignores it, so it is the background everything
 * else is drawn over.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const VERTEX = /* glsl */ `
  void main() {
    // The geometry is a unit quad used only to cover the frame.
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;

  uniform vec2 uRes;
  uniform float uTime;
  uniform vec3 uCamPos;
  uniform mat3 uCamBasis;
  uniform float uTanHalfFov;
  uniform float uAspect;
  /* 1 on capable hardware, lower where the tier says to spend less. */
  uniform float uQuality;

  out vec4 fragColor;

  /* Horizon radius. Every other length in the scene is a multiple of it. */
  const float RS = 1.0;
  const float DISC_IN = 2.6;
  const float DISC_OUT = 9.0;
  /* Scale height of the gas at the inner edge; it tapers outward from here. */
  const float DISC_H = 0.26;
  const int STEPS = 300;

  /* Sky palette, taken from the nebula on the map so the two rhyme. */
  const vec3 SKY_DEEP = vec3(0.012, 0.016, 0.047);
  const vec3 SKY_MID = vec3(0.106, 0.169, 0.42);
  const vec3 SKY_HOT = vec3(0.478, 0.184, 0.42);

  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);

    float n000 = hash13(i);
    float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash13(i + vec3(1.0, 1.0, 1.0));

    return mix(
      mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
      mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
      u.z
    );
  }

  float fbm3(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
      if (i >= octaves) break;
      value += amplitude * noise3(p);
      p *= 2.02;
      amplitude *= 0.5;
    }
    return value;
  }

  /* Colour of the disc across its width: white hot inside, ember at the rim. */
  vec3 discColour(float t) {
    vec3 hot = vec3(1.0, 0.96, 0.86);
    vec3 warm = vec3(1.0, 0.72, 0.36);
    vec3 deep = vec3(0.86, 0.36, 0.12);
    return mix(mix(hot, warm, smoothstep(0.0, 0.55, t)), deep, smoothstep(0.55, 1.0, t));
  }

  /*
   * Density of the gas at a point, and the radial coordinate that colours it.
   *
   * The disc is a slab rather than a surface: banked up where the gas piles
   * against the inner edge, and drawn down to a wisp by the rim, so it reads
   * as one body thinning out instead of a slab of even width. Vertically it
   * falls off with a soft shouldered exponential, so it has no edge to catch
   * the eye, and across the plane it is carved by warped noise into filaments
   * and holes. Sheared sampling does the rotation: the point is turned about
   * the axis by an angle that depends on radius before the noise is read,
   * which winds one field into trailing arms and leaves no seam where the
   * azimuth wraps.
   */
  /* Thick at the inside, tapering to a sliver at the rim. */
  float discHeight(float radial) {
    float k = 1.0 - 0.84 * radial;
    return DISC_H * k * k * sqrt(k) + 0.015;
  }

  float discDensity(vec3 p, out float radial) {
    float rr = length(p.xz);
    radial = clamp((rr - DISC_IN) / (DISC_OUT - DISC_IN), 0.0, 1.0);
    if (rr < DISC_IN * 0.82 || rr > DISC_OUT * 1.08) return 0.0;

    float h = discHeight(radial);
    float y = abs(p.y) / h;
    if (y > 3.2) return 0.0;
    float vert = exp(-y * sqrt(y));

    float taper = 1.0 - radial;
    float edges = smoothstep(0.0, 0.12, radial) * taper * sqrt(taper);
    float envelope = vert * edges;
    /*
     * The analytic envelope is read first and the noise only where it is worth
     * paying for. Most samples in a zoomed in frame land in the faint tails of
     * the slab, and this is what stops them costing seven octaves each.
     */
    if (envelope < 0.012) return 0.0;

    /*
     * Rotation, plus a standing twist that grows with radius. The twist is
     * what draws the clouds out into trailing arms: neighbouring radii read
     * the field at different angles, so an isotropic blob arrives sheared.
     */
    float spin = uTime * 1.35 * pow(DISC_IN / rr, 1.5) + 3.4 * log(rr);
    float c = cos(spin);
    float sn = sin(spin);
    vec3 q = vec3(p.x * c - p.z * sn, p.z * c + p.x * sn, p.y * 2.4 / h);

    int bodyOctaves = uQuality > 0.75 ? 4 : 3;
    int wispOctaves = uQuality > 0.75 ? 3 : 2;
    float body = fbm3(q * 1.15 + 11.0, bodyOctaves);
    float wisp = fbm3(q * 2.9 + vec3(0.0, 0.0, uTime * 0.06) + 3.0, wispOctaves);
    /* Puffs rather than a wash: the gaps between the clouds matter as much. */
    float clouds = smoothstep(0.30, 0.74, body * 0.8 + wisp * 0.32);
    float grain = mix(0.08, 1.0, clouds) * (0.6 + 0.7 * wisp);

    return envelope * grain;
  }

  /*
   * Distant sky: the same domain warped clouds and palette as the nebula that
   * surrounds the map, so the 404 sits in the same universe.
   */
  vec3 sky(vec3 dir, float starMask) {
    float t = uTime * 0.01;

    vec3 warp = vec3(
      fbm3(dir * 1.6 + vec3(t, 0.0, 0.0), 3),
      fbm3(dir * 1.6 + vec3(0.0, t, 5.2), 3),
      fbm3(dir * 1.6 + vec3(3.1, 0.0, t), 3)
    );

    float clouds = fbm3(dir * 2.6 + warp * 1.35, 4);
    float density = smoothstep(0.36, 0.95, clouds * 0.8 + fbm3(dir * 7.5 + warp * 2.1, 3) * 0.2);

    float warmLobe = smoothstep(0.25, 1.0, dot(dir, normalize(vec3(0.55, 0.25, -0.8))));
    float coldLobe = smoothstep(0.15, 1.0, dot(dir, normalize(vec3(-0.7, -0.2, 0.35))));

    vec3 colour = SKY_DEEP;
    colour = mix(colour, SKY_MID, density);
    colour = mix(colour, SKY_HOT, density * warmLobe * 0.7);
    colour = mix(colour, SKY_MID * 1.35, density * coldLobe * 0.5);
    colour *= 0.3 + pow(density, 1.6) * 0.8;

    /*
     * Stars sit on a grid over the cube face the bent ray points at, so
     * lensing smears them into arcs that sweep around the hole. That is what
     * the light actually does, and it is the best evidence on screen that
     * these are geodesics rather than a screen space warp.
     *
     * A grid in spherical coordinates would stretch towards the poles, and one
     * in three dimensions is worse: a cubic cell cuts the sphere in a long
     * thin sliver and a star anywhere inside it smears along the whole of it.
     */
    vec3 a = abs(dir);
    vec2 face = a.x >= a.y && a.x >= a.z ? dir.yz / a.x : (a.y >= a.z ? dir.xz / a.y : dir.xy / a.z);
    float faceId = a.x >= a.y && a.x >= a.z ? 0.0 : (a.y >= a.z ? 2.0 : 4.0);

    for (int layer = 0; layer < 2; layer++) {
      float scale = 90.0 + float(layer) * 130.0;
      vec2 grid = face * scale;
      vec2 cell = floor(grid);
      float seed = hash13(vec3(cell, faceId + float(layer) * 17.0));

      if (seed > 0.979) {
        vec2 centre = cell + vec2(hash13(vec3(cell, 3.1)), hash13(vec3(cell, 7.7)));
        float d = length(grid - centre);
        float twinkle = 0.7 + 0.3 * sin(uTime * 1.7 + seed * 40.0);
        colour += mix(vec3(0.72, 0.78, 1.0), vec3(1.0, 0.94, 0.86), seed)
          * smoothstep(0.45, 0.0, d) * twinkle * starMask * 0.85;
      }
    }

    return colour;
  }

  void main() {
    vec2 ndc = (gl_FragCoord.xy / uRes) * 2.0 - 1.0;
    vec2 uv = vec2(ndc.x * uAspect, ndc.y) * uTanHalfFov;

    vec3 eye = uCamPos;
    vec3 dir = normalize(uCamBasis * vec3(uv, -1.0));

    vec3 pos = eye;
    /* Conserved angular momentum of the ray, which sets how hard it bends. */
    vec3 h = cross(pos, dir);
    float h2 = dot(h, h);

    vec3 accum = vec3(0.0);
    float transmittance = 1.0;
    bool captured = false;

    /*
     * A per pixel offset on the first step. Fixed steps through a cloud lay
     * down visible shells; scattering where each ray starts turns those into
     * grain the eye reads as gas.
     */
    float jitter = hash13(vec3(gl_FragCoord.xy, 1.0));

    /*
     * Steps, and the share of them a single ray may spend inside the gas. The
     * budget is the reason a zoomed in shot costs about what a wide one does:
     * without it every pixel of a hole that fills the frame marches the slab
     * end to end at full detail.
     */
    int steps = int(float(STEPS) * (0.55 + 0.45 * uQuality));
    float volBudget = 30.0 + 22.0 * uQuality;
    float spent = 0.0;

    for (int i = 0; i < STEPS; i++) {
      if (i >= steps) break;

      float r = length(pos);
      /* Past the horizon nothing returns, including what was gathered on the way. */
      if (r < RS * 1.02) { captured = true; accum *= 0.1; break; }
      /* Out here the deflection is spent and there is no gas left to cross. */
      if (r > 60.0 && dot(pos, dir) > 0.0) break;
      if (transmittance < 0.01) break;

      float dt = clamp(r * 0.06, 0.02, 3.0);

      /*
       * Where the slab is, relative to this point. The bound follows the local
       * scale height rather than a fixed slice, so the thin outer disc is
       * cheap and only the banked inner edge asks for close steps.
       */
      float rr = length(pos.xz);
      float radial = clamp((rr - DISC_IN) / (DISC_OUT - DISC_IN), 0.0, 1.0);
      float reach = 3.4 * discHeight(radial);
      bool inside = rr > DISC_IN * 0.6 && rr < DISC_OUT * 1.12 && abs(pos.y) < reach;

      if (inside) {
        /* Once a ray has spent its share of samples the step relaxes. */
        float relax = 1.0 + max(0.0, spent - volBudget) * 0.4;
        dt = min(dt, max(0.045, discHeight(radial) * 0.6) * relax);
        spent += 1.0;
      } else {
        /* Empty above or below: jump to the face of the slab in one step. */
        float gap = abs(pos.y) - reach;
        float fall = abs(dir.y);
        if (gap > 0.0 && fall > 0.001) dt = clamp(gap / fall * 0.9, dt, 4.0);
      }

      /* However the step was chosen, the geodesic still has to be resolved. */
      dt = min(dt, max(0.1, r * 0.1));
      if (i == 0) dt *= 0.35 + jitter * 0.65;

      vec3 next = pos + dir * dt;

      /*
       * Emission and absorption over the step, sampled at its midpoint. The
       * disc used to be an infinitely thin plane read wherever the ray crossed
       * it, which was crisp but read as a solid ribbon; integrating through a
       * slab is what makes it look like something burning.
       */
      if (inside) {
        float t;
        vec3 mid = pos + dir * (dt * 0.5);
        float density = discDensity(mid, t);

        if (density > 0.0) {
          /* A gentle beam on the approaching side, not the full relativistic one. */
          float doppler = 1.0 + 0.55 * clamp(mid.x / DISC_OUT, -1.0, 1.0);
          accum += discColour(t) * density * doppler * dt * 7.4 * transmittance;
          transmittance *= exp(-density * dt * 3.1);
        }
      }

      /* Deflection of a null geodesic in a Schwarzschild field. */
      float r5 = r * r * r * r * r;
      dir += (-1.5 * h2 / r5) * pos * dt;
      pos = next;
    }

    /*
     * The arcs are the point, but right against the shadow and the rings they
     * pile up into a scratched mess, so the star field fades out there and the
     * disc gets that space to itself.
     */
    float screen = length(ndc * vec2(uAspect, 1.0)) * 0.5;
    float starMask = smoothstep(0.34, 0.60, screen);

    vec3 colour = accum;
    if (!captured) colour += sky(normalize(dir), starMask) * transmittance;

    colour = colour / (colour + vec3(0.9));
    colour = pow(colour, vec3(0.88));
    colour *= 1.0 - 0.35 * smoothstep(0.5, 1.3, screen * 2.0);

    fragColor = vec4(colour, 1.0);
  }
`;

export function BlackHoleField({ quality = 1 }: { quality?: number }) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const uniforms = useMemo(
    () => ({
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uCamPos: { value: new THREE.Vector3() },
      uCamBasis: { value: new THREE.Matrix3() },
      uTanHalfFov: { value: 0.5 },
      uAspect: { value: 1 },
      uQuality: { value: 1 },
    }),
    [],
  );

  /*
   * Uniforms are written through the material rather than through the object
   * handed to it: that object is the initial value and is treated as frozen,
   * while the material's copy is the live one the renderer reads.
   */
  useFrame((state) => {
    const live = material.current?.uniforms;
    if (!live) return;

    const camera = state.camera as THREE.PerspectiveCamera;

    live.uTime.value = state.clock.elapsedTime;
    live.uRes.value.set(size.width * state.viewport.dpr, size.height * state.viewport.dpr);
    live.uCamPos.value.copy(camera.position);
    // Columns of the world matrix are the camera's right, up and back axes.
    live.uCamBasis.value.setFromMatrix4(camera.matrixWorld);
    live.uTanHalfFov.value = Math.tan((camera.fov * Math.PI) / 360);
    live.uAspect.value = size.width / size.height;
    live.uQuality.value = quality;
  });

  return (
    <mesh frustumCulled={false} renderOrder={-1000}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
        glslVersion={THREE.GLSL3}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
