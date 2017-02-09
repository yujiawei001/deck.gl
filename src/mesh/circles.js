import {Mesh, MeshProperty} from './mesh';
import {MeshGenerator} from './mesh-generator';
import {flatten2D} from '../lib/utils/flatten';

export default class Circles extends Mesh {
  constructor({position, color, size, rotation, id, cameraID = 'default-cam', textures = []}) {
    super({id, cameraID});

    const circle = MeshGenerator.unitCircle({numSections: 16});

     // Per vertex
    this.properties.get('vertices').hostData = new Float32Array(flatten2D(circle.vertices));
    this.properties.get('normals').hostData = new Float32Array(flatten2D(circle.normals));
    this.properties.get('index').hostData = new Uint16Array(flatten2D(circle.index));
    this.properties.get('texCoords').hostData = new Float32Array(flatten2D(circle.texCoords));
    this.properties.set('vertexColorNotInUse', new MeshProperty({id: 'verticeColorNotInUse', attributeID: 'color', size: 4, instanced: 0, hostData: new Float32Array(flatten2D(circle.color))}));

    // Per instance
    this.numberOfInstances = position.length;
    this.properties.set('position', new MeshProperty({id: 'position', attributeID: 'instancePosition', size: 3, instanced: 1, hostData: new Float32Array(flatten2D(position))}));

    if (color === undefined) {
      const defaultColor = Array.from({length: this.numberOfInstances}).map(x => [0, 0, 0, 1]);
      this.properties.set('color', new MeshProperty({id: 'color', attributeID: 'instanceColor', size: 4, instanced: 1, hostData: new Float32Array(flatten2D(defaultColor))}));
    } else {
      this.properties.set('color', new MeshProperty({id: 'color', attributeID: 'instanceColor', size: 4, instanced: 1, hostData: new Float32Array(flatten2D(color))}));
    }

    if (size === undefined) {
      const defaultSize = Array.from({length: this.numberOfInstances}).map(x => [1]);
      this.properties.set('size', new MeshProperty({id: 'size', attributeID: 'instanceScale', size: 1, instanced: 1, hostData: new Float32Array(flatten2D(defaultSize))}));
    } else {
      this.properties.set('size', new MeshProperty({id: 'size', attributeID: 'instanceScale', size: 1, instanced: 1, hostData: new Float32Array(flatten2D(size))}));
    }

    if (rotation === undefined) {
      const defaultRotation = Array.from({length: this.numberOfInstances}).map(x => [0, 0, 0, 1]);
      this.properties.set('rotation', new MeshProperty({id: 'rotation', attributeID: 'instanceRotation', size: 4, instanced: 1, hostData: new Float32Array(flatten2D(defaultRotation))}));
    } else {
      this.properties.set('rotation', new MeshProperty({id: 'rotation', attributeID: 'instanceRotation', size: 4, instanced: 1, hostData: new Float32Array(flatten2D(rotation))}));
    }

    this.textures = textures;
  }
}
