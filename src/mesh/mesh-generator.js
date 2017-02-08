function getMiddlePoint(a, b) {
  const x = (a[0] + b[0]) / 2;
  const y = (a[1] + b[1]) / 2;
  const z = (a[2] + b[2]) / 2;
  const length = Math.sqrt(x * x + y * y + z * z);

  return [x / length, y / length, z / length];
}

export class MeshGenerator {
  static unitIcosphere({refineLevel = 1}) {
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
    for (let i = 0; i < refineLevel; i++) {

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

    // tex coord of icosphere not implemented yet
    texCoords = new Float32Array(icosahedronVert.length * 2);

    return {vertices: icosahedronVert, normals: icosahedronVert, index: icosahedronVertIndex, texCoords: texCoords};
  }

  static unitCircle({numSections = 8}) {
    const vertices = new Array(numSections + 1);
    const normals = new Array(numSections + 1);
    const index = new Array(numSections);
    const texCoords = new Array(numSections + 1);

    for (let i = 0; i < numSections; i++) {
      vertices[i] = [Math.cos(Math.PI * 2 * i / numSections), Math.sin(Math.PI * 2 * i / numSections), 0];
      normals[i] = [0, 0, -1];
      texCoords[i] = [(Math.cos(Math.PI * 2 * i / numSections) + 1) / 2, (Math.sin(Math.PI * 2 * i / numSections) + 1) / 2];

      index[i] = [i, (i + 1) % numSections, numSections];
    }

    vertices[numSections] = [0, 0, 0];
    normals[numSections] = [0, 0, -1];
    texCoords[numSections] = [0.5, 0.5];

    return {vertices, normals, index, texCoords};
  }

  static textQuad({text, metadata}) {

    const numberOfCharacters = text.length;

    // as proportion of line height
    const letterSpacing = 0.1;

    const vertices = new Array(numberOfCharacters * 4);
    const normals = new Array(numberOfCharacters * 4);
    const index = new Array(numberOfCharacters);
    const texCoords = new Array(numberOfCharacters * 4);

    const charMap = new Map();

    let currentXPos = 0;

    for (let i = 0; i < metadata.font.chars._count; i++) {
      charMap.set(metadata.font.chars.char[i]._id, metadata.font.chars.char[i]);
    }

    const scaleHeight = Number(metadata.font.common._scaleH);
    const scaleWidth = Number(metadata.font.common._scaleW);
    const lineHeight = Number(metadata.font.common._lineHeight);

    for (let i = 0; i < numberOfCharacters; i++) {
      const charCode = text.charCodeAt(i);
      const charData = charMap.get(charCode.toString());
      const charX = Number(charData._x);
      const charY = Number(charData._y);
      const offsetX = Number(charData._xoffset);
      const offsetY = Number(charData._yoffset);
      const charHeight = Number(charData._height);
      const charWidth = Number(charData._width);

      const nextXPos = currentXPos + charWidth / lineHeight;

      vertices[i * 4 + 0] = [currentXPos, -0.5 + (offsetY + charHeight) / lineHeight, 0];
      vertices[i * 4 + 1] = [nextXPos, -0.5 + (offsetY + charHeight) / lineHeight, 0];
      vertices[i * 4 + 2] = [currentXPos, -0.5 + offsetY / lineHeight, 0];
      vertices[i * 4 + 3] = [nextXPos, -0.5 + offsetY / lineHeight, 0];

      normals[i * 4 + 0] = [0, 0, -1];
      normals[i * 4 + 1] = [0, 0, -1];
      normals[i * 4 + 2] = [0, 0, -1];
      normals[i * 4 + 3] = [0, 0, -1];

      index[i] = [0, 1, 2, 1, 3, 2].map(x => x + i * 4);

      texCoords[i * 4 + 0] = [charX / scaleWidth, 1 - (charY + charHeight) / scaleHeight];
      texCoords[i * 4 + 1] = [(charX + charWidth) / scaleWidth, 1 - (charY + charHeight) / scaleHeight];
      texCoords[i * 4 + 2] = [charX / scaleWidth, 1 - charY / scaleHeight];
      texCoords[i * 4 + 3] = [(charX + charWidth) / scaleWidth, 1 - charY / scaleHeight];

      currentXPos = nextXPos + letterSpacing;
    }

    // move the center of the quad to the origin
    const quadWidthOffset = currentXPos / 2;
    for (let i = 0; i < numberOfCharacters * 4; i++) {
      vertices[i][0] -= quadWidthOffset;
    }

    // console.log('vertices before', vertices);
    // vertices.map(vertex => [vertex[0] - quadWidthOffset, vertex[1] + quadHeightOffset, vertex[2]]);
    // console.log('vertices after', vertices);
    return {vertices, normals, index, texCoords};

  }

}
