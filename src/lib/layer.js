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
/* global window */
import {compareProps, log, count} from './utils';
import assert from 'assert';

/*
 * @param {string} props.id - layer name
 * @param {array}  props.data - array of data instances
 * @param {bool} props.opacity - opacity of the layer
 */
const defaultProps = {
  dataIterator: null,
  dataComparator: null,
  numInstances: undefined,
  visible: true,
  pickable: false,
  opacity: 0.8,
  onHover: () => {},
  onClick: () => {},
  // Update triggers: a key change detection mechanism in deck.gl
  // See layer documentation
  updateTriggers: {}
};

let counter = 0;

export default class Layer {
  /**
   * @class
   * @param {object} props - See docs and defaults above
   */
  constructor(props) {
    // If sublayer has static defaultProps member, getDefaultProps will return it
    const mergedDefaultProps = getDefaultProps(this);
    // Merge supplied props with pre-merged default props
    props = Object.assign({}, mergedDefaultProps, props);
    // Accept null as data - otherwise apps and layers need to add ugly checks
    props.data = props.data || [];
    // Props are immutable
    Object.freeze(props);

    // Define all members and freeze layer
    this.id = props.id;
    this.props = props;
    this.oldProps = null;
    this.changeFlags = {
      propsChanged: false,
      dataChanged: true,
      dataStructureChanged: false,
      reason: undefined
    }
    this.state = null;
    this.context = null;
    this.count = counter++;
    Object.seal(this);

    this.validateRequiredProp('id', x => typeof x === 'string' && x !== '');
    this.validateRequiredProp('data');
  }

  toString() {
    const className = this.constructor.layerName || this.constructor.name;
    return className !== this.props.id ? `<${className}:'${this.props.id}'>` : `<${className}>`;
  }

  // //////////////////////////////////////////////////
  // LIFECYCLE METHODS, overridden by the layer subclasses

  // Called once to set up the initial state
  // App can create WebGL resources
  initializeState() {
    throw new Error(`Layer ${this} has not defined initializeState`);
  }

  // Let's layer control if updateState should be called
  shouldUpdateState() {
    return this.changeFlags.somethingChanged;
  }

  // Default implementation, all attributes will be invalidated and updated
  // when data changes
  updateState({oldProps, props, oldContext, context, changeFlags}) {
    if (this.changeFlags.dataChanged) {
      this.invalidateAttribute('all');
    }
  }

  // Called once when layer is no longer matched and state will be discarded
  // App can destroy WebGL resources here
  finalizeState() {
  }

  // Implement to generate sublayers
  getSubLayers() {
    return null;
  }
  /* eslint-enable max-statements */

  // END LIFECYCLE METHODS
  // //////////////////////////////////////////////////

  // Public API

  // Updates selected state members and marks the object for redraw
  setState(updateObject) {
    Object.assign(this.state, updateObject);
  }

  // LAYER MANAGER API
  // Should only be called by the deck.gl LayerManager class

  // Called by layer manager when a new layer is found
  /* eslint-disable max-statements */
  initializeLayer(params) {
    if (this.props.useGPU === true) {
      assert(this.context.gl, 'Layer context missing gl');
    }
    assert(!this.state, 'Layer missing state');

    this.state = {};

    // Storing Geometries
    this.state.activeCameras = new Map();
    this.state.id = this.props.id;
    this.state.hidden = false;

    // Call subclass lifecycle methods
    this.initializeState(params);
    // End subclass lifecycle methods
  }

  // Called by layer manager when existing layer is getting new props
  updateLayer(updateParams) {
    // Call subclass lifecycle method
    const stateNeedsUpdate = this.shouldUpdateState();
    // End lifecycle method

    if (stateNeedsUpdate) {
      // Call deprecated lifecycle method if defined
      const hasRedefinedMethod = this.willReceiveProps &&
        this.willReceiveProps !== Layer.prototype.willReceiveProps;

      if (hasRedefinedMethod) {
        log.once(0, `deck.gl v3 willReceiveProps deprecated. Use updateState in ${this}`);
        const {oldProps, props, changeFlags} = updateParams;
        this.setState(changeFlags);
        this.willReceiveProps(oldProps, props, changeFlags);
        this.setState({
          dataChanged: false,
          dataStructureChanged: false
        });
      }
      // End lifecycle method

      // Call subclass lifecycle method
      this.updateState(updateParams);
      // End lifecycle method
    }
  }
  /* eslint-enable max-statements */

  // Called by manager when layer is about to be disposed
  // Note: not guaranteed to be called on application shutdown
  finalizeLayer() {
    // Call subclass lifecycle method
    this.finalizeState();
    // End lifecycle method
  }

