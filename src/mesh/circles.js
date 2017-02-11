import {Mesh, MeshProperty} from './mesh';

export default class Circles extends Mesh {
  constructor({position, color, size, rotation, id, cameraID = 'default-cam', textures = []}) {
    super({id, cameraID});

    this.properties.set('position', new MeshProperty({id: 'position', hostData: position}));

    if (color) {
      this.properties.set('color', new MeshProperty({id: 'color', hostData: color}));
    } else {
      this.properties.set('color', new MeshProperty({id: 'color', hostData: Array.from({length: position.length}).map(x => [0, 0, 0, 1])}));
    }

    if (size) {
      this.properties.set('size', new MeshProperty({id: 'size', hostData: size}));
    } else {
      this.properties.set('size', new MeshProperty({id: 'size', hostData: Array.from({length: position.length}).map(x => [1])}));
    }

    if (rotation) {
      this.properties.set('rotation', new MeshProperty({id: 'rotation', hostData: rotation}));
    } else {
      this.properties.set('rotation', new MeshProperty({id: 'rotation', hostData: Array.from({length: position.length}).map(x => [0, 0, 0, 1])}));
    }

    this.textures = textures;
  }
}
