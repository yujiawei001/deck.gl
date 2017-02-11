import {GL} from '../luma.gl2/webgl2';

export class VertexAttribute {
  constructor({bufferID, size, target = GL.ARRAY_BUFFER, instanced = 0} = {}) {
    this.bufferID = bufferID;
    this.size = size;
    this.instanced = instanced;
  }
}
