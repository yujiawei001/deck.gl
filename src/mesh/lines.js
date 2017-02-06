import {Mesh} from './mesh';
import {flatten2D} from '../lib/utils/flatten';

export default class Lines extends Mesh {
  constructor({vertices, texCoords, color, index, id, cameraID = 'default-cam', width = 1.0}) {
    super({id, cameraID});

    this.properties.get('vertices').hostData = new Float32Array(flatten2D(vertices));
    this.properties.get('normals').hostData = new Float32Array(flatten2D(vertices));
    this.properties.get('texCoords').hostData = texCoords !== undefined ? texCoords : new Float32Array(vertices.length * 2);
    this.properties.get('color').hostData = new Float32Array(flatten2D(color));

    // if index is not provided, it means the user is expecting a non-indexed call.
    // right now, a pseudo-index array is generated to make the renderer simpler
    if (index === undefined) {
      const indexSequence = new Uint32Array(vertices.length);
      for (let i = 0; i < indexSequence.length; i++) {
        indexSequence[i] = i;
      }
      this.properties.get('index').hostData = indexSequence;
    } else {
      this.properties.get('index').hostData = new Uint32Array(flatten2D(index));
    }

    this.width = width;
  }
}
