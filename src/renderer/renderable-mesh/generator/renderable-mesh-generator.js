import {WebGLRenderer, WebGL2Renderer} from '../../';
import {Lines, Spheres, TriangleMesh, Circles, Text2d} from '../../../mesh';
import {WebGLTriangles, WebGLLines} from '../webgl-renderable-mesh';

import {VertexAttribute} from '../vertex-attribute';

import {vec3, vec4} from 'gl-matrix';
import {GL} from '../../luma.gl2/webgl2';
import {flatten2D} from '../../../lib/utils/flatten';

import {fontInfo} from '../../font';

function getMiddlePoint(a, b) {
  const x = (a[0] + b[0]) / 2;
  const y = (a[1] + b[1]) / 2;
  const z = (a[2] + b[2]) / 2;
  const length = Math.sqrt(x * x + y * y + z * z);

  return [x / length, y / length, z / length];
}

export class RenderableMeshGenerator {

  static generate({mesh, renderer}) {
    let renderableMesh;
    switch (renderer.constructor) {
    /* WebGL */
    case WebGLRenderer:
      switch (mesh.constructor) {
      case Spheres:
        renderableMesh = RenderableMeshGenerator.generateWebGLTrianglesFromSpheres({mesh, renderer});
        break;
      case Circles:
        renderableMesh = RenderableMeshGenerator.generateWebGLTrianglesFromCircles({mesh, renderer});
        break;
      case TriangleMesh:
        renderableMesh = RenderableMeshGenerator.generateWebGLTrianglesFromTriangleMesh({mesh, renderer});
        break;
      case Lines:
        renderableMesh = RenderableMeshGenerator.generateWebGLLinesFromLines({mesh, renderer});
        break;
      case Text2d:
        renderableMesh = RenderableMeshGenerator.generateWebGLTrianglesFromText2d({mesh, renderer});
        break;
      default:
        throw Error('Unknown type of mesh!');
      }
      break;
    /* WebGL2 */
    case WebGL2Renderer:
      switch (mesh.constructor) {
      case Spheres:
        renderableMesh = RenderableMeshGenerator.generateWebGL2TrianglesFromSpheres({mesh, renderer});
        break;
      case Circles:
        renderableMesh = RenderableMeshGenerator.generateWebGL2TrianglesFromCircles({mesh, renderer});
        break;
      case TriangleMesh:
        renderableMesh = RenderableMeshGenerator.generateWebGL2TrianglesFromTriangleMesh({mesh, renderer});
        break;
      case Lines:
        renderableMesh = RenderableMeshGenerator.generateWebGL2LinesFromLines({mesh, renderer});
        break;
      default:
        throw Error('Unknown type of mesh!');
      }
      break;
    default:
      throw Error('Unknown type of renderer!');
    }

    return renderableMesh;
  }

