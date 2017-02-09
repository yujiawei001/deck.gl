import {Mesh, MeshProperty} from './mesh';
import {MeshGenerator} from './mesh-generator';
import {flatten2D} from '../lib/utils/flatten';
import {fontInfo} from '../renderer/font';

// Text labels cannot be implemented as an instanced layer
export default class Text2d extends Mesh {
  constructor({position, color, size, rotation, id, texts, cameraID = 'default-cam'}) {
    super({id, cameraID});

    this.labels = MeshGenerator.textQuads({texts, metadata: fontInfo.metadata});
    this.texts = texts;
    this.size = size;
    this.rotation = rotation;

    const labelsTransformed = MeshGenerator.transformTextQuads({vertices: this.labels.vertices, position, color, size, rotation, texts});

     // Per vertex
    this.properties.get('vertices').hostData = new Float32Array(flatten2D(labelsTransformed.vertices));
    this.properties.get('normals').hostData = new Float32Array(flatten2D(this.labels.normals));
    this.properties.get('index').hostData = new Uint16Array(flatten2D(this.labels.index));
    this.properties.get('texCoords').hostData = new Float32Array(flatten2D(this.labels.texCoords));
    this.properties.get('color').hostData = new Float32Array(flatten2D(labelsTransformed.color));

    this.numberOfInstances = 1;

    this.properties.set('instancePosition', new MeshProperty({id: 'instancePosition', attributeID: 'instancePosition', size: 3, instanced: 1, hostData: new Float32Array([0, 0, 0])}));
    this.properties.set('instanceColor', new MeshProperty({id: 'instanceColor', attributeID: 'instanceColor', size: 4, instanced: 1, hostData: new Float32Array([0, 0, 0, 0])}));
    this.properties.set('instanceScale', new MeshProperty({id: 'instanceScale', attributeID: 'instanceScale', size: 1, instanced: 1, hostData: new Float32Array([1])}));
    this.properties.set('instanceRotation', new MeshProperty({id: 'instanceRotation', attributeID: 'instanceRotation', size: 4, instanced: 1, hostData: new Float32Array([0, 0, 0, 1])}));

    this.textures.push({target: 'sdfTex', id: 'glyphAtlas'});

    this.shaderFlags = {
      useSDFTexture: true,
      useColorTexture: false,
    };
  }

  updateProperties({propertyIDs, data}) {
    const propertiesToUpdate = {};
    for (let i = 0; i < propertyIDs.length; i++) {
      const propertyID = propertyIDs[i];
      propertiesToUpdate[propertyID] = data[i];
    }

    if (propertiesToUpdate.position !== undefined || propertiesToUpdate.rotation !== undefined || propertiesToUpdate.size === undefined) {

      propertiesToUpdate.vertices = this.labels.vertices;
      propertiesToUpdate.texts = this.texts;

      const labelsTransformed = MeshGenerator.transformTextQuads(propertiesToUpdate);

      const srcData = flatten2D(labelsTransformed.vertices);
      const propertyToUpdate = this.properties.get('vertices');

      for (let i = 0; i < propertyToUpdate.hostData.length; i++) {
        propertyToUpdate.hostData[i] = srcData[i];
      }
      propertyToUpdate.dirty = true;
    }
  }
}
