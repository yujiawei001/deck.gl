import {Mesh, MeshProperty} from './mesh';
import {MeshGenerator} from './mesh-generator';
import {flatten2D} from '../lib/utils/flatten';

export default class Circles extends Mesh {
  constructor({position, color, size, id, cameraID = 'default-cam', textures = []}) {
    super({id, cameraID});

    const circle = MeshGenerator.unitCircle({numSections: 16});

     // Per vertex
    this.properties.get('vertices').hostData = new Float32Array(flatten2D(circle.vertices));
    this.properties.get('normals').hostData = new Float32Array(flatten2D(circle.normals));
    this.properties.get('index').hostData = new Uint16Array(flatten2D(circle.index));
    this.properties.get('texCoords').hostData = new Float32Array(flatten2D(circle.texCoords));

    // Per instance
    this.properties.set(
      'position',
      new MeshProperty({id: 'position', hostData: new Float32Array(flatten2D(position))})
    );

    this.properties.set(
      'color',
      new MeshProperty({id: 'color', hostData: new Float32Array(flatten2D(color))})
    );

    this.properties.set(
      'size',
      new MeshProperty({id: 'size', hostData: new Float32Array(flatten2D(size))})
    );

    this.textures = textures;
  }
}
