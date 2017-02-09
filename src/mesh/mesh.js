import {mat4} from 'gl-matrix';
import {flatten2D} from '../lib/utils/flatten';

/*
Meshes are consists of a bunch of primitives. Primitives doesn't need to
coincide with primitives renderers support natively. But any renderer
needs to know how to convert each type of primitives here
to real native primitives that can be rendered
*/

// TODO: Mesh generation should be put under Renderer and be closer to RenderableMesh
// Right now, Mesh classes contain too much render/shader specific info. This is NOT
// the correct pattern.

export class MeshProperty {
  constructor({id, hostData, deviceData, attributeID, size = 1, instanced = 0, dirty = false} = {}) {
    this.id = id;
    this.attributeID = attributeID;
    this.size = size;
    this.instanced = instanced;
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
    this.attributePropertyMap = new Map();

    this.instancedDraw = true;
    this.indexedDraw = true;
    this.numberOfInstances = 1;

    // Per vertex properties are set in subclasses
    this.properties.set('vertices', new MeshProperty({id: 'vertices', attributeID: 'vertices', size: 3}));
    this.properties.set('texCoords', new MeshProperty({id: 'texCoords', attributeID: 'texCoords', size: 2}));
    this.properties.set('index', new MeshProperty({id: 'index', attributeID: 'index', size: 1}));
    this.properties.set('normals', new MeshProperty({id: 'normals', attributeID: 'normals', size: 3}));
    this.properties.set('color', new MeshProperty({id: 'color', attributeID: 'color', size: 4}));

    this.textures = [];

    this.generated = false;
  }

  getDataForAttributeID(attributeID) {
    const propertyID = this.propertyAttributeMap.get(attributeID);
    return this.properties.get(propertyID).hostData;
  }

  updateProperties({propertyIDs, data}) {
    for (let i = 0; i < propertyIDs.length; i++) {
      const propertyID = propertyIDs[i];

      const propertyToUpdate = this.properties.get(propertyID);
      const srcData = flatten2D(data[i]);

      for (let j = 0; j < propertyToUpdate.hostData.length; j++) {
        propertyToUpdate.hostData[j] = srcData[j];
      }
      propertyToUpdate.dirty = true;
    }
  }
}
