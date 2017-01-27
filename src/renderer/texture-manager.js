import {Texture2D} from './luma.gl2/texture-2d';
import {GL} from './luma.gl2/webgl2';
export class TextureManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.textures = new Map();
  }

  newTexture({data = null, width = 1, height = 1, depth = 1, id = ''}) {
    const tex = new Texture2D(this.renderer.glContext, {id});
    tex.setImageData({data, width, height});
    this.textures.set(id, tex);
    return id;
  }

  setTextureData({id, data, width, height}) {
    const tex = this.getTexture(id);
    if (width && height) {
      tex.setImageData({data, width, height});
    } else {
      tex.setImageData({data, width: tex.width, height: tex.height});
    }
  }

  getTexture(id) {
    return this.textures.get(id);
  }
}
