// All RenderableMesh objects know how to render itself
/* TODO: complete all WebGL primitives: WebGLTriangles, WebGLLines, WebGLPoints, WebGLTriangless */

import {RenderableMesh} from '../../renderable-mesh';

export class WebGLRenderableMesh extends RenderableMesh {
  constructor({mesh, renderer}) {
    super({mesh, renderer});
    if (mesh.properties.get('index').hostData instanceof Uint32Array) {
      const supported = this.renderer.glContext.getExtension('OES_element_index_uint');
      if (supported === null) {
        console.log(`OES_element_index_uint not supported.
          Please check the type of your vertex indices array!!!`);
      } else {
        this._uint32Indices = true;
      }
    }
  }

}
