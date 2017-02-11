import {Mesh, MeshProperty} from './mesh';

// Text labels cannot be implemented as an instanced layer
export default class Text2d extends Mesh {
  constructor({position, color, size, rotation, id, texts, cameraID = 'default-cam'}) {
    super({id, cameraID});

    this.properties.set('position', new MeshProperty({id: 'position', hostData: position}));
    this.properties.set('color', new MeshProperty({id: 'color', hostData: color}));
    this.properties.set('size', new MeshProperty({id: 'size', hostData: size}));
    this.properties.set('rotation', new MeshProperty({id: 'rotation', hostData: rotation}));
    this.properties.set('texts', new MeshProperty({id: 'texts', hostData: texts}));

  }
}
