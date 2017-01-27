import {CameraControl} from './camera-control';
import {vec3} from 'gl-matrix';

export default class ArcRotateCameraControl extends CameraControl {
  constructor({id, manager}) {
    super({id, manager});
    this.inertia = 3.0;
    this.radialMovement = true;
  }

  setCamera(camera) {
    this.camera = camera;
    this.anchor = camera.aim;
  }

  disableRadialMovement() {
    this.radialMovement = false;
  }

  enableRadialMovement() {
    this.radialMovement = true;
  }
  moveTowardsAnchor({distance}) {
    this.moveTowards({
      target: this.anchor,
      distance: distance / this.inertia
    })
  }

  moveAlong({direction, distance}) {
    const moveVector = vec3.create();
    vec3.normalize(moveVector, direction);
    vec3.scale(moveVector, moveVector, distance);

    let newPos = vec3.create();
    vec3.add(newPos, this.camera.getPos(), moveVector);
    this.moveTo({target: newPos});
  }

  moveTowards({target, distance}) {
    const moveVector = vec3.create();
    vec3.subtract(moveVector, this.camera.getPos(), target);
    vec3.normalize(moveVector, moveVector);
    vec3.scale(moveVector, moveVector, distance);

    let newPos = vec3.create();
    vec3.add(newPos, this.camera.getPos(), moveVector);
    this.moveTo({target: newPos});
  }

  moveTo({target}) {
    this.camera.setPos({pos: target});
  }

  moveWest({arcLength}) {
    const radius = vec3.distance(this.anchor, this.camera.getPos());
    const angle = arcLength / this.inertia / radius;

    const newPos = vec3.create();
    vec3.rotateY(newPos, this.camera.getPos(), this.anchor, angle);
    this.moveTo({target: newPos});
  }

  moveNorth({arcLength}) {
    const currentPos = this.camera.getPos();
    if (currentPos[2] > 0) {
      arcLength = -arcLength;
    }
    const radius = vec3.distance(this.anchor, currentPos);
    const angle = arcLength / this.inertia / radius;

    let newPos = vec3.create();
    vec3.rotateX(newPos, currentPos, this.anchor, angle);
    this.moveTo({target: newPos});
  }

  processAction(action) {

    switch (action.type) {
    case 'wheel':
      if (this.radialMovement === true) {
        this.moveTowardsAnchor({
          distance: -action.event.deltaY
        });
      }
      break;
    case 'drag':
      // Safari event doesn't have movementX and movementY property
      // TODO
//        console.log("drag event", event);
      this.moveWest({
        arcLength: action.event.movementX * action.AxisCameraRatio
      });
      this.moveNorth({
        arcLength: -action.event.movementY * action.AxisCameraRatio
      });
      // console.log("movementY: ", -action.event.movementY);
      break;
    default:
      break;
    }
  }



}
