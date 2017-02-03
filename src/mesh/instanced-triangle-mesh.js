import {Mesh} from './mesh';

export default class InstancedTriangleMesh extends Mesh {
  constructor({position, texCoords, index, instancedPosition, instancedColor, instancedRadius, id, cameraID = 'default', textures = []}) {
    super({id, cameraID});

    this.properties.set(
      'position',
      {hostData: new Float32Array(position)}
    );
    this.properties.set(
      'normals',
      {hostData: new Float32Array(position)}
    );
    this.properties.set(
      'texCoords',
      {hostData: new Float32Array(texCoords)}
    );

    this.properties.set(
      'index',
      {hostData: new Uint16Array(index)}
    );

    // this is not in use for instanced rendering
    const color = new Float32Array(12 * 4);
    for (let i = 0; i < 12; i++) {
      color[i * 4 + 0] = 1.0;
      color[i * 4 + 1] = 0.0;
      color[i * 4 + 2] = 0.0;
      color[i * 4 + 3] = 1.0;
    }

    this.properties.set(
      'color',
      {hostData: new Float32Array(color)}
    );

    this.properties.set(
      'instancedPosition',
      {hostData: new Float32Array(instancedPosition)}
    );

    this.properties.set(
      'instancedColor',
      {hostData: new Float32Array(instancedColor)}
    );

    this.properties.set(
      'instancedRadius',
      {hostData: new Float32Array(instancedRadius)}
    );

    this.textures = textures;
  }
}
