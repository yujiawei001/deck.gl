import {Mesh} from './mesh';
import {flatten2D} from '../lib/utils/flatten';

export default class Lines extends Mesh {
  constructor({position, texCoords, color, index, id, cameraID = 'default-cam', width = 1.0}) {
    super({cameraID});

    this.properties.set(
      'position',
      {hostData: new Float32Array(flatten2D(position))}
    );

    this.properties.set(
      'normals',
      {hostData: new Float32Array(flatten2D(position))}
    );


    if (!texCoords) {
      this.properties.set(
        'texCoords',
        {hostData: new Float32Array(position.length * 2)}
      );
    } else {
      this.properties.set(
        'texCoords',
        {hostData: new Float32Array(flatten2D(texCoords))}
      );
    }

    this.properties.set(
      'color',
      {hostData: new Float32Array(flatten2D(color))}
    );

    this.properties.set(
      'index',
      {hostData: new Uint32Array(index)}
    );
    this.width = width;
    this.id = 'lines_' + id;
  }
}
