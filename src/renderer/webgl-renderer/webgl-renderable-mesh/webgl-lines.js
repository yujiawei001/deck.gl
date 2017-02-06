import {WebGLRenderableMesh} from './webgl-renderable-mesh';
import {VertexAttribute} from '../../renderable-mesh';

import {GL} from '../../luma.gl2/webgl2';

// Geometries that knows how to render itself
export default class WebGLLines extends WebGLRenderableMesh {
  constructor({lines, renderer}) {
    super({mesh: lines, renderer});
    this._numberOfPrimitives = lines.properties.get('index').hostData.length / 2;

    this.attributes.set(
      'color',
      new VertexAttribute({
        bufferID: this.renderer.bufferManager.newBuffer({
          id: `${lines.id}.color`,
          data: lines.properties.get('color').hostData,
          size: 4
        }),
        size: 4,
        instanced: 0
      })
    );

    this.width = lines.width;
  }

  render(cameraUniforms) {
    super.render(cameraUniforms);
    this.renderer.glContext.lineWidth(this.width);
    // Not sure with line width doesn't work on Chrome
    // console.log('line width:', this.renderer.glContext.getParameter(this.renderer.glContext.LINE_WIDTH));
    if (this._uint32Indices === true) {
      this.renderer.glContext.drawElements(GL.LINES, this._numberOfPrimitives * 2, GL.UNSIGNED_INT, 0);
    } else {
      this.renderer.glContext.drawElements(GL.LINES, this._numberOfPrimitives * 2, GL.UNSIGNED_SHORT, 0);
    }
  }
}
