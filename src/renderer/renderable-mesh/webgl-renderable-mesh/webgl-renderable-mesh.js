// All RenderableMesh objects know how to render itself
/* TODO: complete all WebGL primitives: WebGLTriangles, WebGLLines, WebGLPoints, WebGLTriangless */

import {RenderableMesh} from '../renderable-mesh';

export class WebGLRenderableMesh extends RenderableMesh {
  constructor({mesh, renderer}) {
    super({mesh, renderer});
  }
}
