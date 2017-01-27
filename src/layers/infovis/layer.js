

/* data in representable form */
class Geometry {
  constructor() {
    this.groups = [];
    /* are these necessary? */
    this.data = null;
    this.vertices = null;
    this.texCoords = null;
    this.color = null;
    this.index = null;
    this.generated = false;
    this.hidden = false;
  }
}

/* Group is an extra layer of aggregation that helps
renderer reorganizing meshes
*/
class Group {
  constructor() {
    this.meshes = [];
  }
}

/* Layers are data containers.
  A Layer contains "data" property that stores data in an abstract form (maybe high dimensional)
  and a geometry that stores data in representable form (two dimensional or three dimensional,
  at most four with a dimension of time?)
*/
export class Layer {
  constructor({id = '', cameraID = 'default'}) {

    this.containers = [];

    /* data holds the abstract data (or called unprocessed data) in its original form */
    this.data = null;
    /* geometry is a tree structure that hold data in a more presentable way
    There could be significant things going on transforming this.data to this.geometry
    Abstract meshes are generated and stored together to form a group
    */

    this.pickable = false;

    this.geometry = new Geometry();

    this.id = id;

    this.cameraID = cameraID;

    this.useGPU = false;

    this.geometry.groups.push(new Group());
  }

  generateGeometry() {
  }

  hide() {
    this.geometry.hidden = true;
  }

  show() {
    this.geometry.hidden = false;
  }

  addGroup() {
    this.geometry.groups.push(new Group());
  }
  setCameraID(id) {
    this.cameraID = id;
  }

  animationStep() {
    // one step forward in time
    // for animations
    // no-op here
  }
  rotateAlongZAxis(angle) {
    const sin_angle = Math.sin(angle);
    const cos_angle = Math.cos(angle);
    let x = 0;
    let y = 0;
    for (let i = 0; i < this.data.length; i++) {
      x = this.data[i][0];
      y = this.data[i][1];
      this.data[i][0] = x * cos_angle - y * sin_angle;
      this.data[i][1] = x * sin_angle + y * cos_angle;
    }
    this.geometry.vertices = this.data;
    this.updateGeometry();
  }

  rotateAlongYAxis(angle) {
    const sin_angle = Math.sin(angle);
    const cos_angle = Math.cos(angle);
    let x = 0;
    let z = 0;
    for (let i = 0; i < this.data.length; i++) {
      x = this.data[i][0];
      z = this.data[i][2];

      this.data[i][0] = z * sin_angle + x * cos_angle;
      this.data[i][2] = z * cos_angle - x * sin_angle;
    }
    this.geometry.vertices = this.data;
    this.updateGeometry();
  }
  attachContainer({container}) {
    this.containers.push(container);
  }
}
