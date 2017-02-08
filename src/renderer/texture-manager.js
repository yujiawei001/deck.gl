import {Texture2D} from './luma.gl2/texture-2d';
import {GL} from './luma.gl2/webgl2';
import {loadTextures} from './luma.gl2/io'
import {fontInfo} from './font';
import parsePNG from 'parse-png';

export class TextureManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.textures = new Map();

    this.glyphMetadata = fontInfo.metadata;

    parsePNG(fontInfo.data).then(png => {
      this.glyphTexture = this.newTexture({
        data: new Uint8Array(png.data),
        width: png.width,
        height: png.height,
        magFilter: GL.LINEAR,
        minFilter: GL.LINEAR,
        id: 'glyphAtlas'
      });

      console.log("this.glyphTexture", this.glyphTexture);
    });
  }

  newTexture({data = null, width = 1, height = 1, depth = 1, magFilter, minFilter, id = ''}) {
    const tex = new Texture2D(this.renderer.glContext, {id, magFilter, minFilter, generateMipmap: true});
    tex.setImageData({data, width, height});
    this.textures.set(id, tex);
    return id;
  }

  setTextureData({id, data, width, height}) {
    const tex = this.getTextureByID(id);
    if (width && height) {
      tex.setImageData({data, width, height});
    } else {
      tex.setImageData({data, width: tex.width, height: tex.height});
    }
  }

  getTextureByID(id) {
    return this.textures.get(id);
  }

  hasTexture(id) {
    return this.textures.has(id);
  }
}
