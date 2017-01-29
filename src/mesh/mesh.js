import {mat4} from 'gl-matrix';

/*
Meshes are consists of a bunch of primitives. Primitives doesn't need to
coincide with primitives renderers support natively. But any renderer
needs to know how to convert each type of primitives here
to real native primitives that can be rendered
*/
export class Mesh {
  constructor({cameraID}) {
    // this.vertices = null;
    // this.texCoords = null;
    // this.color = null;
    // this.index = null;
    // this.normals = null;
    this.modelMatrix = mat4.create();
    this.id = '';
    this.cameraID = cameraID;
    this.properties = new Map();
    this.properties.set('position', {hostData: undefined, deviceData: undefined});
    this.properties.set('texCoords', {hostData: undefined, deviceData: undefined});
    this.properties.set('color', {hostData: undefined, deviceData: undefined});
    this.properties.set('index', {hostData: undefined, deviceData: undefined});
    this.properties.set('normals', {hostData: undefined, deviceData: undefined});

    this.textures = [];
  }

  updateProperty({propertyID, data}) {
    const property = this.properties.get(propertyID).hostData;
    for (let i = 0; i < property.length; i++) {
      property[i] = data[i];
    }
  }
}
