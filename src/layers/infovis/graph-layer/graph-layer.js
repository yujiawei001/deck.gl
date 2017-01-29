// Copyright (c) 2016 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
import {Layer} from '../../../lib';
import {InstancedSpheres, Lines} from '../../../mesh';
import {Sphere} from '../../../lib/utils/sphere';
import {Intersect} from '../../../lib/utils/intersect';

export default class GraphLayer extends Layer {

  initializeState({props}) {
    this.state = {
      meshes: this._generateMeshes()
    };
  }

  updateState({oldProps, props}) {
    /*
    Requiring the user to identify which mesh/property needs to be updated
    at every data change is unreasonable for composite layers. We need
    something better than the current updateTrigger.
    */
    if (this.changeFlags.dataChanged) {
      // for (const {meshID, propertyID} of props.updateTriggers) {
      this._updateMeshes({});
      this.changeFlags.dataChanged = false;
      // }
    }
  }

  pickingWithRay({ray}) {
    const {getPosition, getSize, data} = this.props;

    const sphere = new Sphere();
    let minT = Infinity;
    let minIndex = this.numberNodes;

    const position = getPosition();
    const size = getSize();

    for (let i = 0; i < this.numberNodes; i++) {
      sphere.center = position[i];
      sphere.radius = size[i] * 2;
      const t = Intersect.rayWithSphere({ray, sphere});
      if (t < minT) {
        minT = t;
        minIndex = i;
      }
    }

    if (minIndex < this.numberNodes) {
      // notify the container that data has changed

      // for (let i = 0; i < this.data[minIndex].length; i++) {
      //   this.textureData[i * 4 + 0] = this.data[minIndex][i];
      //   this.textureData[i * 4 + 1] = this.data[minIndex][i];
      //   this.textureData[i * 4 + 2] = this.data[minIndex][i];
      //   this.textureData[i * 4 + 3] = 255;
      // }
      position[minIndex][2] = -20.0;

      this.state.meshes.get(`${this.id}.nodes`).updateProperty({
        propertyID: 'instancedPosition',
        data: position
      });

      const pickingResult = {
        data: {
          index: minIndex,
          node: data.nodes.get(data.nodeIDMap.get(minIndex)),
          nodeLayout: position[minIndex]
        }
      };
      return pickingResult;
    }

    return undefined;
  }

  _generateMeshes() {
    const {getPosition, getColor, getSize, getEdgeNodeIndex} = this.props;
    const meshes = new Map();
    const nodes = new InstancedSpheres({
      instancedPosition: getPosition(),
      instancedColor: getColor(),
      instancedSize: getSize(),
      id: `${this.id}.nodes`,
      cameraID: this.props.cameraID
    });

    meshes.set(`${this.id}.nodes`, nodes);

    const edges = new Lines({
      position: getPosition(),
      color: getColor(),
      index: getEdgeNodeIndex(),
      id: `${this.id}.edges`,
      cameraID: this.props.cameraID
    });

    meshes.set(`${this.props.id}.edges`, edges);

    return meshes;
  }

  _updateMeshes({meshID, propertyID}) {
    const {getPosition} = this.props;

    this.state.meshes.get(`${this.id}.nodes`).updateProperty({
      propertyID: 'instancedPosition',
      data: getPosition()
    });

    this.state.meshes.get(`${this.id}.edges`).updateProperty({
      propertyID: 'position',
      data: getPosition()
    });
  }
}

GraphLayer.layerName = 'GraphLayer';
