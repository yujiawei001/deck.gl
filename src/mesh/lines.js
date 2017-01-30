import {Mesh} from './mesh';
import {flatten2D} from '../lib/utils/flatten';

export default class Lines extends Mesh {
  constructor({position, texCoords, color, index, id, cameraID = 'default-cam', width = 1.0}) {
    super({id, cameraID});

    this.properties.get('position').hostData = new Float32Array(flatten2D(position));
    this.properties.get('normals').hostData = new Float32Array(flatten2D(position));
    this.properties.get('texCoords').hostData = texCoords !== undefined ? texCoords : new Float32Array(position.length * 2);
    this.properties.get('color').hostData = new Float32Array(flatten2D(color));

    // if index is not provided, it means the user is expecting a non-indexed call.
    // right now, a pseudo-index array is generated to make the renderer
    if (index === undefined) {
      const indexSequence = new Uint32Array(position.length);
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
