import {WebGL2RenderableMesh} from './webgl2-renderable-mesh';
import {VertexAttribute} from '../../renderable-mesh';

import {GL} from '../../luma.gl2/webgl2';

export default class WebGL2InstancedTriangle extends WebGL2RenderableMesh {
  constructor({instancedTriangleMesh, renderer}) {
    super({mesh: instancedTriangleMesh, renderer});

    this._numberOfPrimitives = instancedTriangleMesh.properties.get('index').hostData.length / 3;
    // Additional properties and properties required for instanced drawing
    this._numberOfInstances = instancedTriangleMesh.properties.get('instancedPosition').hostData.length / 3;

    // All renderable mesh need to have vertice position, texture coords, vertex color and vertex indices

    this.attributes.set(
      'instancedPosition',
      new VertexAttribute({
        bufferID: this.renderer.bufferManager.newBuffer({
          data: instancedTriangleMesh.properties.get('instancedPosition').hostData,
          size: 3,
          instanced: 1,
          id: `${instancedTriangleMesh.id}.instancedPosition`
        }),
        size: 3,
        instanced: 1
      })
    );

    this.attributes.set(
      'instancedColor',
      new VertexAttribute({
        bufferID: this.renderer.bufferManager.newBuffer({
          data: instancedTriangleMesh.properties.get('instancedColor').hostData,
          size: 4,
          instanced: 1,
          id: `${instancedTriangleMesh.id}.instancedColor`
        }),
        size: 4,
        instanced: 1
      })
    );

    this.attributes.set(
      'instancedSize',
      new VertexAttribute({
        bufferID: this.renderer.bufferManager.newBuffer({
          data: instancedTriangleMesh.properties.get('instancedSize').hostData,
          size: 1,
          instanced: 1,
          id: `${instancedTriangleMesh.id}instancedSize`
        }),
        size: 1,
        instanced: 1
      })
    );

    // Standard instanced drawing shaders
    const vsSource = `\
    attribute vec3 position;
    attribute vec4 color;
    attribute vec2 texCoords;

    attribute vec3 instancedPosition;
    attribute vec4 instancedColor;
    attribute float instancedSize;

    uniform mat4 modelMatrix;
    uniform mat4 viewProjectionMatrix;

    varying vec4 vColor;
    varying vec2 vTexCoords;

    void main(void) {
      vec4 position_clipspace = viewProjectionMatrix * modelMatrix * vec4((position * instancedSize + instancedPosition), 1.0);
      vColor = instancedColor;
      //vColor = vec4(1.0, 0.5, 0.5, 1.0);
      vTexCoords = texCoords;
      gl_Position = position_clipspace;
    }
    `;

    const fsSource = `\
    #ifdef GL_ES
    precision highp float;
    #endif

    varying vec4 vColor;
    varying vec2 vTexCoords;

    void main(void) {
      gl_FragColor = vColor;
    }
    `;

    this._programID = this.renderer.programManager.newProgramFromShaders({
      vsSource,
      fsSource
    });
  }

  render(cameraUniforms) {
    super.render(cameraUniforms);

    if (this._uint32Indices === true) {
      this.renderer.glContext.drawElementsInstanced(
        GL.TRIANGLES, this._numberOfPrimitives * 3, GL.UNSIGNED_INT, 0, this._numberOfInstances
        );
    } else {
      this.renderer.glContext.drawElementsInstanced(
        GL.TRIANGLES, this._numberOfPrimitives * 3, GL.UNSIGNED_SHORT, 0, this._numberOfInstances
        );
    }
  }
}
