import {Mesh, MeshProperty} from './mesh';
import {flatten2D} from '../lib/utils/flatten';

export default class Circles extends Mesh {
  constructor({position, color, size, id, cameraID = 'default-cam', textures = []}) {
    super({id, cameraID});

    const numSections = 16;

    const vertices = new Float32Array((numSections + 1) * 3);
    const normals = new Float32Array((numSections + 1) * 3);
    const index = new Uint16Array(numSections * 3);
    const texCoords = new Float32Array((numSections + 1) * 2);

    for (let i = 0; i < numSections; i++) {
      vertices[i * 3 + 0] = Math.cos(Math.PI * 2 * i / numSections);
      vertices[i * 3 + 1] = Math.sin(Math.PI * 2 * i / numSections);
      vertices[i * 3 + 2] = 0;

      normals[i * 3 + 0] = 0;
      normals[i * 3 + 1] = 0;
      normals[i * 3 + 2] = 1;

      texCoords[i * 2 + 0] = (Math.cos(Math.PI * 2 * i / numSections) + 1) / 2;
      texCoords[i * 2 + 1] = (Math.sin(Math.PI * 2 * i / numSections) + 1) / 2;

      index[i * 3 + 0] = i;
      index[i * 3 + 1] = (i + 1) % numSections;
      index[i * 3 + 2] = numSections;
    }

    normals[numSections * 3 + 0] = 0;
    normals[numSections * 3 + 1] = 0;
    normals[numSections * 3 + 2] = 1;

    texCoords[numSections * 2 + 0] = 0.5;
    texCoords[numSections * 2 + 1] = 0.5;

    // Per vertex
    this.properties.get('vertices').hostData = vertices;
    this.properties.get('normals').hostData = normals;
    this.properties.get('index').hostData = index;
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
