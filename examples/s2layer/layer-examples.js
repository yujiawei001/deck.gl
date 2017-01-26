import {ChoroplethLayer, ScatterplotLayer} from 'deck.gl';

import S2Layer from './s2-layer';
import * as dataSamples from './data-samples';

const S2LayerExample = {
  layer: S2Layer,
  props: {
    id: 's2Layer',
    data: dataSamples.points,
    getPosition: d => d.COORDINATES,
    getColor: d => [100, 255, 0],
    getRadius: d => d.SPACES,
    opacity: 0.5,
    strokeWidth: 2,
    pickable: true,
    radiusMinPixels: 1,
    radiusMaxPixels: 30
  }
};

const ScatterplotLayerExample = {
  layer: ScatterplotLayer,
  props: {
    id: 'scatterplotLayer',
    data: dataSamples.points,
    getPosition: d => d.COORDINATES,
    getColor: d => [255, 128, 0],
    getRadius: d => d.SPACES,
    opacity: 0.5,
    strokeWidth: 2,
    pickable: true,
    radiusMinPixels: 1,
    radiusMaxPixels: 30
  }
};

const ScatterplotLayerMetersExample = {
  layer: ScatterplotLayer,
  props: {
    id: 'scatterplotLayerMeter',
    data: dataSamples.meterPoints,
    drawOutline: true,
    projectionMode: 2,
    positionOrigin: dataSamples.positionOrigin,
    getPosition: d => d,
    getColor: d => [0, 0, 255],
    opacity: 0.5,
    pickable: true
  }
};

const ChoroplethLayerContourExample = {
  layer: ChoroplethLayer,
  props: {
    id: 'choroplethLayerContour',
    data: dataSamples.choropleths,
    getColor: f => [0, 80, 200],
    opacity: 0.8,
    drawContour: true
  }
};

const ChoroplethLayerExample = {
  layer: ChoroplethLayer,
  props: {
    id: 'choroplethLayerSolid',
    data: dataSamples.choropleths,
    getColor: f => [((f.properties.ZIP_CODE * 10) % 127) + 128, 0, 0],
    opacity: 0.8,
    pickable: true
  }
};

// perf test examples
const ScatterplotLayerPerfExample = (id, getData) => ({
  layer: ScatterplotLayer,
  getData,
  props: {
    id: `scatterplotLayerPerf-${id}`,
    getPosition: d => d,
    getColor: d => [0, 128, 0],
    // pickable: true,
    radiusMinPixels: 1,
    radiusMaxPixels: 5
  }
});

export default {
  'S2 Layers': {
    S2Layer: S2LayerExample
  },

  'Core Layers': {
    'ChoroplethLayer (Solid)': ChoroplethLayerExample,
    'ChoroplethLayer (Contour)': ChoroplethLayerContourExample,
    ScatterplotLayer: ScatterplotLayerExample,
    'ScatterplotLayer (meters)': ScatterplotLayerMetersExample
  },

  'Performance Tests': {
    'ScatterplotLayer 1M': ScatterplotLayerPerfExample('1M', dataSamples.getPoints1M),
    'ScatterplotLayer 10M': ScatterplotLayerPerfExample('10M', dataSamples.getPoints10M)
  }
};

export const DEFAULT_ACTIVE_LAYERS = {};