  static generateWebGLTrianglesFromSpheres({mesh, renderer}) {

    const outputMesh = new WebGLTriangles({mesh, renderer});

    const X = 0.525731112119133606;
    const Z = 0.850650808352039932;
    const refineLevel = 2;

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
    const icosahedronVertTexCoords = new Float32Array(icosahedronVert.length * 2);
    // color is not used for now
    const icosahedronVertColor = new Float32Array(icosahedronVert.length * 4);

    mesh.icosahedronVert = icosahedronVert;
    mesh.icosahedronVertIndex = icosahedronVertIndex;
    mesh.icosahedronVertTexCoords = icosahedronVertTexCoords;
    mesh.icosahedronVertColor = icosahedronVertColor;

    outputMesh.numberOfVertices = icosahedronVertIndex.length;

    // Generating vertex attribute
    outputMesh.addVertexAttribute('vertices', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.vertices`,
        data: new Float32Array(flatten2D(icosahedronVert)),
        size: 3,
        instanced: 0
      }),
      size: 3,
      instanced: 0
    }));

    outputMesh.addVertexAttribute('normals', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.normals`,
        data: new Float32Array(flatten2D(icosahedronVert)),
        size: 3,
        instanced: 0
      }),
      size: 3,
      instanced: 0
    }));

    outputMesh.addVertexAttribute('index', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.index`,
        data: new Uint16Array(flatten2D(icosahedronVertIndex)),
        size: 1,
        instanced: 0,
        target: GL.ELEMENT_ARRAY_BUFFER
      }),
      size: 1,
      instanced: 0,
      target: GL.ELEMENT_ARRAY_BUFFER
    }));

    mesh.uint32Indices = false;
    // const supported = this.renderer.glContext.getExtension('OES_element_index_uint');
    // if (supported === null) {
    //   console.log(`OES_element_index_uint not supported.
    //     Please check the type of your vertex indices array!!!`);
    // }

    outputMesh.addVertexAttribute('texCoords', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.texCoords`,
        data: new Float32Array(flatten2D(icosahedronVertTexCoords)),
        size: 2,
        instanced: 0
      }),
      size: 2,
      instanced: 0
    }));

    outputMesh.addVertexAttribute('color', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.color`,
        data: new Float32Array(flatten2D(icosahedronVertColor)),
        size: 4,
        instanced: 0
      }),
      size: 4,
      instanced: 0
    }));

    // Instanced vertex attribute
    const position = mesh.getDataForPropertyID('position');
    const colorIns = mesh.getDataForPropertyID('color');
    const scale = mesh.getDataForPropertyID('size');
    const rotation = mesh.getDataForPropertyID('rotation');

    outputMesh.numberOfInstances = position.length;

    outputMesh.addVertexAttribute('instancePosition', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.instancePosition`,
        data: new Float32Array(flatten2D(position)),
        size: 3,
        instanced: 1
      }),
      size: 3,
      instanced: 1
    }));

    outputMesh.addVertexAttribute('instanceColor', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.instanceColor`,
        data: new Float32Array(flatten2D(colorIns)),
        size: 4,
        instanced: 1
      }),
      size: 4,
      instanced: 1
    }));

    outputMesh.addVertexAttribute('instanceScale', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.instanceScale`,
        data: new Float32Array(flatten2D(scale)),
        size: 1,
        instanced: 1
      }),
      size: 1,
      instanced: 1
    }));

    outputMesh.addVertexAttribute('instanceRotation', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.instanceRotation`,
        data: new Float32Array(flatten2D(rotation)),
        size: 4,
        instanced: 1
      }),
      size: 4,
      instanced: 1
    }));

    // TODO: add texture support for icosphere

    outputMesh.propertyAttributeMap = new Map();
    outputMesh.propertyAttributeMap.set('position', 'instancePosition');
    outputMesh.propertyAttributeMap.set('color', 'instanceColor');
    outputMesh.propertyAttributeMap.set('size', 'instanceScale');
    outputMesh.propertyAttributeMap.set('rotation', 'instanceRotation');

    outputMesh.generateProgram();

    outputMesh.updateAttributes = x => {
      const {properties} = x;
      for (const propertyID of properties.keys()) {
        const attributeID = outputMesh.propertyAttributeMap.get(propertyID);
        const data = outputMesh.mesh.getDataForPropertyID(propertyID);
        const buffer = outputMesh.getVertexAttributeBufferByID(attributeID);
        if (buffer === undefined) {
          throw Error(`No buffer for attribute name: ${attributeID}`);
        }
        /* TODO: we are creating a new Float32Array every time when the data are updated. Need to get this fixed*/
        buffer.setData({
          data: new Float32Array(flatten2D(data)),
          size: outputMesh.attributes.get(attributeID).size,
          target: outputMesh.attributes.get(attributeID).target,
          instanced: outputMesh.attributes.get(attributeID).instanced
        });
      }
    };

    return outputMesh;
  }

  static generateWebGLTrianglesFromCircles({mesh, renderer}) {

    const outputMesh = new WebGLTriangles({mesh, renderer});

    const numSections = 16;

    const vertices = new Array(numSections + 1);
    const normals = new Array(numSections + 1);
    const index = new Array(numSections);
    const texCoords = new Array(numSections + 1);
    const color = new Array(numSections + 1);

    for (let i = 0; i < numSections; i++) {
      vertices[i] = [Math.cos(Math.PI * 2 * i / numSections), Math.sin(Math.PI * 2 * i / numSections), 0];
      normals[i] = [0, 0, -1];
      texCoords[i] = [(Math.cos(Math.PI * 2 * i / numSections) + 1) / 2, (Math.sin(Math.PI * 2 * i / numSections) + 1) / 2];
      color[i] = [0, 0, 0, 0];

      index[i] = [i, (i + 1) % numSections, numSections];
    }

    vertices[numSections] = [0, 0, 0];
    normals[numSections] = [0, 0, -1];
    texCoords[numSections] = [0.5, 0.5];
    color[numSections] = [0, 0, 0, 0];

    mesh.circleVertices = vertices;
    mesh.circleNormals = normals;
    mesh.circleTexCoords = texCoords;
    mesh.circleColor = color;
    mesh.circleIndex = index;

    outputMesh.numberOfVertices = index.length * 3;

    // Generating vertex attribute
    outputMesh.addVertexAttribute('vertices', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.vertices`,
        data: new Float32Array(flatten2D(vertices)),
        size: 3,
        instanced: 0
      }),
      size: 3,
      instanced: 0
    }));

    outputMesh.addVertexAttribute('normals', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.normals`,
        data: new Float32Array(flatten2D(normals)),
        size: 3,
        instanced: 0
      }),
      size: 3,
      instanced: 0
    }));

    outputMesh.addVertexAttribute('index', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.index`,
        data: new Uint16Array(flatten2D(index)),
        size: 1,
        instanced: 0,
        target: GL.ELEMENT_ARRAY_BUFFER
      }),
      size: 1,
      instanced: 0,
      target: GL.ELEMENT_ARRAY_BUFFER
    }));

    outputMesh.uint32Indices = false;
    // const supported = this.renderer.glContext.getExtension('OES_element_index_uint');
    // if (supported === null) {
    //   console.log(`OES_element_index_uint not supported.
    //     Please check the type of your vertex indices array!!!`);
    // }

    outputMesh.addVertexAttribute('texCoords', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.texCoords`,
        data: new Float32Array(flatten2D(texCoords)),
        size: 2,
        instanced: 0
      }),
      size: 2,
      instanced: 0
    }));

    outputMesh.addVertexAttribute('color', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.color`,
        data: new Float32Array(flatten2D(color)),
        size: 4,
        instanced: 0
      }),
      size: 4,
      instanced: 0
    }));

    // Instanced vertex attribute
    const position = mesh.getDataForPropertyID('position');
    const colorIns = mesh.getDataForPropertyID('color');
    const scale = mesh.getDataForPropertyID('size');
    const rotation = mesh.getDataForPropertyID('rotation');

    outputMesh.numberOfInstances = position.length;

    outputMesh.addVertexAttribute('instancePosition', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.instancePosition`,
        data: new Float32Array(flatten2D(position)),
        size: 3,
        instanced: 1
      }),
      size: 3,
      instanced: 1
    }));

    outputMesh.addVertexAttribute('instanceColor', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.instanceColor`,
        data: new Float32Array(flatten2D(colorIns)),
        size: 4,
        instanced: 1
      }),
      size: 4,
      instanced: 1
    }));

    outputMesh.addVertexAttribute('instanceScale', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.instanceScale`,
        data: new Float32Array(flatten2D(scale)),
        size: 1,
        instanced: 1
      }),
      size: 1,
      instanced: 1
    }));

    outputMesh.addVertexAttribute('instanceRotation', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.instanceRotation`,
        data: new Float32Array(flatten2D(rotation)),
        size: 4,
        instanced: 1
      }),
      size: 4,
      instanced: 1
    }));

    // TODO: add texture support for circles

    outputMesh.propertyAttributeMap = new Map();
    outputMesh.propertyAttributeMap.set('position', 'instancePosition');
    outputMesh.propertyAttributeMap.set('color', 'instanceColor');
    outputMesh.propertyAttributeMap.set('size', 'instanceScale');
    outputMesh.propertyAttributeMap.set('rotation', 'instanceRotation');

    outputMesh.generateProgram();

    outputMesh.updateAttributes = x => {
      const {properties} = x;
      for (const propertyID of properties.keys()) {
        const attributeID = outputMesh.propertyAttributeMap.get(propertyID);
        const data = outputMesh.mesh.getDataForPropertyID(propertyID);
        const buffer = outputMesh.getVertexAttributeBufferByID(attributeID);
        if (buffer === undefined) {
          throw Error(`No buffer for attribute name: ${attributeID}`);
        }
        /* TODO: we are creating a new Float32Array every time when the data are updated. Need to get this fixed*/
        buffer.setData({
          data: new Float32Array(flatten2D(data)),
          size: outputMesh.attributes.get(attributeID).size,
          target: outputMesh.attributes.get(attributeID).target,
          instanced: outputMesh.attributes.get(attributeID).instanced
        });
      }
    };

    return outputMesh;
  }

  static generateWebGLLinesFromLines({mesh, renderer}) {

    const outputMesh = new WebGLLines({mesh, renderer});

    // Instanced vertex attribute
    const vertices = mesh.getDataForPropertyID('vertices');
    const normals = mesh.getDataForPropertyID('normals');
    const texCoords = mesh.getDataForPropertyID('texCoords');
    const color = mesh.getDataForPropertyID('color');
    const index = mesh.getDataForPropertyID('index');

    outputMesh.numberOfVertices = index.length;

    outputMesh.addVertexAttribute('vertices', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.vertices`,
        data: new Float32Array(flatten2D(vertices)),
        size: 3,
        instanced: 0
      }),
      size: 3,
      instanced: 0
    }));

    outputMesh.addVertexAttribute('normals', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.normals`,
        data: new Float32Array(flatten2D(normals)),
        size: 3,
        instanced: 0
      }),
      size: 3,
      instanced: 0
    }));

    outputMesh.addVertexAttribute('texCoords', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.texCoords`,
        data: new Float32Array(flatten2D(texCoords)),
        size: 2,
        instanced: 0
      }),
      size: 2,
      instanced: 0
    }));

    outputMesh.addVertexAttribute('color', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.color`,
        data: new Float32Array(flatten2D(color)),
        size: 4,
        instanced: 0
      }),
      size: 4,
      instanced: 0
    }));

    outputMesh.addVertexAttribute('index', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.index`,
        data: new Uint16Array(flatten2D(index)),
        size: 1,
        instanced: 0,
        target: GL.ELEMENT_ARRAY_BUFFER
      }),
      size: 1,
      instanced: 0,
      target: GL.ELEMENT_ARRAY_BUFFER
    }));

    outputMesh.uint32Indices = false;
    // const supported = this.renderer.glContext.getExtension('OES_element_index_uint');
    // if (supported === null) {
    //   console.log(`OES_element_index_uint not supported.
    //     Please check the type of your vertex indices array!!!`);
    // }

    outputMesh.numberOfInstances = index.length;

    return outputMesh;
  }

  static generateWebGLTrianglesFromText2d({mesh, renderer}) {
    const outputMesh = new WebGLTriangles({mesh, renderer});

    const texts = mesh.getDataForPropertyID('texts');
    const metadata = fontInfo.metadata;

    const numberOfLabels = texts.length;

    let vertices = [];
    let normals = [];
    let index = [];
    let texCoords = [];
    let indexStart = 0;
    const letterSpacing = 0.1;

    for (let i = 0; i < numberOfLabels; i++) {
      const text = texts[i];
      const numberOfCharacters = text.length;

      // as proportion of line height

      const labelVertices = new Array(numberOfCharacters * 4);
      const labelNormals = new Array(numberOfCharacters * 4);
      const labelIndex = new Array(numberOfCharacters);
      const labelTexCoords = new Array(numberOfCharacters * 4);

      const charMap = new Map();

      let currentXPos = 0;

      for (let j = 0; j < metadata.font.chars._count; j++) {
        charMap.set(metadata.font.chars.char[j]._id, metadata.font.chars.char[j]);
      }

      const scaleHeight = Number(metadata.font.common._scaleH);
      const scaleWidth = Number(metadata.font.common._scaleW);
      const lineHeight = Number(metadata.font.common._lineHeight);

      for (let j = 0; j < numberOfCharacters; j++) {
        const charCode = text.charCodeAt(j);
        const charData = charMap.get(charCode.toString());
        const charX = Number(charData._x);
        const charY = Number(charData._y);
        const offsetX = Number(charData._xoffset);
        const offsetY = Number(charData._yoffset);
        const charHeight = Number(charData._height);
        const charWidth = Number(charData._width);

        const nextXPos = currentXPos + charWidth / lineHeight;

        labelVertices[j * 4 + 0] = [currentXPos, -0.5 + (offsetY + charHeight) / lineHeight, 0];
        labelVertices[j * 4 + 1] = [nextXPos, -0.5 + (offsetY + charHeight) / lineHeight, 0];
        labelVertices[j * 4 + 2] = [currentXPos, -0.5 + offsetY / lineHeight, 0];
        labelVertices[j * 4 + 3] = [nextXPos, -0.5 + offsetY / lineHeight, 0];

        labelNormals[j * 4 + 0] = [0, 0, -1];
        labelNormals[j * 4 + 1] = [0, 0, -1];
        labelNormals[j * 4 + 2] = [0, 0, -1];
        labelNormals[j * 4 + 3] = [0, 0, -1];

        labelIndex[j] = [0, 1, 2, 1, 3, 2].map(x => x + j * 4 + indexStart);

        labelTexCoords[j * 4 + 0] = [charX / scaleWidth, 1 - (charY + charHeight) / scaleHeight];
        labelTexCoords[j * 4 + 1] = [(charX + charWidth) / scaleWidth, 1 - (charY + charHeight) / scaleHeight];
        labelTexCoords[j * 4 + 2] = [charX / scaleWidth, 1 - charY / scaleHeight];
        labelTexCoords[j * 4 + 3] = [(charX + charWidth) / scaleWidth, 1 - charY / scaleHeight];

        currentXPos = nextXPos + letterSpacing;
      }

      const quadWidthOffset = currentXPos / 2;
      for (let j = 0; j < numberOfCharacters * 4; j++) {
        // move the center of the quad to the origin
        labelVertices[j][0] -= quadWidthOffset;
      }

      vertices = vertices.concat(labelVertices);
      normals = normals.concat(labelNormals);
      index = index.concat(labelIndex);
      texCoords = texCoords.concat(labelTexCoords);

      indexStart += numberOfCharacters * 4;
    }

    outputMesh.vertices = vertices;
    outputMesh.normals = normals;
    outputMesh.index = index;
    outputMesh.texCoords = texCoords;

    outputMesh.numberOfVertices = index.length * 6;

    // Transform vertices
    const transformPosition = mesh.getDataForPropertyID('position');
    const outputColor = mesh.getDataForPropertyID('color');
    const transformSize = mesh.getDataForPropertyID('size');
    const transformRotation = mesh.getDataForPropertyID('rotation');

    // TODO: transformTextQuads is called at every data update.
    // We probably don't want to allocate a new vertices array in transformTextQuads
    outputMesh.outputVertices = Array.from({length: outputMesh.vertices.length}).map(x => [0, 0, 0]);
    outputMesh.outputColor = Array.from({length: outputMesh.vertices.length}).map(x => [1, 1, 1, 1]);

    let vertexCounter = 0;

    for (let i = 0; i < numberOfLabels; i++) {
      const numberOfCharacters = texts[i].length;

      for (let j = 0; j < numberOfCharacters * 4; j++) {
        const vertex = outputMesh.outputVertices[vertexCounter];

        for (let k = 0; k < 3; k++) {
          vertex[k] = outputMesh.outputVertices[i][k];
        }

        if (transformSize) {
          for (let k = 0; k < 3; k++) {
            vertex[k] *= transformSize[i];
          }
        }

        if (transformRotation) {
          rotateByQuat(vertex, transformRotation[i]);
        }

        if (transformPosition) {
          for (let k = 0; k < 3; k++) {
            vertex[k] += transformPosition[i][k];
          }
        }

        if (outputColor) {
          outputMesh.outputColor[vertexCounter] = outputColor[i];
        }

        vertexCounter++;
      }
    }

    // Generating vertex attribute
    outputMesh.addVertexAttribute('vertices', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.vertices`,
        data: new Float32Array(flatten2D(outputMesh.outputVertices)),
        size: 3,
        instanced: 0
      }),
      size: 3,
      instanced: 0
    }));

    outputMesh.addVertexAttribute('normals', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.normals`,
        data: new Float32Array(flatten2D(outputMesh.normals)),
        size: 3,
        instanced: 0
      }),
      size: 3,
      instanced: 0
    }));

    outputMesh.addVertexAttribute('index', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.index`,
        data: new Uint16Array(flatten2D(outputMesh.index)),
        size: 1,
        instanced: 0,
        target: GL.ELEMENT_ARRAY_BUFFER
      }),
      size: 1,
      instanced: 0,
      target: GL.ELEMENT_ARRAY_BUFFER
    }));

    outputMesh.uint32Indices = false;
    // const supported = this.renderer.glContext.getExtension('OES_element_index_uint');
    // if (supported === null) {
    //   console.log(`OES_element_index_uint not supported.
    //     Please check the type of your vertex indices array!!!`);
    // }

    outputMesh.addVertexAttribute('texCoords', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.texCoords`,
        data: new Float32Array(flatten2D(outputMesh.texCoords)),
        size: 2,
        instanced: 0
      }),
      size: 2,
      instanced: 0

    }));

    outputMesh.addVertexAttribute('color', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.color`,
        data: new Float32Array(flatten2D(outputMesh.outputColor)),
        size: 4,
        instanced: 0
      }),
      size: 4,
      instanced: 0
    }));

    outputMesh.numberOfInstances = 1;

    outputMesh.addVertexAttribute('instancePosition', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.instancePosition`,
        data: new Float32Array([0, 0, 0]),
        size: 3,
        instanced: 1
      }),
      size: 3,
      instanced: 1
    }));

    outputMesh.addVertexAttribute('instanceColor', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.instanceColor`,
        data: new Float32Array([0, 0, 0, 0]),
        size: 4,
        instanced: 1
      }),
      size: 4,
      instanced: 1
    }));

    outputMesh.addVertexAttribute('instanceScale', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.instanceScale`,
        data: new Float32Array([1]),
        size: 1,
        instanced: 1
      }),
      size: 1,
      instanced: 1
    }));

    outputMesh.addVertexAttribute('instanceRotation', new VertexAttribute({
      bufferID: renderer.bufferManager.newBuffer({
        id: `${mesh.id}.instanceRotation`,
        data: new Float32Array([0, 0, 0, 1]),
        size: 4,
        instanced: 1
      }),
      size: 4,
      instanced: 1
    }));

    outputMesh.textures.set('sdfTex', 'glyphAtlas');

    outputMesh.shaderFlags = {
      useSDFTexture: true,
      useColorTexture: false
    };

    outputMesh.generateProgram();

    outputMesh.updateAttributes = x => {
      const {properties} = x;
      if (properties.size > 0) {

        // Transform vertices
        const updatePosition = mesh.getDataForPropertyID('position');
        const updateColor = mesh.getDataForPropertyID('color');
        const updateSize = mesh.getDataForPropertyID('size');
        const updateRotation = mesh.getDataForPropertyID('rotation');

        vertexCounter = 0;

        for (let i = 0; i < numberOfLabels; i++) {
          const numberOfCharacters = texts[i].length;

          for (let j = 0; j < numberOfCharacters * 4; j++) {
            const vertex = outputMesh.outputVertices[vertexCounter];

            // set the vertices position to untransformed state
            for (let k = 0; k < 3; k++) {
              vertex[k] = outputMesh.vertices[vertexCounter][k];
            }

            if (updateSize) {
              for (let k = 0; k < 3; k++) {
                vertex[k] *= updateSize[i];
              }
            }

            if (updateRotation) {
              rotateByQuat(vertex, updateRotation[i]);
            }

            if (updatePosition) {
              for (let k = 0; k < 3; k++) {
                vertex[k] += updatePosition[i][k];
              }
            }

            if (updateColor) {
              outputMesh.outputColor[vertexCounter] = updateColor[i];
            }

            vertexCounter++;
          }
        }

        let attributeID;
        let buffer;

        if (updatePosition || updateSize || updateRotation) {
          attributeID = 'vertices';
          buffer = outputMesh.getVertexAttributeBufferByID(attributeID);
          if (buffer === undefined) {
            throw Error(`No buffer for attribute name: ${attributeID}`);
          }
          buffer.setData({
            data: new Float32Array(flatten2D(outputMesh.outputVertices)),
            size: outputMesh.attributes.get(attributeID).size,
            target: outputMesh.attributes.get(attributeID).target,
            instanced: outputMesh.attributes.get(attributeID).instanced
          });
        }

        if (updateColor) {
          attributeID = 'color';
          buffer = outputMesh.getVertexAttributeBufferByID(attributeID);
          if (buffer === undefined) {
            throw Error(`No buffer for attribute name: ${attributeID}`);
          }
          /* TODO */
          buffer.setData({
            data: new Float32Array(flatten2D(outputMesh.outputColor)),
            size: outputMesh.attributes.get(attributeID).size,
            target: outputMesh.attributes.get(attributeID).target,
            instanced: outputMesh.attributes.get(attributeID).instanced
          });
        }
      }
    };

    return outputMesh;
  }
}

function rotateByQuat(v, rotationQuat) {
  /*
  vec3 result = 2.0 * dot(quat_vector, v) * quat_vector
        + (quat_scalar * quat_scalar - dot(quat_vector, quat_vector)) * v
        + 2.0 * quat_scalar * cross(quat_vector, v);
  */

  // Extract the vector part of the quaternion
  const quatVector = vec3.fromValues(rotationQuat[0], rotationQuat[1], rotationQuat[2]);
  const quatScalar = rotationQuat[3];

  // Do the math
  const firstPart = vec3.scale([], quatVector, vec3.dot(quatVector, v) * 2.0);
  const secondPart = vec3.scale([], v, (quatScalar * quatScalar - vec3.dot(quatVector, quatVector)));
  const thirdPart = vec3.scale([], vec3.cross([], quatVector, v), 2.0 * quatScalar);

  const result = vec3.add([], vec3.add([], firstPart, secondPart), thirdPart);

  v[0] = result[0];
  v[1] = result[1];
  v[2] = result[2];

}
