// import {Ray, Sphere} from '../../utils';
// import {vec3} from 'gl-matrix';

export default class Intersect {
  constructor() {
  }

  static rayWithSphere({ray, sphere}) {
    const A = 1.0;
    const B = (ray.direction[0] * (ray.origin[0] - sphere.center[0]) +
              ray.direction[1] * (ray.origin[1] - sphere.center[1]) +
              ray.direction[2] * (ray.origin[2] - sphere.center[2])) * 2.0;
    const C = (ray.origin[0] - sphere.center[0]) * (ray.origin[0] - sphere.center[0]) +
              (ray.origin[1] - sphere.center[1]) * (ray.origin[1] - sphere.center[1]) +
              (ray.origin[2] - sphere.center[2]) * (ray.origin[2] - sphere.center[2]) -
              sphere.radius * sphere.radius;
    const discriminant = B * B - 4 * A * C;
    if (discriminant < 0.0) {
      return Infinity;
    }

    const sqrtDisc = Math.sqrt(discriminant);
    const t0 = (-B - sqrtDisc) / 2.0;
    const t1 = (-B + sqrtDisc) / 2.0;
    if (t0 >= 0.0) {
      return t0;
    }
    if (t1 >= 0.0) {
      return t1;
    }

    return Infinity;
  }
}
