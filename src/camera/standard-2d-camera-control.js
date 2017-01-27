import {CameraControl} from './camera-control';
import {vec3} from 'gl-matrix';

export default class Standard2DCameraControl extends CameraControl {
  constructor({id, manager}) {
    super({id, manager});
    this.zoomAllowed = false;
  }

  setCamera(camera) {
    this.camera = camera;
    this.anchor = camera.aim;

  }

  disableZoom() {
    this.zoomAllowed = false;
  }

  enableZoom() {
    this.zoomAllowed = true;
  }

  moveAlong({direction, distance}) {
    const moveVector = vec3.create();
    vec3.scale(moveVector, direction, distance);

    const newPos = vec3.create();
    const aimDirection = this.camera.getDirection();
    vec3.add(newPos, this.camera.getPos(), moveVector);
    this.moveTo({pos: newPos});
    this.setDirection({direction: aimDirection})
  }

  move({deltaX, deltaY}) {
    const newPos = vec3.create();
    const newAim = vec3.create();

    const moveVector = vec3.fromValues(deltaX, deltaY, 0);
    vec3.subtract(newPos, this.camera.getPos(), moveVector);
    vec3.subtract(newAim, this.camera.getAim(), moveVector);
    this.moveTo({pos: newPos, aim: newAim});
  }

  moveTo({pos, aim}) {
    this.camera.setPos({pos});
    if (aim !== undefined) {
      this.camera.setAim({aim});
    }
  }

  setDirection({direction}) {
    this.camera.setDirection({direction});
  }

  processAction(action) {

    switch (action.type) {
    case 'wheel':
      if (this.zoomAllowed === true) {
        let pickingRay = this.manager.renderer.currentPickingRay;
        if (pickingRay === null) {
          pickingRay = this.manager.renderer.getPickingRay([action.event.clientX, action.event.clientY]);
        }
        this.moveAlong({
          direction: pickingRay.direction,
          distance: -action.event.deltaY
        });
      }
      break;
    case 'drag':
      // Safari event doesn't have movementX and movementY property
      // TODO
//        console.log("drag event", event);
      // This AxisCameraRatio thing is a hack and should be removed
      this.move({
        deltaX: action.event.movementX * action.standard2DCameraRatio, deltaY: action.event.movementY * action.standard2DCameraRatio
      });
      // console.log("movementY: ", -action.event.movementY);
      break;
    default:
      break;
    }
  }



}
