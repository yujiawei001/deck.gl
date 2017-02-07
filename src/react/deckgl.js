import React, {PropTypes, createElement} from 'react';

import {WebGLRenderer, WebGL2Renderer} from '../renderer';
import {LayerManager} from '../lib/layer-manager';
import {EventManager} from '../event';
import Axes from '../layers/infovis/axes';
// import Plane from '../layers/infovis/plane';

export default class DeckGL extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      width: props.width,
      height: props.height
    };

    this.startTime = new Date();
    this.previousTime = new Date();
    this.currentTime = new Date();

    this.canvas = null;
    this.renderer = null;
    this.container = null;
    this.cameras = new Set();
    this.eventManager = null;

    this.propsChanged = true;

    this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;

    this.internalLayers = [];
    this.allLayers = [];
  }

  componentWillMount() {
  }

  componentDidMount() {
    this.canvas = this.refs.canvas;

    const debug = false;
    const glOptions = null;
    const rendererType = 'WebGL';

    // Before creating the WebGL renderer, a canvas should be ready
    switch (rendererType) {
    case 'WebGL':
      this.renderer = new WebGLRenderer({controller: this, canvas: this.canvas, debug, glOptions});
      break;
    case 'WebGL2':
      this.renderer = new WebGL2Renderer({controller: this, canvas: this.canvas, debug, glOptions});
      break;
    default:
      console.error('unknown type of renderer');
      break;
    }

    this.container = new LayerManager({controller: this});
    this.eventManager = new EventManager({controller: this, canvas: this.canvas});

    /*  TODO: Make internal layers work.
    Internal layers are "non-react" so it's not compatible
    with current layer diffing algorithms
    */

    const axes = new Axes({id: 'axes'});
    this.container.addInternalLayer(axes);

    const cameraID = 'default-cam';
    /* camera parameters
    These parameters are for perspective cameras */
    const params = {
      pos: [0.0, 0.0, -100],
      aim: [0.0, 0.0, 0.0],
      up: [0.0, -1.0, 0.0],
      fovY: 45 / 180 * Math.PI,
      near: 1,
      far: 1e4,
      aspect: this.canvas.width / this.canvas.height
    };

    const targetParams = {
      /* render to texture for screen composition or not */
      renderToTexture: true,
      /* render target texture size. only effective when the previous is set to true */
      width: this.canvas.width,
      height: this.canvas.height,
      /* at which corner this texture will be put to the final screen
      TODO: signicantly improve the final screen
      composition mechanism*/
      corner: 'bottom-left'
    };

    this.renderer.newCamera({
      id: cameraID,
      controlType: 'standard-2d',
      type: 'perspective',
      params,
      targetParams
    });

    this.cameras.add(cameraID);

    // Initial set up of the animation loop
    if (typeof window !== 'undefined') {
      this.animationFrame = requestAnimationFrame(this._animationLoop.bind(this));
    }
  }

  componentWillReceiveProps(nextProps) {
    this.updateProps(nextProps);
  }

  _animationLoop() {
    this.previousTime = this.currentTime;
    this.currentTime = new Date();

    if (this.renderer && this.renderer.activated && this.renderer.needsRedraw) {
      this.draw();
    }

    if (typeof window !== 'undefined') {
      this.animationFrame = requestAnimationFrame(this._animationLoop.bind(this));
    }
  }

  routeCameraAction(action) {
    this.renderer.cameraManager.processAction(action);
  }

  routeContainerAction(action) {
    this.container.processAction(action);
  }

  routePickingAction(action) {
    const pickingRay = this.renderer.getPickingRay({
      screenCoord: [action.event.offsetX, action.event.offsetY]
    });
    if (action.rayOnly === false) {
      this.container.processPickingAction({ray: pickingRay});
    }
  }

  animationLoopUpdate() {
  }

  propsChangedUpdate() {
    /* layer comparison. */
    this.container.updateLayers(this.props.layers);
    const newMeshes = this.container.meshesToGenerate();
    if (newMeshes.length > 0) {
      this.renderer.regenerateRenderableMeshes({meshes: newMeshes});
      this.renderer.activated = true;
    }

    const properties = this.container.propertiesToUpdate();
    this.renderer.updateRenderableMeshes({attributes: properties});

    this.propsChanged = false;
  }

  updateProps(props) {
    // If props have changed after last animation loop
    this.propsChangedUpdate(props);

    // // Called at every animation loop
    this.animationLoopUpdate();
  }

  processPickingResult({layer, result}) {
    this.props.onElementPicked(result);
  }

  setTextureData({id, data}) {
    this.renderer.textureManager.setTextureData({id, data});
    this.renderer.needsRedraw = true;
  }

  draw() {
    this.renderer.render();
    this.renderer.needsRedraw = false;
  }

  render() {
    const {width, height, style} = this.props;

    return createElement('canvas', {
      ref: 'canvas',
      width: this.state.width * this.dpr,
      height: this.state.height * this.dpr,
      style: Object.assign({}, style, {width, height})
    });
  }

}
