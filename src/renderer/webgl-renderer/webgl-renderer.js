import {Renderer} from '../renderer';
import {BufferManager} from '../buffer-manager';
import {CameraManager} from '../camera-manager';
import {FramebufferManager} from '../framebuffer-manager';
import {ProgramManager} from '../program-manager';
import {TextureManager} from '../texture-manager';
import {createGLContext} from 'luma.gl';

// On screen WebGL renderer
export default class WebGLRenderer extends Renderer {
  constructor({controller, canvas, debug, glOptions}) {
    super({controller, canvas, debug, glOptions});

    try {
      this.glContext = createGLContext({
        canvas: this.currentCanvas,
        debug: debug,
        ...this.contextOptions
      });
      console.log("WebGL context successfully created: ", this.glContext);
    } catch (error) {
      console.log("Context creation failed");
      console.log("error: ", error);
      return;
    }

    // Initial WebGL states
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
