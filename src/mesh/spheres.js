import {Mesh} from './mesh';
import {MeshGenerator} from './mesh-generator';
import {flatten2D} from '../lib/utils/flatten';

export default class Spheres extends Mesh {
  constructor({position, color, size, rotation, id, cameraID = 'default-cam', textures = []}) {
    super({id, position, color, size, rotation, cameraID});

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

    // TODO: support textured sphere
    // this.textures = textures;
  }
}