  diffProps(oldProps, newProps, context) {
    // First check if any props have changed (ignore props that will be examined separately)
    const propsChangedReason = compareProps({
      newProps,
      oldProps,
      ignoreProps: {data: null, updateTriggers: null}
    });
    const propsChanged = Boolean(propsChangedReason);

    // Now check if any data related props have changed
    const dataChangedReason = this._diffDataProps(oldProps, newProps);
    // Right now, dataChanged is always true for forced data update
    // TODO: will implement correct data logic later
    const dataChanged = true; //Boolean(dataChangedReason);

    // Check update triggers to determine if any attributes need regeneration
    // Note - if data has changed, all attributes will need regeneration, so skip this step
    if (!dataChanged) {
      this._diffUpdateTriggers(oldProps, newProps);
    } else {
      log.log(1, `dataChanged: ${dataChanged}`);
    }

    this.changeFlags = {
      propsChanged,
      dataChanged,
      reason: dataChangedReason || propsChangedReason
    };
    return;
  }

  // PRIVATE METHODS

  // The comparison of the data prop requires special handling
  // the dataComparator should be used if supplied
  _diffDataProps(oldProps, newProps) {
    // Support optional app defined comparison of data
    const {dataComparator} = newProps;
    if (dataComparator) {
      if (!dataComparator(newProps.data, oldProps.data)) {
        return 'Data comparator detected a change';
      }
    // Otherwise, do a shallow equal on props
    } else if (newProps.data !== oldProps.data) {
      return 'A new data container was supplied';
    }

    return null;
  }

  // Checks if any update triggers have changed, and invalidate
  // attributes accordingly.
  /* eslint-disable max-statements */
  _diffUpdateTriggers(oldProps, newProps) {
    // const {attributeManager} = this.state;
    // const updateTriggerMap = attributeManager.getUpdateTriggerMap();

    let change = false;

    for (const propName in newProps.updateTriggers) {
      const oldTriggers = oldProps.updateTriggers[propName];
      const newTriggers = newProps.updateTriggers[propName];
      const diffReason = compareProps({
        oldProps: oldTriggers,
        newProps: newTriggers
      });
      if (diffReason) {
        if (propName === 'all') {
          log.log(1, `updateTriggers invalidating all attributes: ${diffReason}`);
          this.invalidateAttribute('all');
          change = true;
        } else {
          log.log(1, `updateTriggers invalidating attribute ${propName}: ${diffReason}`);
          this.invalidateAttribute(propName);
          change = true;
        }
      }
    }

    return change;
  }
  /* eslint-enable max-statements */

  validateRequiredProp(propertyName, condition) {
    const value = this.props[propertyName];
    if (value === undefined) {
      throw new Error(`Property ${propertyName} undefined in layer ${this}`);
    }
    if (condition && !condition(value)) {
      throw new Error(`Bad property ${propertyName} in layer ${this}`);
    }
  }
}

Layer.layerName = 'Layer';
Layer.defaultProps = defaultProps;

// HELPERS

// Constructors have their super class constructors as prototypes
function getOwnProperty(object, prop) {
  return object.hasOwnProperty(prop) && object[prop];
}
/*
 * Return merged default props stored on layers constructor, create them if needed
 */
function getDefaultProps(layer) {
  const mergedDefaultProps = getOwnProperty(layer.constructor, 'mergedDefaultProps');
  if (mergedDefaultProps) {
    return mergedDefaultProps;
  }
  return mergeDefaultProps(layer);
}

/*
 * Walk the prototype chain and merge all default props
 */
function mergeDefaultProps(layer) {
  const subClassConstructor = layer.constructor;
  const layerName = getOwnProperty(subClassConstructor, 'layerName');
  if (!layerName) {
    log.once(0, `layer ${layer.constructor.name} does not specify a "layerName"`);
  }
  let mergedDefaultProps = {
    id: layerName || layer.constructor.name
  };

  while (layer) {
    const layerDefaultProps = getOwnProperty(layer.constructor, 'defaultProps');
    Object.freeze(layerDefaultProps);
    if (layerDefaultProps) {
      mergedDefaultProps = Object.assign({}, layerDefaultProps, mergedDefaultProps);
    }
    layer = Object.getPrototypeOf(layer);
  }
  // Store for quick lookup
  subClassConstructor.mergedDefaultProps = mergedDefaultProps;
  return mergedDefaultProps;
}

export const TEST_EXPORTS = {
  mergeDefaultProps
};
