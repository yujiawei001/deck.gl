import {Framebuffer} from './luma.gl2/framebuffer';
import {GL} from './luma.gl2/webgl2';

export class FramebufferManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.defaultFramebufferWidth = renderer.currentCanvas.width;
    this.defaultFramebufferHeight = renderer.currentCanvas.height;

    this.framebuffers = new Map();
  }

  newFramebuffer({id, width, height}) {
    const framebuffer = new Framebuffer(this.renderer.glContext, {width, height});
    this.framebuffers.set(
      id, framebuffer
    );
    return id;
  }

  getFramebufferTextureByID(id) {
    return this.framebuffers.get(id).texture;
  }
  getFramebufferByID(id) {
    return this.framebuffers.get(id);
  }

  bindFramebuffer(id, clearColor) {
    const gl = this.renderer.glContext;
    if (id === null) {
      gl.bindFramebuffer(GL.FRAMEBUFFER, null);
      gl.clearColor(1.0, 0.0, 0.0, 1.0);
      gl.enable(gl.DEPTH_TEST);
      gl.viewport(0, 0, this.defaultFramebufferWidth, this.defaultFramebufferHeight);
      // gl.enable(gl.CULL_FACE);
      // gl.frontFace(gl.CCW);
    } else {
      const framebuffer = this.framebuffers.get(id);
      framebuffer.bind();
      gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
      gl.enable(gl.DEPTH_TEST);
      gl.viewport(0, 0, framebuffer.texture.width, framebuffer.texture.height);
      // gl.enable(gl.CULL_FACE);
      // gl.frontFace(gl.CCW);
    }
    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    // gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.CULL_FACE);
    // gl.frontFace(gl.CCW);
    // gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  }
  // outputContent(ID) {
  //   if (ID === -1) {
  //     this.renderer.glContext.bindFramebuffer(this.renderer.glContext.FRAMEBUFFER, null);
  //   } else {
  //     this.framebuffers[ID].bind();
  //   }
  //   var data = new Uint8Array(16 * 16 * 4);
  //   this.renderer.glContext.readPixels(0, 0, 16, 16, this.renderer.glContext.RGBA, this.renderer.glContext.UNSIGNED_BYTE, data);
  //   console.log("framebuffer content: ", data);
  // }

}
