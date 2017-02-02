import {Mesh, MeshProperty} from './mesh';
import {flatten2D} from '../lib/utils/flatten';

export default class InstancedCircles extends Mesh {
  constructor({instancedPosition, instancedColor, instancedSize, id, cameraID = 'default-cam', textures = []}) {
    super({id, cameraID});

    const numSections = 16;

    const vertices = new Float32Array((numSections + 1) * 3);
    const normals = new Float32Array((numSections + 1) * 3);
    const index = new Uint16Array(numSections * 3);
    const texCoords = new Float32Array((numSections + 1) * 2);
    const color = new Float32Array(numSections * 4);

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

      // Color is not active in instanced rendering
      color[i * 4 + 0] = 1.0;
      color[i * 4 + 1] = 0.0;
      color[i * 4 + 2] = 0.0;
      color[i * 4 + 3] = 1.0;
    }

    this.properties.get('position').hostData = vertices;
    this.properties.get('normals').hostData = normals;
    this.properties.get('index').hostData = index;
    this.properties.get('texCoords').hostData = texCoords;
    this.properties.get('color').hostData = color;

    this.properties.set(
      'instancedPosition',
      new MeshProperty({id: 'instancedPosition', hostData: new Float32Array(flatten2D(instancedPosition))})
    );

    this.properties.set(
      'instancedColor',
      new MeshProperty({id: 'instancedColor', hostData: new Float32Array(flatten2D(instancedColor))})
    );

    this.properties.set(
      'instancedSize',
      new MeshProperty({id: 'instancedSize', hostData: new Float32Array(flatten2D(instancedSize))})
    );

    this.textures = textures;
  }
}
