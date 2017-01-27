import {Camera, CameraTarget, ArcRotateCameraControl, FixedCameraControl, Standard2DCameraControl} from '../camera';

class RendererCamera {
  constructor({camera, control, target}) {
    this.camera = camera;
    this.cameraControl = control;
    this.cameraTarget = target;
  }
  attachControl({control}) {
    this.cameraControl = control;
  }
  attachTarget({target}) {
    this.cameraTarget = target;
  }
  detachTarget() {
    this.cameraTarget = undefined;
  }
}
/* Camera management
From renderer's point of view, a camera is just a set of
transformation matrices and a render target that receives
most of interactive commands from the user */
export class CameraManager {
  constructor(renderer) {
    this.renderer = renderer;
    // stores RendererCamera objects
    this.cameras = new Map();
    // active camera
    this.activeCameraID = 'default-cam';
  }

  newCamera({id = 'default-cam', pos, aim, up, fovY, aspect, near, far, type, targetID, corner = 'bottom-left', controlType = 'fixed'}) {
    const camera = new Camera({
      id,
      pos,
      aim,
      up,
      fovY,
      aspect,
      near,
      far,
      type: 'perspective'
    });

    const cameraTarget = this.createCameraTarget({
      id: id + '_target',
      targetID,
      corner
    });

    const cameraControl = this.createCameraControl({
      id: id + '_control',
      manager: this,
      type: controlType,
      camera
    });

    const rendererCamera = new RendererCamera({
      camera,
      control: cameraControl,
      target: cameraTarget
    });

    this.cameras.set(id, rendererCamera);
  }

  createCameraTarget({id, targetID, corner}) {
    const vertexAttributes = new Map();
    let targetWidth = this.renderer.currentCanvas.width;
    let targetHeight = this.renderer.currentCanvas.height;

    if (targetID !== undefined) {
      // Also be awared that we are acutally looking at the "back" face of this on-screen quad, since left hand coord is used for NDC space
      const tex = this.renderer.framebufferManager.getFramebufferTextureByID(targetID);
      targetWidth = tex.width;
      targetHeight = tex.height;

      const w = targetWidth / this.renderer.currentCanvas.width;
      const h = targetHeight / this.renderer.currentCanvas.height;

      const origin = [0, 0];
      switch (corner) {
      case 'bottom-left':
        origin[0] = -1;
        origin[1] = -1;
        break;
      case 'top-left':
        origin[0] = -1;
        origin[1] = 1 - 2 * h;
        break;
      case 'top-right':
        origin[0] = 1 - 2 * w;
        origin[1] = 1 - 2 * h;
        break;
      case 'bottom-right':
        origin[0] = 1 - 2 * w;
        origin[1] = -1;
        break;
      default:
        origin[0] = -1;
        origin[1] = -1;
      }

      vertexAttributes.set(
        'position',
        {
          bufferID: this.renderer.bufferManager.newBuffer({
            id: id + '_vertex_position',
            data: new Float32Array([origin[0], origin[1], 0, origin[0] + 2 * w, origin[1], 0, origin[0], origin[1] + 2 * h, 0, origin[0] + 2 * w, origin[1] + 2 * h, 0]),
            size: 3
          }),
          size: 3,
          instanced: 0
        }
      );

      vertexAttributes.set(
        'texCoords',
        {
          bufferID: this.renderer.bufferManager.newBuffer({
            id: id + '_tex_coord',
            data: new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]),
            size: 2
          }),
          size: 2,
          instanced: 0
        }
      );

      vertexAttributes.set(
        'index',
        {
          bufferID: this.renderer.bufferManager.newBuffer({
            id: id + '_vertex_index',
            data: new Uint16Array([0, 2, 1, 2, 3, 1]),
            size: 2,
            target: this.renderer.glContext.ELEMENT_ARRAY_BUFFER
          }),
          size: 2,
          instanced: 0
        }
      );
    }

    const clearColor = [0.0, 0.0, 0.2, 1.0];

    // Hack...TODO: expose camera control APIs to controller in
    // a sanity way
    if (id === 'axis-cam') {
      cameraTarget.clearColor = [0.1, 0.1, 0.1, 1.0];
    } else if (id === 'digit-cam') {
      cameraTarget.clearColor = [0.1, 0.1, 0.3, 1.0];
    }

    return new CameraTarget({
      targetID,
      vertexAttributes,
      clearColor,
      width: targetWidth,
      height: targetHeight
    });
  }

  createCameraControl({id, manager, type, camera}) {
    let cameraControl;
    switch(type) {
      case 'arc-rotate':
        cameraControl = new ArcRotateCameraControl({
          id,
          manager: this,
          type
        });
        cameraControl.setCamera(camera);
        cameraControl.disableRadialMovement();
      break;
      case 'target':
        cameraControl = new ArcRotateCameraControl({
          id,
          manager: this,
          type
        });
        cameraControl.setCamera(camera);
      break;
      case 'standard-2d':
        cameraControl = new Standard2DCameraControl({
          id,
          manager: this,
          type
        });
        cameraControl.setCamera(camera);
        cameraControl.enableZoom();
      break;
      case 'free':
        console.log('free camera not implemented yet!');
        assert(false);
      break;
      case 'fixed':
        cameraControl = new FixedCameraControl({
          id,
          manager: this,
          type
        });
      break;
      default:
      break;
    }

    return cameraControl;
  }

  getCameraAndSetTarget(id) {
    const rendererCamera = this.cameras.get(id);
    const cameraTarget = rendererCamera.cameraTarget;
    this.renderer.framebufferManager.bindFramebuffer(cameraTarget.targetID, cameraTarget.clearColor);
    return rendererCamera.camera;
  }

  getRenderCamera(id) {
    return this.cameras.get(id);
  }

  getCamera(id) {
    return this.cameras.get(id).camera;
  }

  getCameraControl(id) {
    return this.cameras.get(id).cameraControl;
  }

  getTargetTexture(id) {
    const cameraTarget = this.cameras.get(id).cameraTarget;
    return this.renderer.framebufferManager.getFramebufferTextureByID(cameraTarget.targetID);
  }

  getBuffer(cameraID, attribute) {
    const bufferID = this.cameras.get(cameraID).cameraTarget.vertexAttributes.get(attribute).bufferID;
    return this.renderer.bufferManager.getBufferByID(bufferID);
  }

  setDefaultCameraID(cameraID) {
    this.activeCameraID = cameraID;
  }

  processAction(action) {
    const receivingCamera = this.getRenderCameraForScreenCoord();
    // HACK: need to figure this out

    const standard2DCameraRatio = -Math.tan(receivingCamera.camera.fovY) * receivingCamera.camera.getPos()[2] / receivingCamera.cameraTarget.width;
    action.standard2DCameraRatio = standard2DCameraRatio;
    receivingCamera.cameraControl.processAction(action);

    // HACK!! we have to modify the movementX / movementY value for axis-cam to sync with default cam
    // TODO: we should  have an API to lock one camera to another
    if (this.cameras.get('axis-cam') !== undefined) {
      const AxisCameraRatio = this.cameras.get('axis-cam').camera.getDistanceToAim() / this.cameras.get(this.activeCameraID).camera.getDistanceToAim();
      action.AxisCameraRatio = AxisCameraRatio;
      this.cameras.get('axis-cam').cameraControl.processAction(action);
    }
    this.renderer.needsRedraw = true;
  }

  getRenderCameraForScreenCoord({screenCoord} = {}) {
    return this.getRenderCamera(this.activeCameraID);
  }
}
