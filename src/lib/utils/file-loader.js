import {csv, json} from 'd3-request';

export default class FileLoader {
  static loadCSV(path, onDataLoaded) {
    csv(path, function loadCSV(error, data) {
      if (error) {
        console.log('load csv error: ', error);
      }
      onDataLoaded(data);
    });
  }

  static loadCSVs(paths, onDataLoaded) {
    let counter = paths.length;
    const allData = new Map();
    for (let i = 0; i < paths.length; i++) {
      csv(paths[i], function loadCSV(error, data) {
        if (error) {
          console.log('load csv error, path: ', paths[i], ' error:', error);
        }
        allData.set(paths[i], data);
        counter--;
        if (counter === 0) {
          onDataLoaded(allData);
        }
      });
    }
  }
}
