import {Mesh, MeshProperty} from './mesh';

export default class Spheres extends Mesh {
  constructor({position, color, size, rotation, id, cameraID = 'default-cam', textures = []}) {
    super({id, cameraID});

    this.properties.set('position', new MeshProperty({id: 'position', hostData: position}));

    if (color) {
      this.properties.set('color', new MeshProperty({id: 'color', attributeID: 'instanceColor', size: 4, instanced: 1, hostData: color}));
    } else {
      this.properties.set('color', new MeshProperty({id: 'color', attributeID: 'instanceColor', size: 4, instanced: 1, hostData: Array.from({length: position.length}).map(x => [0, 0, 0, 1])}));
    }

    if (size) {
      this.properties.set('size', new MeshProperty({id: 'size', attributeID: 'instanceScale', size: 1, instanced: 1, hostData: size}));
    } else {
      this.properties.set('size', new MeshProperty({id: 'size', attributeID: 'instanceScale', size: 1, instanced: 1, hostData: Array.from({length: position.length}).map(x => [1])}));
    }

    if (rotation) {
      this.properties.set('rotation', new MeshProperty({id: 'rotation', attributeID: 'instanceRotation', size: 4, instanced: 1, hostData: rotation}));
    } else {
      this.properties.set('rotation', new MeshProperty({id: 'rotation', attributeID: 'instanceRotation', size: 4, instanced: 1, hostData: Array.from({length: position.length}).map(x => [0, 0, 0, 1])}));
    }

    this.textures = textures;

  }
}
