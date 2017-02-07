import fs from 'fs';
import path from 'path';

export const defaultVs = {
  interface: fs.readFileSync(path.join(__dirname, 'default-vs-int.glsl'), 'utf8'),
  body: fs.readFileSync(path.join(__dirname, 'default-vs.glsl'), 'utf8')
};
export const passThroughFs = {
  interface: fs.readFileSync(path.join(__dirname, 'passthrough-fs-int.glsl'), 'utf8'),
  body: fs.readFileSync(path.join(__dirname, 'passthrough-fs.glsl'), 'utf8')
};
export const screenQuadVs = {
  interface: fs.readFileSync(path.join(__dirname, 'screen-quad-vs-int.glsl'), 'utf8'),
  body: fs.readFileSync(path.join(__dirname, 'screen-quad-vs.glsl'), 'utf8')
};
export const simpleTextureFs = {
  interface: fs.readFileSync(path.join(__dirname, 'simple-texture-fs-int.glsl'), 'utf8'),
  body: fs.readFileSync(path.join(__dirname, 'simple-texture-fs.glsl'), 'utf8')
};
