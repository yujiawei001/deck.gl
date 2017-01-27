// Stub implementation for the fixed camera control
import {CameraControl} from './camera-control';
export default class FixedCameraControl extends CameraControl {
  constructor({id, manager, camera}) {
    super({id, manager});
    this.camera = camera;
  }

  processAction(action) {
  }
}
