// Copyright (c) 2017 Uber Technologies, Inc.
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
import {InstancedLayer} from 'instanced-layer';
import {InstancedCircles} from '../../../mesh';

const DEFAULT_COLOR = [255, 0, 255, 255];

const defaultProps = {
  getPosition: x => x.position,
  getRadius: x => x.radius || 30,
  getColor: x => x.color || DEFAULT_COLOR,
  radius: 30,  //  point radius in meters
  radiusMinPixels: 0, //  min point radius in pixels
  radiusMaxPixels: Number.MAX_SAFE_INTEGER, // max point radius in pixels
  drawOutline: false,
  strokeWidth: 1
}

export default class ScatterplotLayer extends InstancedLayer {

  initializeState({props}) {
    this.state.meshes = this._generateMeshes();
  }

  updateState({oldProps, props}) {
    if (this.changeFlags.dataChanged) {
      // for (const {meshID, propertyID} of props.updateTriggers) {
      this._updateMeshes({});
      // }
    }
  }

  _generateMeshes() {
    const meshes = new Map();
    const circles = new InstancedCircles({
      instancedPosition: this.data.map(x => this.props.getPosition(x)),
      instancedColor: this.data.map(x => this.props.getPosition(x)),
      instancedSize: this.data.map(x => this.props.getPosition(x)),
      id: `${this.id}.circles`,
      cameraID: this.props.cameraID
    });

    meshes.set(`${this.id}.circles`, circles);

    return meshes;
  }

  _updateMeshes({meshID, propertyID}) {
    this.state.meshes.get(`${this.id}.nodes`).updateProperty({
      propertyID: 'instancedPosition',
      data: this.props.data.getNodePosition()
    });

    this.state.meshes.get(`${this.id}.edges`).updateProperty({
      propertyID: 'position',
      data: this.props.data.getNodePosition()
    });
  }
}

ScatterplotLayer.layerName = 'ScatterplotLayer';
ScatterplotLayer.defaultProps = defaultProps;
