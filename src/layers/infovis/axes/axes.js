import {Layer} from './layer';
import {Lines} from '../mesh';
import {Utils} from '../utils';

export default class Axes extends Layer {
  constructor() {
    super({id: 'axes', cameraID: 'all'});
    const arrowSize = 0.15;
    const axesLength = 2.0;

    this.data = [
      [-axesLength, 0.0, 0.0],
      [axesLength, 0.0, 0.0],
      [0.0, -axesLength, 0.0],
      [0.0, axesLength, 0.0],
      [0.0, 0.0, -axesLength],
      [0.0, 0.0, axesLength],
      [axesLength - arrowSize, arrowSize, 0.0],
      [axesLength - arrowSize, -arrowSize, 0.0],
      [axesLength - arrowSize, 0.0, arrowSize],
      [axesLength - arrowSize, 0.0, -arrowSize],
      [0.0, axesLength - arrowSize, arrowSize],
      [0.0, axesLength - arrowSize, -arrowSize],
      [arrowSize, axesLength - arrowSize, 0.0],
      [-arrowSize, axesLength - arrowSize, 0.0],
      [arrowSize, 0.0, axesLength - arrowSize],
      [-arrowSize, 0.0, axesLength - arrowSize],
      [0.0, arrowSize, axesLength - arrowSize],
      [0.0, -arrowSize, axesLength - arrowSize]
    ];

    this.geometry.vertices = this.data;
    this.geometry.texCoords = new Array(2 * 18);
    this.geometry.color = [
      [1.0, 0.0, 0.0, 1.0 /*red*/],
      [1.0, 0.1, 0.1, 1.0 /*red*/],
      [0.0, 1.0, 0.0, 1.0 /*green*/],
      [0.1, 1.0, 0.1, 1.0 /*green*/],
      [0.0, 0.0, 1.0, 1.0 /*blue*/],
      [0.1, 0.1, 1.0, 1.0 /*blue*/],
      [1.0, 0.1, 0.1, 1.0 /*red*/],
      [1.0, 0.1, 0.1, 1.0 /*red*/],
      [1.0, 0.1, 0.1, 1.0 /*red*/],
      [1.0, 0.1, 0.1, 1.0 /*red*/],
      [0.1, 1.0, 0.1, 1.0 /*green*/],
      [0.1, 1.0, 0.1, 1.0 /*green*/],
      [0.1, 1.0, 0.1, 1.0 /*green*/],
      [0.1, 1.0, 0.1, 1.0 /*green*/],
      [0.1, 0.1, 1.0, 1.0 /*blue*/],
      [0.1, 0.1, 1.0, 1.0 /*blue*/],
      [0.1, 0.1, 1.0, 1.0 /*blue*/],
      [0.1, 0.1, 1.0, 1.0 /*blue*/],
    ];
    this.geometry.index = [0, 1, 2, 3, 4, 5, 1, 6, 1, 7, 1, 8, 1, 9, 3, 10, 3, 11, 3, 12, 3, 13, 5, 14, 5, 15, 5, 16, 5, 17];
  }

  generateGeometry() {

    const lines = new Lines({
      position: Utils.flatten2D(this.data),
      texCoords: Utils.flatten2D(this.geometry.texCoords),
      color: Utils.flatten2D(this.geometry.color),
      index: this.geometry.index,
      id: this.id,
      cameraID: this.cameraID,
      width: 1.0
    });

    this.geometry.groups[0].meshes.push(lines);
  }
}
