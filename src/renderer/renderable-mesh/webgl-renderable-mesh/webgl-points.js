import {WebGLRenderableMesh} from './webgl-renderable-mesh';
import {GL} from '../../luma.gl2/webgl2';

export default class WebGLPoints extends WebGLRenderableMesh {
  constructor({mesh, renderer}) {
    super({mesh, renderer});
  }

  render(cameraUniforms) {
    super.render(cameraUniforms);
    if (this.uint32Indices === true) {
      this.renderer.glContext.drawElements(GL.POINTS, this.numberOfVertices, GL.UNSIGNED_INT, 0);
    } else {
      this.renderer.glContext.drawElements(GL.POINTS, this.numberOfVertices, GL.UNSIGNED_SHORT, 0);
    }
  }
}
