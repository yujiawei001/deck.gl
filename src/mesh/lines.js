import {Mesh} from './mesh';
import {flatten2D} from '../lib/utils/flatten';

export default class Lines extends Mesh {
  constructor({position, texCoords, color, index, id, cameraID = 'default-cam', width = 1.0}) {
    super({id, cameraID});

    this.properties.get('position').hostData = new Float32Array(flatten2D(position));
    this.properties.get('normals').hostData = new Float32Array(flatten2D(position));
    this.properties.get('texCoords').hostData = texCoords !== undefined ? texCoords : new Float32Array(position.length * 2);
    this.properties.get('color').hostData = new Float32Array(flatten2D(color));
    this.properties.get('index').hostData = new Uint32Array(flatten2D(index));

    this.width = width;
  }
}
