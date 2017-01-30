/*
Cameras

Just standard cameras right now
We need to have cameras that are compatible
with existing deck.gl viewport and maybe Mapbox viewport/camera

*/

import {vec3, mat4} from 'gl-matrix';
/*
These two matrices is all what a camera can do with rendering
*/
class CameraUniforms {
  constructor() {
    this.viewMatrix = null;
    this.projectionMatrix = null;
    this.viewProjectionMatrix = null;
    this.cameraPosition = null;
  }
}

/*
Camera can be perspective or orthogonal.
Camera is renderer specific. Camera object should
also indicating what target it wish to draw on
*/
export default class Camera {
  constructor({id, params, type}) {
    this.id = id;
    const {pos, aim, up, fovY, aspect, near, far} = params;

    this.pos = vec3.fromValues(pos[0], pos[1], pos[2]);
    this.aim = vec3.fromValues(aim[0], aim[1], aim[2]);
    this.up = vec3.fromValues(up[0], up[1], up[2]);
    this.fovY = fovY;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
    this.type = type;

    this.cameraUniforms = new CameraUniforms();
    this.transformMatricesUpdated = false;

    const viewMatrix = mat4.create();
    const projectionMatrix = mat4.create();
    const viewProjectionMatrix = mat4.create();

    this.direction = vec3.create();
    this.left = vec3.create();
    this.rotation = vec3.create();

    mat4.lookAt(viewMatrix, pos, aim, up);
    // TODO: support other camera type
    if (type === 'perspective') {
      mat4.perspective(projectionMatrix, fovY, aspect, near, far);
    }

    mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);

    this.cameraUniforms.viewMatrix = viewMatrix;
    this.cameraUniforms.projectionMatrix = projectionMatrix;
    this.cameraUniforms.viewProjectionMatrix = viewProjectionMatrix;
    this.cameraUniforms.cameraPosition = this.getPos();

    this.transformMatricesUpdated = true;

    //    this.rotationQuaterion  ....to be implemented //
  }
  setPos({pos}) {
    this.pos[0] = pos[0];
    this.pos[1] = pos[1];
    this.pos[2] = pos[2];
    this.transformMatricesUpdated = false;
  }

  setAim({aim}) {
    this.aim[0] = aim[0];
    this.aim[1] = aim[1];
    this.aim[2] = aim[2];
    this.transformMatricesUpdated = false;
  }

  setUp({up}) {
    this.up[0] = up[0];
    this.up[1] = up[1];
    this.up[2] = up[2];
    this.transformMatricesUpdated = false;
  }

  setDirection({direction}) {
    const distance = this.getDistanceToAim();
    const moveVector = vec3.create();
    vec3.scale(moveVector, direction, distance);
    vec3.add(this.aim, this.pos, moveVector);
    this.transformMatricesUpdated = false;
  }

  getPos() {
    return this.pos;
  }

  getAim() {
    return this.aim;
  }

  getDistanceToAim() {
    return vec3.distance(this.pos, this.aim);
  }

  getDirection() {
    return vec3.normalize(this.direction, vec3.subtract(this.direction, this.aim, this.pos));
  }

  getLeft() {
    return vec3.normalize(this.left, vec3.cross(this.left, this.getUp(), this.getDirection()));
  }

  getUp() {
    return this.up;
  }

  getRotation() {
    const camMatrix = mat4.create();
    mat4.invert(camMatrix, this.cameraUniforms.viewMatrix);
    this.rotation[0] = Math.atan(this.camMatrix[6] / this.camMatrix[10]);
    const direction = this.getDirection();
    if (direction[0] >= 0) {
      this.rotation[1] = -(Math.atan(direction[2] / direction[0]) + Math.PI / 2.0);
    } else {
      this.rotation[1] = -(Math.atan(direction[2] / direction[0]) - Math.PI / 2.0);
    }

    this.rotation[2] = 0;

    if (isNaN(this.rotation[0])) {
      this.rotation[0] = 0;
    }
    if (isNaN(this.rotation[1])) {
      this.rotation[1] = 0;
    }

    if (isNaN(this.rotation[2])) {
      this.rotation[2] = 0;
    }

    return this.rotation;
  }

  getFrontPosition({distance}) {
    const direction = this.getDirection();
    return vec3.scaleAndAdd(vec3.create(), this.pos, direction, distance);
  }

  getTransformMatrices() {
    if (this.transformMatricesUpdated === true) {
      return this.cameraUniforms;
    }
    mat4.lookAt(this.cameraUniforms.viewMatrix, this.pos, this.aim, this.up);
    mat4.multiply(
      this.cameraUniforms.viewProjectionMatrix,
      this.cameraUniforms.projectionMatrix,
      this.cameraUniforms.viewMatrix
    );
    this.cameraUniforms.cameraPosition = this.getPos();
    return this.cameraUniforms;
  }

}

