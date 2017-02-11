import {Mesh, MeshProperty} from './mesh';

export default class Lines extends Mesh {
  constructor({vertices, color, index, id, cameraID = 'default-cam', width = 1.0}) {
    super({id, cameraID});

    this.properties.set('vertices', new MeshProperty({id: 'vertices', hostData: vertices}));
    this.properties.set('color', new MeshProperty({id: 'color', hostData: color}));

    const stubTexCoords = new Array(vertices.length);
    const stubNormals = new Array(vertices.length);
    for (let i = 0; i < vertices.length; i++) {
      stubTexCoords[i] = [0, 0];
      stubNormals[i] = [0, 0, 1];
    }

    this.properties.set('texCoords', new MeshProperty({id: 'texCoords', hostData: stubTexCoords}));
    this.properties.set('normals', new MeshProperty({id: 'normals', hostData: stubNormals}));

    // if index is not provided, it means the user is expecting a non-indexed call.
    // right now, a pseudo-index array is generated to make the renderer simpler

    if (index === undefined) {
      const indexSequence = new Array(vertices.length);
      for (let i = 0; i < indexSequence.length; i++) {
        indexSequence[i] = i;
      }
      this.properties.set('index', new MeshProperty({id: 'index', hostData: indexSequence}));
    } else {
      this.properties.set('index', new MeshProperty({id: 'index', hostData: index}));
    }


    this.width = width;
  }
}
