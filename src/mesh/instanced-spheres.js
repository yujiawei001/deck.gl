import {Mesh, MeshProperty} from './mesh';
import {flatten2D} from '../lib/utils/flatten';
function getMiddlePoint(a, b) {
  const x = (a[0] + b[0]) / 2;
  const y = (a[1] + b[1]) / 2;
  const z = (a[2] + b[2]) / 2;
  const length = Math.sqrt(x * x + y * y + z * z);

  return [x / length, y / length, z / length];
}
export default class InstancedSpheres extends Mesh {
  constructor({instancedPosition, instancedColor, instancedSize, id, cameraID = 'default-cam', textures = []}) {
    super({id, cameraID});
    // const t = (1.0 + Math.sqrt(5.0)) / 2.0;

    const X = 0.525731112119133606;
    const Z = 0.850650808352039932;

    // 12 vertices
    let icosahedronVert = [
        [-X, 0.0, Z], [X, 0.0, Z], [-X, 0.0, -Z], [X, 0.0, -Z],
        [0.0, Z, X], [0.0, Z, -X], [0.0, -Z, X], [0.0, -Z, -X],
        [Z, X, 0.0], [-Z, X, 0.0], [Z, -X, 0.0], [-Z, -X, 0.0]
      ];

    // 20 triangles, 60 vertex indices
    let icosahedronVertIndex = [
      [0, 4, 1], [0, 9, 4], [9, 5, 4], [4, 5, 8], [4, 8, 1],
      [8, 10, 1], [8, 3, 10], [5, 3, 8], [5, 2, 3], [2, 7, 3],
      [7, 10, 3], [7, 6, 10], [7, 11, 6], [11, 0, 6], [0, 1, 6],
      [6, 1, 10], [9, 0, 11], [9, 11, 2], [9, 2, 5], [7, 2, 11]
    ];

    // recursively refine icosahedron to get a sphere
    const recursionLevel = 2;
    for (let i = 0; i < recursionLevel; i++) {

      const addedVerts = [];
      const addedIndices = [];

      let currentIndexStart = icosahedronVert.length;
      for (let j = 0; j < icosahedronVertIndex.length; j++) {

        const index1 = icosahedronVertIndex[j][0];
        const index2 = icosahedronVertIndex[j][1];
        const index3 = icosahedronVertIndex[j][2];

        const index4 = currentIndexStart;
        const index5 = currentIndexStart + 1;
        const index6 = currentIndexStart + 2;

        const v1 = icosahedronVert[index1];
        const v2 = icosahedronVert[index2];
        const v3 = icosahedronVert[index3];

        const m1 = getMiddlePoint(v1, v2);
        const m2 = getMiddlePoint(v2, v3);
        const m3 = getMiddlePoint(v3, v1);

        addedVerts.push(m1);
        addedVerts.push(m2);
        addedVerts.push(m3);

        addedIndices.push([index1, index4, index6]);
        addedIndices.push([index2, index5, index4]);
        addedIndices.push([index3, index6, index5]);
        addedIndices.push([index4, index5, index6]);

        currentIndexStart += 3;
      }

      icosahedronVert = icosahedronVert.concat(addedVerts);
      icosahedronVertIndex = [];
      icosahedronVertIndex = icosahedronVertIndex.concat(addedIndices);

    }

    const flattenedTypedIcosahedronVert = new Float32Array(flatten2D(icosahedronVert));
    const flattenedTypedIcosahedronVertIndex = new Uint16Array(flatten2D(icosahedronVertIndex));

    this.properties.get('position').hostData = flattenedTypedIcosahedronVert;
    this.properties.get('normals').hostData = flattenedTypedIcosahedronVert;
    this.properties.get('index').hostData = flattenedTypedIcosahedronVertIndex;

    // no texture coord for now
    this.properties.get('texCoords').hostData = new Float32Array(icosahedronVert.length * 2);

    // this is not in use for instanced rendering
    const color = new Float32Array(icosahedronVert.length * 4);
    for (let i = 0; i < icosahedronVert.length * 4; i++) {
      color[i * 4 + 0] = 1.0;
      color[i * 4 + 1] = 0.0;
      color[i * 4 + 2] = 0.0;
      color[i * 4 + 3] = 1.0;
    }
    this.properties.get('color').hostData = color;

    this.properties.set(
      'instancedPosition',
      new MeshProperty({id: 'instancedPosition', hostData: new Float32Array(flatten2D(instancedPosition))})
    );

    this.properties.set(
      'instancedColor',
      new MeshProperty({id: 'instancedColor', hostData: new Float32Array(flatten2D(instancedColor))})
    );

    this.properties.set(
      'instancedSize',
      new MeshProperty({id: 'instancedSize', hostData: new Float32Array(flatten2D(instancedSize))})
    );

    this.textures = textures;
  }
}
