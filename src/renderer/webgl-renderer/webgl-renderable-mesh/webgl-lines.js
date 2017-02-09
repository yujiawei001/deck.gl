import {WebGLRenderableMesh} from './webgl-renderable-mesh';

import {GL} from '../../luma.gl2/webgl2';

// Geometries that knows how to render itself
export default class WebGLLines extends WebGLRenderableMesh {
  constructor({lines, renderer}) {
    super({mesh: lines, renderer});
    this.width = lines.width;
  }

  render(cameraUniforms) {
    super.render(cameraUniforms);
    this.renderer.glContext.lineWidth(this.width);
    // Not sure with line width doesn't work on Chrome
    // console.log('line width:', this.renderer.glContext.getParameter(this.renderer.glContext.LINE_WIDTH));
    if (this._uint32Indices === true) {
      this.renderer.glContext.drawElements(GL.LINES, this._numberOfVertices, GL.UNSIGNED_INT, 0);
    } else {
      this.renderer.glContext.drawElements(GL.LINES, this._numberOfVertices, GL.UNSIGNED_SHORT, 0);
    }
  }
}
