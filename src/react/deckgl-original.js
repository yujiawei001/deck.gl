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
import autobind from './autobind';
import {LayerManager} from '../lib';
import {log} from '../lib/utils';

export class DeckGLOriginal {
  constructor({controller}) {
    this.layerManager = new LayerManager();
    // temporarily exposing these two props
    this.dataStructureChanged = false;
    this.dataChanged = false;
    this.hackCounterForRunningDataStructureGenerationForOneTime = 0;
    autobind(this);
  }

  processLayers(layers) {
    this._updateLayers(layers);
    if (this.hackCounterForRunningDataStructureGenerationForOneTime === 0) {
      this.dataStructureChanged = true;
      this.hackCounterForRunningDataStructureGenerationForOneTime++;
    }
    this.dataChanged = true;
  }

  _updateLayers(nextProps) {
    if (this.layerManager) {
      this.layerManager.updateLayers({newLayers: nextProps.layers});
    }
  }

  layersToRender() {
    return this.layerManager.layers;
  }
  attributesToUpdate() {
    return;
  }
  isDataStructureChanged() {
    return this.dataStructureChanged;
  }

  isDataChanged() {
    return this.dataChanged;
  }

  processPickingAction({ray}) {
    this.layerManager.processPickingAction({ray});
  }
}
