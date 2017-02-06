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
  constructor({mesh, renderer}) {
    console.log('WebGL2Renderable.constructor()');
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
    this._numberOfPrimitives = 0;

    // Number of instances
    this._numberOfInstances = 0;

    // Model matrix for moving the mesh easier
    // Mesh space stuff, such as rotation, scaling probably will happen here
    this._modelMatrix = mesh.modelMatrix;

    this.lightLocations = new Float32Array(3 * 16);
    // default program
    this._programID = this.renderer.programManager.getDefaultProgramID();

    this._uint32Indices = false;

    // All renderable mesh need to have vertice position, texture coords, vertex color and vertex indices
    this.attributes.set(
      'vertices',
      new VertexAttribute({
        bufferID: this.renderer.bufferManager.newBuffer({
          id: `${mesh.id}.vertices`,
          data: mesh.properties.get('vertices').hostData,
          size: 3
        }),
        size: 3,
        instanced: 0
      })
    );

    this.attributes.set(
      'normals',
      new VertexAttribute({
        bufferID: this.renderer.bufferManager.newBuffer({
          id: `${mesh.id}.normals`,
          data: mesh.properties.get('normals').hostData,
          size: 3
        }),
        size: 3,
        instanced: 0
      })
    );

    this.attributes.set(
      'texCoords',
      new VertexAttribute({
        bufferID: this.renderer.bufferManager.newBuffer({
          id: `${mesh.id}.texCoords`,
          data: mesh.properties.get('texCoords').hostData,
          size: 2
        }),
        size: 2,
        instanced: 0
      })
    );

    this.attributes.set(
      'index',
      new VertexAttribute({
        bufferID: this.renderer.bufferManager.newBuffer({
          id: `${mesh.id}.index`,
          data: mesh.properties.get('index').hostData,
          target: GL.ELEMENT_ARRAY_BUFFER
        }),
        size: 1,
        instanced: 0
      })
    );

    // const initialColor = new Uint8Array(28 * 28 * 4);
    // for (let i = 0; i < initialColor.length / 4; i++) {
    //   initialColor[i * 4 + 0] = i / initialColor.length * 4 * 255;
    //   initialColor[i * 4 + 1] = i / initialColor.length * 4 * 255;
    //   initialColor[i * 4 + 2] = i / initialColor.length * 4 * 255;
    //   initialColor[i * 4 + 3] = 255;
    // }

    // for (let i = 0; i < mesh.textures.length; i++) {
    //   this.textures.set(mesh.textures[i].id, {
    //     textureID: this.renderer.textureManager.newTexture({
    //       id: mesh.textures[i].id,
    //       width: mesh.textures[i].width,
    //       height: mesh.textures[i].height,
    //       data: initialColor
    //     })
    //   });
    // }

  }

  // Convenient function for communicating with resource managers
  getBufferByID(id) {
    if (this.attributes.get(id) !== undefined) {
      return this.renderer.bufferManager.getBufferByID(this.attributes.get(id).bufferID);
    }
    return undefined;
  }

  getProgramByID(id) {
    return this.renderer.programManager.getProgram(id);
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
      cameraPos: cameraUniforms.cameraPosition,
    });

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
      buffers[key] = this.getBufferByID(key);
    }
    this.getProgramByID(this._programID).setBuffers(buffers);

  }

  updateAttribute({attributeID, attributeData}) {
    const buffer = this.getBufferByID(attributeID);
    buffer.setData({data: attributeData, size: this.attributes.get(attributeID).size, target: GL.ARRAY_BUFFER, instanced: this.attributes.get(attributeID).instanced});
  }
}
