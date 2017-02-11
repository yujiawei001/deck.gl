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

    this.textures = [];

    this.generated = false;
  }

  getDataForPropertyID(propertyID) {
    return this.properties.get(propertyID).hostData;
  }

  updateProperties({propertyIDs, data}) {
    for (let i = 0; i < propertyIDs.length; i++) {
      const propertyID = propertyIDs[i];

      const propertyToUpdate = this.properties.get(propertyID);
      const srcData = data[i];

      // for (let j = 0; j < propertyToUpdate.hostData.length; j++) {
      propertyToUpdate.hostData = srcData;
      // }
      propertyToUpdate.dirty = true;
    }
  }
}
