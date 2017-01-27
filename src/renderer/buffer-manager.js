import {Buffer} from './luma.gl2/buffer';
import {GL} from './luma.gl2/webgl2';
// import {Buffer, GL} from 'luma.gl';

export class BufferManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.buffers = new Map();
  }

  newBuffer({data, size, target = GL.ARRAY_BUFFER, instanced = 0, id = '', usage = 'in'}) {
    let bufferTarget = target;
    if (usage === 'out') {
        bufferTarget = 0x8C8E; // we need WebGL2 constants
    }
    const buffer = new Buffer(this.renderer.glContext, {id});
    buffer.setData({data, size, target: bufferTarget, instanced});
    this.buffers.set(id, buffer);
    return id;
  }

  getBufferByID(id) {
    return this.buffers.get(id);
  }

}
