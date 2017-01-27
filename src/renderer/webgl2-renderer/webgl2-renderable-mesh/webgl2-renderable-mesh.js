// All RenderableMesh objects know how to render itself
// Probably WebGL2Triangles, WebGL2Lines, WebGL2Points, WebGL2Quads and their instanced counterparts will suffice right now

/* The base class, RenderableMesh
This is
*/
import {GL} from '../../luma.gl2/webgl2';

export class WebGL2RenderableMesh {
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
    this._vertexAttributes = new Map();

    // Number of primitives depends on what kind of primitive this mesh holds
    this._numberOfPrimitives = 0;

    this._modelMatrix = mesh.modelMatrix;

    this.lightLocations = new Float32Array(3 * 16);

    // Model matrix for moving the mesh easier
    // Mesh space stuff, such as rotation, scaling probably will happen here
    this._modelMatrix = mesh.modelMatrix;

    // default program
    this._programID = this.renderer.programManager.getDefaultProgramID();

    this._uint32Indices = false;

    // All renderable mesh need to have vertice position, texture coords, vertex color and vertex indices
    this._vertexAttributes.set(
      'position',
      {
        bufferID: this.renderer.bufferManager.newBuffer({
          id: mesh.id + '_vertex_position',
          data: mesh.properties.get('position').hostData,
          size: 3
        }),
        size: 3,
        instanced: 0
      }
    );

    this._vertexAttributes.set(
      'normals',
      {
        bufferID: this.renderer.bufferManager.newBuffer({
          id: mesh.id + '_vertex_normal',
          data: mesh.properties.get('normals').hostData,
          size: 3
        }),
        size: 3,
        instanced: 0
      }
    );

    this._vertexAttributes.set(
      'texCoords',
      {
        bufferID: this.renderer.bufferManager.newBuffer({
          id: mesh.id + '_vertex_tex_coord',
          data: mesh.properties.get('texCoords').hostData,
          size: 2
        }),
        size: 2,
        instanced: 0
      }
    );

    this._vertexAttributes.set(
      'color',
      {
        bufferID: this.renderer.bufferManager.newBuffer({
          id: mesh.id + '_vertex_color',
          data: mesh.properties.get('color').hostData,
          size: 4
        }),
        size: 4,
        instanced: 0
      }
    )

    this._vertexAttributes.set(
      'index',
      {
        bufferID: this.renderer.bufferManager.newBuffer({
          id: mesh.id + '_vertex_index',
          data: mesh.properties.get('index').hostData,
          target: this.renderer.glContext.ELEMENT_ARRAY_BUFFER
        }),
        size: 1,
        instanced: 0
      }
    );

    if (mesh.properties.get('index').hostData instanceof Uint32Array) {
      // const supported = this.renderer.glContext.getExtension('OES_element_index_uint');
      // if(supported === null) {
      //   console.log("OES_element_index_uint not supported. Please check the type of your vertex indices array!!!");
      // } else {
        this._uint32Indices = true;
      // }
    }

    const initialColor = new Uint8Array(28 * 28 * 4);
    for (let i = 0; i < initialColor.length / 4; i++) {
      initialColor[i * 4 + 0] = i / initialColor.length * 4 * 255;
      initialColor[i * 4 + 1] = i / initialColor.length * 4 * 255;
      initialColor[i * 4 + 2] = i / initialColor.length * 4 * 255;
      initialColor[i * 4 + 3] = 255
    }

    for (let i = 0; i < mesh.textures.length; i++) {
      this.textures.set(mesh.textures[i].id, {
        textureID: this.renderer.textureManager.newTexture({
          id: mesh.textures[i].id,
          width: mesh.textures[i].width,
          height: mesh.textures[i].height,
          data: initialColor
        })
      });
    }

 }

  // Convenient function for communicating with resource managers
  getBufferByID(id) {
    if (this._vertexAttributes.get(id) !== undefined) {
      return this.renderer.bufferManager.getBufferByID(this._vertexAttributes.get(id).bufferID);
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
      lightDirection: this.lightLocations,
    });
    const buffers = {};
    for (const [key, value] of this._vertexAttributes) {
      buffers[key] = this.getBufferByID(key);
    }
    this.getProgramByID(this._programID).setBuffers(buffers);

  }

  updateAttribute({attributeID, mesh}) {
    const buffer = this.getBufferByID(attributeID);
    buffer.setData({data: mesh.properties.get(attributeID).hostData, size: this._vertexAttributes.get(attributeID).size, target: GL.ARRAY_BUFFER, instanced: this._vertexAttributes.get(attributeID).instanced});
  }

}
