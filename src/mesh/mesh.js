import {mat4} from 'gl-matrix';
import {flatten2D} from '../lib/utils/flatten';

/*
Meshes are consists of a bunch of primitives. Primitives doesn't need to
coincide with primitives renderers support natively. But any renderer
needs to know how to convert each type of primitives here
to real native primitives that can be rendered
*/
export class MeshProperty {
  constructor({id, hostData, deviceData, dirty = false} = {}) {
    this.id = id;
    this.hostData = hostData;
    this.deviceData = deviceData;
    this.dirty = dirty;
  }
}
export class Mesh {
  constructor({id, position, color, size, rotation, cameraID}) {
    this.modelMatrix = mat4.create();
    this.id = id;
    this.cameraID = cameraID;
    this.properties = new Map();

    this.instancedDraw = true;
    this.indexedDraw = true;

    // Per vertex properties are set in subclasses

    this.properties.set('vertices', new MeshProperty({id: 'vertices'}));
    this.properties.set('texCoords', new MeshProperty({id: 'texCoords'}));
    this.properties.set('index', new MeshProperty({id: 'index'}));
    this.properties.set('normals', new MeshProperty({id: 'normals'}));


    // Per instance properties are set here
    this.properties.set('position', new MeshProperty({id: 'position'}));
    this.properties.set('color', new MeshProperty({id: 'color'}));
    this.properties.set('size', new MeshProperty({id: 'size'}));
    this.properties.set('rotation', new MeshProperty({id: 'rotation'}));

    // Per instance
    let numInstances = 1;
    if (position === undefined) {
      this.properties.get('position').hostData = new Float32Array([0, 0, 0]);
    } else {
      this.properties.get('position').hostData = new Float32Array(flatten2D(position));
      numInstances = position.length;
    }

    if (color === undefined) {
      const defaultColor = new Array(numInstances.length).map(x => [0, 0, 0, 1]);
      this.properties.get('size').hostData = new Float32Array(flatten2D(defaultColor));
    } else {
      this.properties.get('color').hostData = new Float32Array(flatten2D(color));
    }
    if (size === undefined) {
      const defaultSize = new Array(numInstances.length).map(x => [1]);
      this.properties.get('size').hostData = new Float32Array(flatten2D(defaultSize));
    } else {
      this.properties.get('size').hostData = new Float32Array(flatten2D(size));
    }

    if (rotation === undefined) {
      const defaultRotation = new Array(numInstances.length).map(x => [0, 0, 0, 1]);
      this.properties.get('rotation').hostData = new Float32Array(flatten2D(defaultRotation));
    } else {
      this.properties.get('rotation').hostData = new Float32Array(flatten2D(rotation));
    }

    this.textures = [];

    this.generated = false;
  }

  updateProperty({propertyID, data}) {
    const srcData = flatten2D(data);
    const property = this.properties.get(propertyID).hostData;
    for (let i = 0; i < property.length; i++) {
      property[i] = srcData[i];
    }
    this.properties.get(propertyID).dirty = true;
  }
}
