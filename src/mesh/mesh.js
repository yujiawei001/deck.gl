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
  constructor({id, cameraID}) {
    this.modelMatrix = mat4.create();
    this.id = id;
    this.cameraID = cameraID;
    this.properties = new Map();

    // Per vertex
    this.properties.set('vertices', new MeshProperty({id: 'vertices'}));
    this.properties.set('texCoords', new MeshProperty({id: 'texCoords'}));
    this.properties.set('index', new MeshProperty({id: 'index'}));
    this.properties.set('normals', new MeshProperty({id: 'normals'}));

    // Per instance
    this.properties.set('position', new MeshProperty({id: 'position'}));
    this.properties.set('color', new MeshProperty({id: 'color'}));
    this.properties.set('size', new MeshProperty({id: 'size'}));

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
