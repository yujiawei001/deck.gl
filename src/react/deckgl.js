import React, {PropTypes, createElement} from 'react';

import {WebGLRenderer, WebGL2Renderer} from '../renderer';
import {DeckGLOriginal} from './deckgl-original';
import {EventManager} from '../event';
// import Axes from '../layers/infovis/axes';
// import Plane from '../layers/infovis/plane';

export default class DeckGL extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      width: props.width,
      height: props.height,
      threeD: props.threeD
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
    const rendererType = 'WebGL2';

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

    this.container = new DeckGLOriginal({controller: this});

    this.eventManager = new EventManager({controller: this, canvas: this.canvas});

    // // These are all "layers"
    // // These two are opaque layers
    // const axes = new Axes();
    // this.container.addLayers(axes);

    // const planeXY = new Plane({
    //   data: [-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0],
    //   id: 'planeXY',
    //   cameraID: 'axis-cam'
    // });

    // this.internalLayers.push(planeXY);

    // const planeYZ = new Plane({
    //   data: [0, -1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1],
    //   id: 'planeYZ',
    //   cameraID: 'axis-cam'
    // });

    // this.internalLayers.push(planeYZ);

    // const planeXZ = new Plane({
    //   data: [-1, 0, -1, 1, 0, -1, -1, 0, 1, 1, 0, 1],
    //   id: 'planeXZ',
    //   cameraID: 'axis-cam'
    // });

    // this.internalLayers.push(planeXZ);

    // const digitBoard = new Plane({
    //   data: [-1, -1, -0.1, 1, -1, -0.1, -1, 1, -0.1, 1, 1, -0.1],
    //   id: 'digitBoard',
    //   cameraID: 'digit-cam',
    //   textures: [{id: 'digit', width: 28, height: 28}]
    // });
    // this.internalLayers.push(digitBoard);

    let cameraID = 'default-cam';

    if (this.props.threeD) {
      this.renderer.newPerspectiveCamera({
        id: cameraID,
        pos: [0.0, 0.0, -50],
        aim: [0.0, 0.0, 0.0],
        up: [0.0, -1.0, 0.0],
        fovY: 45 / 180 * Math.PI,
        near: 1,
        far: 1e4,
        texture: true,
        controlType: 'target'
      });

      this.cameras.add(cameraID);

      cameraID = 'axis-cam';
      this.renderer.newPerspectiveCamera({
        id: cameraID,
        pos: [0.0, 0.0, -6],
        aim: [0.0, 0.0, 0.0],
        up: [0.0, -1.0, 0.0],
        fovY: 45 / 180 * Math.PI,
        near: 0.1,
        far: 1000.0,
        texture: true,
        width: 256,
        height: 256,
        controlType: 'arc-rotate'
      });
      this.cameras.add(cameraID);

      cameraID = 'digit-cam';
      this.renderer.newPerspectiveCamera({
        id: cameraID,
        pos: [0.0, 0.0, -2],
        aim: [0.0, 0.0, 0.0],
        up: [0.0, -1.0, 0.0],
        fovY: 45 / 180 * Math.PI,
        near: 0.1,
        far: 1000.0,
        texture: true,
        corner: 'top-left', // this is a heck
        width: 256,
        height: 256
      });
      this.cameras.add(cameraID);

    } else {
      this.renderer.newPerspectiveCamera({
        id: cameraID,
        pos: [0.0, 0.0, -100],
        aim: [0.0, 0.0, 0.0],
        up: [0.0, -1.0, 0.0],
        fovY: 45 / 180 * Math.PI,
        near: 1,
        far: 1e4,
        texture: true,
        controlType: 'standard-2d'
      });

      this.cameras.add(cameraID);
    }

    // Initial set up of the animation loop
    if (typeof window !== 'undefined') {
      this.animationFrame = requestAnimationFrame(this._animationLoop.bind(this));
    }
  }

  componentWillReceiveProps(nextProps) {
    this.updateLayers(nextProps);
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
    this.allLayers = this.internalLayers.concat(this.props.layers);

    this.container.processLayers({layers: this.allLayers});

    if (this.container.dataStructureChanged) {
      this.renderer.regenerateRenderableMeshes(this.container);
      this.renderer.activated = true;
      this.container.dataStructureChanged = false;
    }

    if (this.container.dataChanged) {
      //this.renderer.updateRenderableMeshes(this.container.attributesToUpdate());
    }

    this.propsChanged = false;
  }

  updateLayers(props) {
    // If props have changed after last animation loop
    this.propsChangedUpdate(props);

    // // Called at every animation loop
    this.animationLoopUpdate();
  }

  // updateRenderableGeometries({layerID, groupID, meshID, propertyID}) {
  //   this.renderer.updateRenderableGeometries({
  //     container: this.container,
  //     layerID,
  //     groupID,
  //     meshID,
  //     attributeID: propertyID
  //   });
  //   this.renderer.needsRedraw = true;
  // }

  processPickingResult({layer, result}) {
    // if (layer instanceof TSNEScatterplot3D) {
    //   if (result !== undefined) {
    //     this.setTextureData({
    //       id: 'digit',
    //       data: result.data.image
    //     });
    //   }
    // } else if (layer instanceof Graph3D) {
    // this.props.onElementPicked(result);
    // }
    console.log('picking result: ', result);
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
