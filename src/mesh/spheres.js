import {Mesh, MeshProperty} from './mesh';
import {MeshGenerator} from './mesh-generator';
import {flatten2D} from '../lib/utils/flatten';

export default class Spheres extends Mesh {
  constructor({position, color, size, id, cameraID = 'default-cam', textures = []}) {
    super({id, cameraID});

    // generating a unit sphere as a refined icosahedron
    const icosphere = MeshGenerator.unitIcosphere({refineLevel: 2});

    const vertices = new Float32Array(flatten2D(icosphere.vertices));
    const normals = new Float32Array(flatten2D(icosphere.normals));
    const indices = new Uint16Array(flatten2D(icosphere.index));
    const texCoords = new Float32Array(flatten2D(icosphere.texCoords));

    // Per vertex
    this.properties.get('vertices').hostData = vertices;
    this.properties.get('normals').hostData = normals;
    this.properties.get('index').hostData = indices;
    this.properties.get('texCoords').hostData = texCoords;

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
