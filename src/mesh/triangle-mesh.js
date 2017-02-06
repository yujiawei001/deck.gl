import {Mesh} from './mesh';

export default class TriangleMesh extends Mesh {
  constructor({vertices, texCoords, index, position, color, size, id, cameraID = 'default', textures = []}) {
    super({id, cameraID});

    // Per vertex
    this.properties.set(
      'vertices',
      {hostData: new Float32Array(vertices)}
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

    // Per instance
    this.properties.set(
      'position',
      {hostData: new Float32Array(position)}
    );

    this.properties.set(
      'color',
      {hostData: new Float32Array(color)}
    );

    this.properties.set(
      'size',
      {hostData: new Float32Array(size)}
    );

    this.textures = textures;
  }
}
