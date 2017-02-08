import {Mesh, MeshProperty} from './mesh';
import {MeshGenerator} from './mesh-generator';
import {flatten2D} from '../lib/utils/flatten';
import {fontInfo} from '../renderer/font';

export default class Text2d extends Mesh {
  constructor({position, color, size, id, text, cameraID = 'default-cam'}) {
    super({id, cameraID});

    const textLabel = MeshGenerator.textQuad({text, metadata: fontInfo.metadata});

     // Per vertex
    this.properties.get('vertices').hostData = new Float32Array(flatten2D(textLabel.vertices));
    this.properties.get('normals').hostData = new Float32Array(flatten2D(textLabel.normals));
    this.properties.get('index').hostData = new Uint16Array(flatten2D(textLabel.index));
    this.properties.get('texCoords').hostData = new Float32Array(flatten2D(textLabel.texCoords));

    this.properties.get('position').hostData = new Float32Array(flatten2D(position));
    this.properties.get('color').hostData = new Float32Array(flatten2D(color));
    this.properties.get('size').hostData = new Float32Array(flatten2D(size));

    this.textures.push({target: 'sdfTex', id: 'glyphAtlas'});

    this.shaderFlags = {
      useSDFTexture: true,
      useColorTexture: false,
    };

  }
}
