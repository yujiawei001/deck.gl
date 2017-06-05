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

import IMAGERY_VERTEX_SHADER from './imagery-layer-vertex.glsl';
import IMAGERY_FRAGMENT_SHADER from './imagery-layer-fragment.glsl';

import {getTexture} from './utils';
import GridGeometry from './grid-geometry';

const layerName = 'ImageryLayer';
const defaultProps = {
  heightMap: null,
  heightMapBounds: [0, 0, 1, 1],
  heightRange: [0, 1],
  imagery: null,
  imageryBounds: [0, 0, 1, 1],
  desaturate: 0,
  blendMode: null,
  // More context: because of the blending mode we're using for ground imagery,
  // alpha is not effective when blending the bitmap layers with the base map.
  // Instead we need to manually dim/blend rgb values with a background color.
  transparentColor: [0, 0, 0, 0],
  tintColor: [255, 255, 255]
};

/*
 * @class
 * @param {object} props
 * @param {number} props.transparentColor - color to interpret transparency to
 * @param {number} props.tintColor - color bias
 */
export default class ImageryLayer extends Layer {

  initializeState() {
    const {gl} = this.context;
    // TODO/ib - Enabled to allow debugging of heightmaps, not perfect but really helps
    gl.getExtension('OES_standard_derivatives');
    this.setState({model: this.getModel(gl)});
  }

  updateState({props, oldProps, changeFlags}) {
    const {gl} = this.context;
    const {model} = this.state;

    const {heightMap, imagery, uCount, vCount} = props;
    if (heightMap !== oldProps.heightMap) {
      getTexture(gl, heightMap).then(texture => {
        model.setUniforms({heightMapTexture: texture});
      });
    }
    if (imagery !== oldProps.imagery) {
      getTexture(gl, imagery).then(texture => {
        model.setUniforms({imageryTexture: texture});
      });
    }
    if (uCount !== oldProps.uCount || vCount !== oldProps.vCount) {
      const geometry = new GridGeometry({uCount, vCount});
      model.setGeometry(geometry);
      model.setVertexCount(geometry.getVertexCount());
    }
    if (changeFlags.propsChanged) {
      const {
        heightMapBounds, heightRange, imageryBounds,
        desaturate, transparentColor, tintColor
      } = props;
      this.setUniforms({
        heightMapBounds, heightRange, imageryBounds,
        desaturate, transparentColor, tintColor
      });
    }
  }

  getModel(gl) {
    // 3d surface
    const shaders = assembleShaders(gl, {
      vs: IMAGERY_VERTEX_SHADER,
      fs: IMAGERY_FRAGMENT_SHADER,
      shaderCache: this.context.shaderCache
    });

    return new Model({
      gl,
      id: this.props.id,
      vs: shaders.vs,
      fs: shaders.fs,
      geometry: new Geometry(),
      vertexCount: 0,
      isIndexed: true
    });
  }

  draw({uniforms}) {
    const {gl} = this.context;

    const {blendMode} = this.props;
    if (!uniforms.renderPickingBuffer && blendMode) {
      gl.blendFunc(...blendMode.func);
      gl.blendEquation(blendMode.equation);
    }

    // Resolve z-fighting and drawing order
    // New pixels must be drawn on top of old
    gl.enable(GL.POLYGON_OFFSET_FILL);
    // https://www.opengl.org/archives/resources/faq/technical/polygonoffset.htm
    // Polygon offset allows the application to specify a depth offset with two
    // parameters, factor and units. factor scales the maximum Z slope, with
    // respect to X or Y of the polygon, and units scales the minimum resolvable
    // depth buffer value. The results are summed to produce the depth offset.

    // 200 is an arbitrary number to ensure that factor is positive
    // Otherwise ground image will occlude lanes
    gl.polygonOffset(200 - uniforms.layerIndex, 1);

    // Render the image
    this.state.model.render(uniforms);

    // Restore context state
    gl.disable(GL.POLYGON_OFFSET_FILL);

    if (!uniforms.renderPickingBuffer && blendMode) {
      gl.blendFunc(GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA);
      gl.blendEquation(GL.FUNC_ADD);
    }
  }

}

ImageryLayer.layerName = layerName;
ImageryLayer.defaultProps = defaultProps;
