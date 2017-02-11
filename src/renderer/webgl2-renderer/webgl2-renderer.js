import {Renderer} from '../renderer';
import {BufferManager} from '../buffer-manager';
import {CameraManager} from '../camera-manager';
import {FramebufferManager} from '../framebuffer-manager';
import {ProgramManager} from '../program-manager';
import {TextureManager} from '../texture-manager';

import {createGLContext} from 'luma.gl';

// On screen WebGL2 renderer
export default class WebGL2Renderer extends Renderer {
  constructor({controller, canvas, debug, glOptions}) {
    super({controller, canvas, debug, glOptions});

    const webgl2 = true;
    try {
      this.glContext = createGLContext({
        canvas: this.currentCanvas,
        debug: debug,
        webgl2: webgl2,
        ...this.contextOptions
      });
      console.log("WebGL2 context successfully created: ", this.glContext);
    } catch (error) {
      console.log("Context creation failed");
      console.log("error: ", error);
      return;
    }

    // Initial WebGL states
    // const gl = this.glContext;

    // gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    // gl.enable(gl.DEPTH_TEST);
    // gl.enable(gl.CULL_FACE);
    // gl.frontFace(gl.CCW);
    // gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // These are rendering resource managers.
    this.bufferManager = new BufferManager(this);
    this.textureManager = new TextureManager(this);
    this.programManager = new ProgramManager(this);

    /* We should have a camera manager here to handle all abstract camera from the container class.
    More importantly, we should have auxillary cameras for rendering advanced effects like shadows.
    It's not implemented yet. Right now, the renderer just take abstract camera from the container class.
    */

    this.cameraManager = new CameraManager(this);
    this.framebufferManager = new FramebufferManager(this);
  }
}
