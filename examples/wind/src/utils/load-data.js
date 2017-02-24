import {request, json} from 'd3-request';
import {voronoi} from 'd3-voronoi';
import DelaunayInterpolation from '../wind-layer/delaunay-interpolation';

export function loadData() {
  return Promise.all([
    loadStations(),
    loadWeatherData()
  ]).then(done);
}

function done([stations, weather]) {
  const bbox = getBBox(stations);
  const triangulation = triangulate(stations);

  return {
    stations,
    weather,
    bbox,
    triangulation,
    texData: new DelaunayInterpolation({
      bbox,
      triangulation,
      measures: weather,
      textureWidth: 1024
    }).generateTextures()
  };
}

function loadStations() {
  return new Promise((resolve, reject) => {
    json('data/stations.json')
      .on('load', resolve)
      .on('error', reject)
      .get();
  });
}

function loadWeatherData() {
  return new Promise((resolve, reject) => {
    request('data/weather.bin')
      .responseType('arraybuffer')
      .on('load', req => {
        resolve(parseData(req.response))
      })
      .on('error', reject)
      .get();
  });
}

function getBBox(data) {
  let minLat =  Infinity;
  let maxLat = -Infinity;
  let minLng =  Infinity;
  let maxLng = -Infinity;

  data.forEach(d => {
    minLat = d.lat < minLat ? d.lat : minLat;
    minLng = -d.long < minLng ? -d.long : minLng;
    maxLat = d.lat > maxLat ? d.lat : maxLat;
    maxLng = -d.long > maxLng ? -d.long : maxLng;
  });

  return {minLat, minLng, maxLat, maxLng};
}

function triangulate(data) {
  data.forEach((d, i) => d.index = i);
  return voronoi(data)
          .x(d => -d.long)
          .y(d =>  d.lat)
          .triangles(data);
}

function parseData(buffer) {
  let bufferData = new Uint16Array(buffer);
  let hours = 72;
  let components = 3;
  let l = bufferData.length / (hours * components);
  let hourlyData = Array(hours);

  for (let i = 0; i < hours; ++i) {
    hourlyData[i] = createHourlyData(bufferData, i, l, hours, components);
  }
  
  return hourlyData;
}

function createHourlyData(bufferData, i, l, hours, components) {
  let len = bufferData.length;
  let array = Array(l);

  for (let j = i * components, count = 0; count < l; j += (hours * components)) {
    array[count++] = new Float32Array([bufferData[j    ],
                                       bufferData[j + 1],
                                       bufferData[j + 2]]);
  }

  return array;
}
