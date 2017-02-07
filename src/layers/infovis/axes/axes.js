import {Layer} from '../../../lib';
import {Lines} from '../../../mesh';

export default class Axes extends Layer {

  initializeState({props}) {
    this.state = {
      meshes: this._generateMeshes()
    };
  }

  _generateMeshes() {
    const meshes = new Map();

    const arrowSize = 0.15;
    const axesLength = 2.0;

    const vertices = [
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

    const color = [
      [1.0, 0.0, 0.0, 1.0/* red */],
      [1.0, 0.1, 0.1, 1.0/* red */],
      [0.0, 1.0, 0.0, 1.0/* green */],
      [0.1, 1.0, 0.1, 1.0/* green */],
      [0.0, 0.0, 1.0, 1.0/* blue */],
      [0.1, 0.1, 1.0, 1.0/* blue */],
      [1.0, 0.1, 0.1, 1.0/* red */],
      [1.0, 0.1, 0.1, 1.0/* red */],
      [1.0, 0.1, 0.1, 1.0/* red */],
      [1.0, 0.1, 0.1, 1.0/* red */],
      [0.1, 1.0, 0.1, 1.0/* green */],
      [0.1, 1.0, 0.1, 1.0/* green */],
      [0.1, 1.0, 0.1, 1.0/* green */],
      [0.1, 1.0, 0.1, 1.0/* green */],
      [0.1, 0.1, 1.0, 1.0/* blue */],
      [0.1, 0.1, 1.0, 1.0/* blue */],
      [0.1, 0.1, 1.0, 1.0/* blue */],
      [0.1, 0.1, 1.0, 1.0/* blue */]
    ];

    const index = [0, 1, 2, 3, 4, 5, 1, 6, 1, 7, 1, 8, 1, 9, 3, 10, 3, 11, 3, 12, 3, 13, 5, 14, 5, 15, 5, 16, 5, 17];

    const axis = new Lines({
      vertices,
      color,
      index,
      id: `${this.id}.lines`
    });

    meshes.set(`${this.id}.lines`, axis);

    return meshes;
  }

  _updateMeshes({meshID, propertyID}) {
  }
}
Axes.layerName = 'Axes';
