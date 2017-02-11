import {WebGL2RenderableMesh} from './webgl2-renderable-mesh';
import {VertexAttribute} from '../../renderable-mesh';

import {GL} from '../../luma.gl2/webgl2';

export default class WebGL2Triangles extends WebGL2RenderableMesh {
  constructor({TriangleMesh, renderer}) {
    super({mesh: triangles, renderer});

    // Additional properties and properties required for instanced drawing
    this.numberOfInstances = triangles.properties.get('position').hostData.length / 3;

    // All renderable mesh need to have vertice position, texture coords, vertex color and vertex indices

    this.attributes.set(
      'position',
      new VertexAttribute({
        bufferID: this.renderer.bufferManager.newBuffer({
          data: triangles.properties.get('position').hostData,
          size: 3,
          instanced: 1,
          id: `${triangles.id}.position`
        }),
        size: 3,
        instanced: 1
      })
    );

    this.attributes.set(
      'color',
      new VertexAttribute({
        bufferID: this.renderer.bufferManager.newBuffer({
          data: triangles.properties.get('color').hostData,
          size: 4,
          instanced: 1,
          id: `${triangles.id}.color`
        }),
        size: 4,
        instanced: 1
      })
    );

    this.attributes.set(
      'size',
      new VertexAttribute({
        bufferID: this.renderer.bufferManager.newBuffer({
          data: triangles.properties.get('size').hostData,
          size: 1,
          instanced: 1,
          id: `${triangles.id}.size`
        }),
        size: 1,
        instanced: 1
      })
    );

    // Standard instanced drawing shaders
    const vsSource = `\
    attribute vec3 vertices;
    attribute vec2 texCoords;

    attribute vec3 position;
    attribute vec4 color;
    attribute float size;

    uniform mat4 modelMatrix;
    uniform mat4 viewProjectionMatrix;

    varying vec4 vColor;
    varying vec2 vTexCoords;

    void main(void) {
      vec4 position_clipspace = viewProjectionMatrix * modelMatrix * vec4((vertices * size + position), 1.0);
      vColor = color;
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

    this.programID = this.renderer.programManager.newProgramFromShaders({
      vsSource,
      fsSource
    });
  }

  render(cameraUniforms) {
    super.render(cameraUniforms);

    if (this.uint32Indices === true) {
      this.renderer.glContext.drawElementsInstanced(
        GL.TRIANGLES, this.numberOfVertices, GL.UNSIGNED_INT, 0, this.numberOfInstances
        );
    } else {
      this.renderer.glContext.drawElementsInstanced(
        GL.TRIANGLES, this.numberOfVertices, GL.UNSIGNED_SHORT, 0, this.numberOfInstances
        );
    }
  }
}
