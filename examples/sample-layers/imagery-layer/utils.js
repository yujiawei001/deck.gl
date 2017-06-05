import {loadTextures, Texture2D} from 'luma.gl';

/*
 * Load image data into luma.gl Texture2D objects
 * @param {WebGLContext} gl
 * @param {Object} images - name -> image mapping
 *   image value can be url string, Texture2D object, HTMLImageElement or pixel array
 * @returns {Promise} resolves to an object with name -> texture mapping
 */
export function getTexture(gl, image) {
  if (typeof image === 'string') {
    // Url, load the image
    return loadTextures(gl, {urls: [image]})
    .then(textures => textures[0]);
  } else if (image instanceof Texture2D) {
    return new Promise(resolve => resolve(image));
  }
  return new Promise(resolve => resolve(new Texture2D(gl, {data: image})));
}
