import {Mesh} from './mesh';

export default class Triangles extends Mesh {
  constructor({position, texCoords, color, index, id, cameraID = 'default-cam', textures = []}) {
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
      'color',
      {hostData: new Float32Array(color)}
    );
    this.properties.set(
      'index',
      {hostData: new Uint16Array(index)}
    );

    this.textures = textures;
  }
}
