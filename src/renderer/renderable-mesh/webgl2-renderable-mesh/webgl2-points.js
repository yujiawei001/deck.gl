import {WebGL2RenderableMesh} from './webgl2-renderable-mesh';
import {GL} from '../../luma.gl2/webgl2';

export default class WebGL2Points extends WebGL2RenderableMesh {
  constructor({points, renderer}) {
    super({mesh: points, renderer});
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
