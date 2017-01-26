// Copyright (c) 2015 Uber Technologies, Inc.
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

import {Layer, assembleShaders} from 'deck.gl';
import {GL, Model, Geometry} from 'luma.gl';
// import {readFileSync} from 'fs';
// import {join} from 'path';

const defaultProps = {
  getTopPosition: x => x.topPosition,
  getBottomPosition: x => x.bottomPosition,
  getLeftPosition: x => x.leftPosition,
  getRightPosition: x => x.rightPosition,
  getColor: x => x.color || [255, 0, 255, 255],
  drawOutline: false,
  strokeWidth: 1
};

export default class S2Layer extends Layer {
  getShaders(id) {
    return {
      vs: require('./s2-layer-vertex').default,
      fs: require('./s2-layer-fragment').default
    };
  }

  initializeState() {
    /* eslint-disable */
    const {gl} = this.context;
    const model = this._getModel(gl);
    this.setState({model});

    const {attributeManager} = this.state;
    attributeManager.addInstanced({
      instanceTopPositions: {size: 2, update: this.calculateInstanceTopPositions},
      instanceBottomPositions: {size: 2, update: this.calculateInstanceBottomPositions},
      instanceLeftPositions: {size: 2, update: this.calculateInstanceLeftPositions},
      instanceRightPositions: {size: 2, update: this.calculateInstanceRightPositions},
      instanceColors: {size: 4, type: GL.UNSIGNED_BYTE, update: this.calculateInstanceColors}
    });
  }

  updateState(evt) {
    const {props, oldProps} = evt;
    if (props.drawOutline !== oldProps.drawOutline) {
      this.state.model.geometry.drawMode = props.drawOutline ? GL.LINE_LOOP : GL.TRIANGLE_FAN;
    }
  }

  draw({uniforms}) {
    const {gl} = this.context;
    const lineWidth = this.screenToDevicePixels(this.props.strokeWidth);
    gl.lineWidth(lineWidth);
    this.state.model.render(Object.assign({}, uniforms));
    gl.lineWidth(1.0);
  }

  _getModel(gl) {

    const NUM_SEGMENTS = 16;
    const positions = [];
    for (let i = 0; i < NUM_SEGMENTS; i++) {
      positions.push(
        Math.cos(Math.PI * 2 * i / NUM_SEGMENTS),
        Math.sin(Math.PI * 2 * i / NUM_SEGMENTS),
        0
      );
    }

    const shaders = assembleShaders(gl, this.getShaders());

    return new Model({
      gl,
      id: this.props.id,
      vs: shaders.vs,
      fs: shaders.fs,
      geometry: new Geometry({
        drawMode: GL.TRIANGLE_FAN,
        positions: new Float32Array([0, 1, 2, 3])
      }),
      isInstanced: true
    });
    return model;
  }

  calculateInstancePositions(attribute) {
    const {data, getPosition} = this.props;
    const {value, size} = attribute;
    let i = 0;
    for (const point of data) {
      const position = getPosition(point);
      value[i + 0] = position[0] || 0;
      value[i + 1] = position[1] || 0;
      value[i + 2] = position[2] || 0;
      i += size;
    }
  }

  calculateInstanceRadius(attribute) {
    const {data, getRadius} = this.props;
    const {value, size} = attribute;
    let i = 0;
    for (const point of data) {
      const radius = getRadius(point);
      value[i + 0] = isNaN(radius) ? 1 : radius;
      i += size;
    }
  }

  calculateInstanceColors(attribute) {
    const {data, getColor} = this.props;
    const {value, size} = attribute;
    let i = 0;
    for (const point of data) {
      const color = getColor(point);
      value[i + 0] = color[0] || 0;
      value[i + 1] = color[1] || 0;
      value[i + 2] = color[2] || 0;
      value[i + 3] = isNaN(color[3]) ? DEFAULT_COLOR[3] : color[3];
      i += size;
    }
  }
}

S2Layer.layerName = 'ScatterplotLayer';
S2Layer.defaultProps = defaultProps;
