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
import {GL, Model, Geometry, Texture2D} from 'luma.gl';
import meshLayerVertex from './mesh-layer-vertex.glsl';
import meshLayerFragment from './mesh-layer-fragment.glsl';

function degreeToRadian(degree) {
  return degree * (Math.PI / 180);
}

const layerName = 'MeshLayer';

const defaultProps = {
  getPosition: x => x.position,
  getAngleDegreesCW: x => x.angle || 0,
  getColor: x => x.color || [0, 0, 255],
  desaturate: 0,
  brightness: 0,
  meterScale: 1,
  mesh: {},
  texture: null,
  lightSettings: {}
};

export default class MeshLayer extends Layer {

  initializeState() {
    const {gl} = this.context;
    this.setState({model: this.getModel(gl)});

    const {attributeManager} = this.state;
    attributeManager.addInstanced({
      instancePositions: {size: 3, update: this.calculateInstancePositions},
      instanceAngles: {size: 1, update: this.calculateInstanceAngles}
    });
  }

  updateState({props, oldProps}) {
    const {meterScale, desaturate, brightness} = props;
    this.setUniforms({meterScale, desaturate, brightness});

    if (this.state.dataChanged && this.state.attributeManager) {
      this.state.attributeManager.invalidateAll();
    }
    if (props.texture !== oldProps.texture) {
      this.loadTexture(props.texture);
    }
    if (props.lightSettings !== oldProps.lightSettings) {
      this.setUniforms(props.lightSettings);
    }
  }

  getModel(gl) {
    gl.enable(GL.DEPTH_TEST);
    gl.depthFunc(GL.LEQUAL);

    const model = new Model({
      gl,
      id: this.props.id,
      ...assembleShaders(gl, {
        vs: meshLayerVertex,
        fs: meshLayerFragment,
        modules: ['lighting'],
        shaderCache: this.context.shaderCache
      }),
      geometry: new Geometry({
        drawMode: GL.TRIANGLES,
        indices: this.props.mesh.indices,
        positions: this.props.mesh.vertices,
        normals: this.props.mesh.vertexNormals,
        texCoords: this.props.mesh.textures
      }),
      isInstanced: true
    });

    return model;
  }

  loadTexture(texture) {
    const {gl} = this.context;
    const {model} = this.state;

    if (typeof texture === 'string') {
      // Url, load the image

      /* global Image */
      const image = new Image();

      image.crossOrigin = 'Anonymous';
      image.src = texture;
      image.onload = () => {
        texture = new Texture2D(gl).setImageData({data: image});
        model.setUniforms({sampler1: texture});
      };
      image.onerror = () => {
        throw new Error('Could not load texture.');
      };
    } else if (texture instanceof Texture2D) {
      model.setUniforms({sampler1: texture});
    } else {
      model.setUniforms({sampler1: new Texture2D(gl, {data: texture})});
    }
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

  calculateInstanceAngles(attribute) {
    const {data, getAngleDegreesCW} = this.props;
    const {value, size} = attribute;
    let i = 0;
    for (const point of data) {
      const angle = getAngleDegreesCW(point);
      value[i] = -degreeToRadian(angle);
      i += size;
    }
  }
}

MeshLayer.layerName = layerName;
MeshLayer.defaultProps = defaultProps;
