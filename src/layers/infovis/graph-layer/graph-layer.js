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
import {Spheres, Circles, Lines} from '../../../mesh';
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
      // We need to some how
      this._updateMeshes({});
      this.changeFlags.dataChanged = false;
    }
  }

  pickingWithRay({ray}) {
    const {getNodePosition, getNodeSize, data} = this.props;

    const sphere = new Sphere();
    let minT = Infinity;
    let minIndex = data.numberOfNodes;

    const position = getNodePosition();
    const size = getNodeSize();

    for (let i = 0; i < data.numberOfNodes; i++) {
      sphere.center = position[i];
      sphere.radius = size[i] * 2;
      const t = Intersect.rayWithSphere({ray, sphere});
      if (t < minT) {
        minT = t;
        minIndex = i;
      }
    }

    if (minIndex < data.numberOfNodes) {
      // notify the container that data has changed

      position[minIndex][2] = -20.0;

      this.state.meshes.get(`${this.id}.nodes`).updateProperty({
        propertyID: 'position',
        data: position
      });

      const pickingResult = {
        data: {
          index: minIndex,
          node: data.nodeMap.get(minIndex),
          nodeLayout: position[minIndex]
        }
      };
      return pickingResult;
    }

    return undefined;
  }

  _generateMeshes() {
    const {getNodePosition, getNodeColor, getNodeSize, getEdgePosition, getEdgeColor} = this.props;
    const meshes = new Map();

    // Use the Circles mesh to show the node
    const nodes = new Circles({
      position: getNodePosition(),
      color: getNodeColor(),
      size: getNodeSize(),
      id: `${this.id}.nodes`,
      cameraID: this.props.cameraID
    });

    // const nodes = new Spheres({
    //   position: getNodePosition(),
    //   color: getNodeColor(),
    //   size: getNodeSize(),
    //   id: `${this.id}.nodes`,
    //   cameraID: this.props.cameraID
    // });

    meshes.set(`${this.id}.nodes`, nodes);

    const edges = new Lines({
      vertices: getEdgePosition(),
      color: getEdgeColor(),
      id: `${this.id}.edges`,
      cameraID: this.props.cameraID
    });

    meshes.set(`${this.props.id}.edges`, edges);

    return meshes;
  }

  _updateMeshes({meshID, propertyID}) {
    const {getNodePosition, getEdgePosition} = this.props;

    this.state.meshes.get(`${this.id}.nodes`).updateProperty({
      propertyID: 'position',
      data: getNodePosition()
    });

    this.state.meshes.get(`${this.id}.edges`).updateProperty({
      propertyID: 'vertices',
      data: getEdgePosition()
    });
  }
}

GraphLayer.layerName = 'GraphLayer';
