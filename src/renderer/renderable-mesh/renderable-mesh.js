import {flatten2D} from '../../lib/utils/flatten';

/* The base class, RenderableMesh */
export class RenderableMesh {
  constructor({mesh, renderer}) {
    console.log('RenderableMesh.constructor()');

    this.id = `${mesh.id}.renderable`;
    // These can be initialized in the super class because they are required for all Mesh objects
    this.renderer = renderer;

    // hidden
    this.hidden = false;

    this.cameraID = mesh.cameraID;
    // It has a reference to the abstract mesh. Remember, abstract mesh
    // may or may not be the same as the renderable mesh
    this.mesh = mesh;

    this.textures = new Map();

    // We store IDs here because our buffer management is centralized.
    this.attributes = new Map();

    // Number of primitives depends on the kind of primitive this mesh holds
    this.numberOfVertices = 0;

    // Number of instances
    this.numberOfInstances = 0;

    // Model matrix for moving the mesh easier
    // Mesh space stuff, such as rotation, scaling probably will happen here
    this._modelMatrix = mesh.modelMatrix;

    this.lightLocations = new Float32Array(3 * 16);

    // default program
    this.programID = 'default';

    this.uint32Indices = false;

    this.shaderFlags = {};
  }

  addVertexAttribute(id, attribute) {
    this.attributes.set(id, attribute);
  }

  // Convenience functions for communicating with resource managers
  getVertexAttributeBufferByID(id) {
    if (this.attributes.get(id) !== undefined) {
      return this.renderer.bufferManager.getBufferByID(this.attributes.get(id).bufferID);
    }
    return undefined;
  }

  getTextureByID(id) {
    if (this.textures.get(id) !== undefined) {
      return this.renderer.textureManager.getTextureByID(this.textures.get(id));
    }
    return undefined;
  }

  getProgramByID(id) {
    return this.renderer.programManager.getProgramByID(id);
  }

  render(cameraUniforms) {
    // These are default properties and uniforms
    // We can add more default stuff here
    this.getProgramByID(this.programID).use();

    this.getProgramByID(this.programID).setUniforms({
      modelMatrix: this._modelMatrix
    });

    this.getProgramByID(this.programID).setUniforms({
      viewProjectionMatrix: cameraUniforms.viewProjectionMatrix,
      viewMatrix: cameraUniforms.viewMatrix
    });

    this.getProgramByID(this.programID).setUniforms({
      cameraPos: cameraUniforms.cameraPosition
    });

    const textures = {};
    for (const key of this.textures.keys()) {
      textures[key] = this.getTextureByID(key);
    }

    this.getProgramByID(this.programID).setUniforms(textures);

    this.lightLocations[0] = 0.0;
    this.lightLocations[1] = -100.0;
    this.lightLocations[2] = -20.0;

    this.lightLocations[3] = 0.0;
    this.lightLocations[4] = 30.0;
    this.lightLocations[5] = 100.0;

    this.lightLocations[6] = 100.0;
    this.lightLocations[7] = 0.0;
    this.lightLocations[8] = 0.0;

    this.lightLocations[9] = -100.0;
    this.lightLocations[10] = 0.0;
    this.lightLocations[11] = 0.0;

    // this.lightLocations[12] = 0.0;
    // this.lightLocations[13] = 100.0;
    // this.lightLocations[14] = 0.0;

    // this.lightLocations[15] = 0.0;
    // this.lightLocations[16] = -100.0;
    // this.lightLocations[17] = 0.0;

    this.getProgramByID(this.programID).setUniforms({
      lightDirection: this.lightLocations
    });

    const buffers = {};
    for (const key of this.attributes.keys()) {
      buffers[key] = this.getVertexAttributeBufferByID(key);
    }

    this.getProgramByID(this.programID).setBuffers(buffers);

  }

  // TODO:
  // RenderableMesh update should also happen with help from
  // MeshGenerator classes.

  // Default implementation.
  // This only works when attributes in RenderableMesh and property in Mesh is 1-to-1 match.
  // Subclass should override if properties and attributes are not matched 1-to-1 (most of the cases)
  updateAttributes({properties}) {
    for (const propertyID of properties.keys()) {
      const data = this.mesh.getDataForPropertyID(propertyID);
      const buffer = this.getVertexAttributeBufferByID(propertyID);
      if (buffer === undefined) {
        throw Error(`No buffer for attribute name: ${propertyID}`);
      }
      /* TODO: we are creating a new Float32Array every time when the data are updated. Need to get this fixed*/
      buffer.setData({
        data: new Float32Array(flatten2D(data)),
        size: this.attributes.get(propertyID).size,
        target: this.attributes.get(propertyID).target,
        instanced: this.attributes.get(propertyID).instanced
      });
    }
  }
}
