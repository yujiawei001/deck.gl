import {Mesh} from './mesh';
import {MeshGenerator} from './mesh-generator';
import {flatten2D} from '../lib/utils/flatten';

export default class Circles extends Mesh {
  constructor({position, color, size, rotation, id, cameraID = 'default-cam', textures = []}) {
    super({id, position, color, size, rotation, cameraID});

    const circle = MeshGenerator.unitCircle({numSections: 16});

     // Per vertex
    this.properties.get('vertices').hostData = new Float32Array(flatten2D(circle.vertices));
    this.properties.get('normals').hostData = new Float32Array(flatten2D(circle.normals));
    this.properties.get('index').hostData = new Uint16Array(flatten2D(circle.index));
    this.properties.get('texCoords').hostData = new Float32Array(flatten2D(circle.texCoords));

    this.textures = textures;
  }
}
