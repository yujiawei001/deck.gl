import {WebGLRenderableMesh} from './webgl-renderable-mesh';
import {GL} from '../../luma.gl2/webgl2';

export default class WebGLTriangles extends WebGLRenderableMesh {
  constructor({triangles, renderer}) {
    super({mesh: triangles, renderer});
    this._numberOfPrimitives = triangles.properties.get('index').hostData.length / 3;

    if (this.textures.size !== 0) {
      const vsSource = `\
      attribute vec3 position;
      attribute vec4 color;
      attribute vec2 texCoords;

      uniform mat4 modelMatrix;
      uniform mat4 viewProjectionMatrix;

      varying vec4 vColor;
      varying vec2 vTexCoords;

      void main(void) {
        vec4 position_clipspace = viewProjectionMatrix * modelMatrix * vec4(position, 1.0);
        vColor = color;
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
      uniform sampler2D uSampler;

      void main(void) {
        vec4 texVal = texture2D(uSampler, vTexCoords);
        gl_FragColor = vec4(texVal.xyzw);
      }
      `;

      this._programID = this.renderer.programManager.newProgramFromShaders({
        vsSource,
        fsSource,
        id: 'textured_triangles_program'
      });
    }
  }

  render(cameraUniforms) {
    super.render(cameraUniforms);

    this.getProgramByID(this._programID).setUniforms({
      viewProjectionMatrix: cameraUniforms.viewProjectionMatrix
    });

    if (this.textures.size !== 0) {
      // TODO: hard coded
      const tex = this.renderer.textureManager.getTexture('digit');
      this.getProgramByID(this._programID).setUniforms({
        uSampler: tex
      });
    }
    if (this._uint32Indices === true) {
      this.renderer.glContext.drawElements(GL.TRIANGLES, this._numberOfPrimitives * 3, GL.UNSIGNED_INT, 0);
    } else {
      this.renderer.glContext.drawElements(GL.TRIANGLES, this._numberOfPrimitives * 3, GL.UNSIGNED_SHORT, 0);
    }
  }
}
