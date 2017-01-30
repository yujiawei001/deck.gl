// All RenderableMesh objects know how to render itself

/* TODO: complete all WebGL2 primitives: WebGL2Triangles,
WebGL2Lines, WebGL2Points, WebGL2InstancedTriangles */

/* TODO: use uniform buffer object for webgl 2 renderer
*/

import {RenderableMesh} from '../../renderable-mesh';

export class WebGL2RenderableMesh extends RenderableMesh {
  constructor({mesh, renderer}) {
    super({mesh, renderer});

    if (mesh.properties.get('index').hostData instanceof Uint32Array) {
      this._uint32Indices = true;
    }
  }
}
