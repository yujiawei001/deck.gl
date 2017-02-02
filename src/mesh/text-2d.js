import {Mesh, MeshProperty} from './mesh';
import {flatten2D} from '../lib/utils/flatten';

function getMiddlePoint(a, b) {
  const x = (a[0] + b[0]) / 2;
  const y = (a[1] + b[1]) / 2;
  const z = (a[2] + b[2]) / 2;
  const length = Math.sqrt(x * x + y * y + z * z);

  return [x / length, y / length, z / length];
}

export default class Text2d extends Mesh {
  constructor() {
    this.mesh2d = true;
  }
}
