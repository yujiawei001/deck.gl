export default class CameraTarget {
  constructor({targetID, vertexAttributes = new Map(), clearColor = [0.0, 0.0, 0.0, 1.0], width, height}) {
    this.targetID = targetID;
    this.vertexAttributes = vertexAttributes;
    this.clearColor = clearColor;
    this.width = width;
    this.height = height;
  }
}
