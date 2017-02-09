import {GL} from './luma.gl2/webgl2';
export class VertexAttribute {
  constructor({bufferID, size, target = GL.ARRAY_BUFFER, instanced = 0} = {}) {
    this.bufferID = bufferID;
    this.size = size;
    this.instanced = instanced;
  }
}
/* The base class, RenderableMesh */
export class RenderableMesh {
  constructor({mesh, renderer, textures = []}) {
    console.log('RenderableMesh.constructor()');
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
    this._numberOfVertices = 0;

    // Number of instances
    this._numberOfInstances = 0;

    // Model matrix for moving the mesh easier
    // Mesh space stuff, such as rotation, scaling probably will happen here
    this._modelMatrix = mesh.modelMatrix;

    this.lightLocations = new Float32Array(3 * 16);

    // default program
    this._programID = 'default';

    this._uint32Indices = false;

    this._shaderFlags = {};

    if (mesh.shaderFlags !== undefined) {
      this._shaderFlags = mesh.shaderFlags;
    }

    this._numberOfInstances = mesh.numberOfInstances;

    for (const property of mesh.properties.values()) {
      const attributeID = property.attributeID;
      // index buffer requires special handling
      if (attributeID === 'index') {
        this.attributes.set(
          attributeID,
          new VertexAttribute({
            bufferID: this.renderer.bufferManager.newBuffer({
              id: `${mesh.id}.${attributeID}`,
              data: property.hostData,
              size: 1,
              target: GL.ELEMENT_ARRAY_BUFFER,
              instanced: 0
            }),
            size: 1,
            instanced: 0
          })
        );

        this._numberOfVertices = property.hostData.length;

      } else {
        this.attributes.set(
          attributeID,
          new VertexAttribute({
            bufferID: this.renderer.bufferManager.newBuffer({
              id: `${mesh.id}.${attributeID}`,
              data: property.hostData,
              size: property.size,
              instanced: property.instanced
            }),
            size: property.size,
            instanced: property.instanced
          })
        );
      }
    }

    // const initialColor = new Uint8Array(28 * 28 * 4);
    // for (let i = 0; i < initialColor.length / 4; i++) {
    //   initialColor[i * 4 + 0] = i / initialColor.length * 4 * 255;
    //   initialColor[i * 4 + 1] = i / initialColor.length * 4 * 255;
    //   initialColor[i * 4 + 2] = i / initialColor.length * 4 * 255;
    //   initialColor[i * 4 + 3] = 255;
    // }

    for (let i = 0; i < mesh.textures.length; i++) {
      if (this.renderer.textureManager.hasTexture(mesh.textures[i].id)) {
        this.textures.set(mesh.textures[i].target, mesh.textures[i].id);
      }
    }
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
    this.getProgramByID(this._programID).use();

    this.getProgramByID(this._programID).setUniforms({
      modelMatrix: this._modelMatrix
    });

    this.getProgramByID(this._programID).setUniforms({
      viewProjectionMatrix: cameraUniforms.viewProjectionMatrix,
      viewMatrix: cameraUniforms.viewMatrix
    });

    this.getProgramByID(this._programID).setUniforms({
      cameraPos: cameraUniforms.cameraPosition
    });

    const textures = {};
    for (const key of this.textures.keys()) {
      textures[key] = this.getTextureByID(key);
    }

    this.getProgramByID(this._programID).setUniforms(textures);

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

    this.getProgramByID(this._programID).setUniforms({
      lightDirection: this.lightLocations
    });

    const buffers = {};
    for (const key of this.attributes.keys()) {
      buffers[key] = this.getVertexAttributeBufferByID(key);
    }

    this.getProgramByID(this._programID).setBuffers(buffers);

  }

  updateAttribute({attributeID, attributeData}) {
    const buffer = this.getVertexAttributeBufferByID(attributeID);
    buffer.setData({data: attributeData, size: this.attributes.get(attributeID).size, target: GL.ARRAY_BUFFER, instanced: this.attributes.get(attributeID).instanced});
  }
}
