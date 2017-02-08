import {WebGLRenderableMesh} from './webgl-renderable-mesh';
import {VertexAttribute} from '../../renderable-mesh';

import {GL} from '../../luma.gl2/webgl2';

export default class WebGLTriangles extends WebGLRenderableMesh {
  constructor({triangles, renderer}) {
    super({mesh: triangles, renderer});

    this._numberOfPrimitives = triangles.properties.get('index').hostData.length / 3;

    // Additional properties and properties required for instanced drawing
    this._numberOfInstances = triangles.properties.get('position').hostData.length / 3;

    // All renderable mesh need to have vertice position, texture coords, vertex color and vertex indices
    this.attributes.set(
      'position',
      new VertexAttribute({
        bufferID: this.renderer.bufferManager.newBuffer({
          data: triangles.properties.get('position').hostData,
          size: 3,
          instanced: 1,
          id: `${triangles.id}.position`
        }),
        size: 3,
        instanced: 1
      })
    );

    this.attributes.set(
      'color',
      new VertexAttribute({
        bufferID: this.renderer.bufferManager.newBuffer({
          data: triangles.properties.get('color').hostData,
          size: 4,
          instanced: 1,
          id: `${triangles.id}.color`
        }),
        size: 4,
        instanced: 1
      })
    );

    this.attributes.set(
      'size',
      new VertexAttribute({
        bufferID: this.renderer.bufferManager.newBuffer({
          data: triangles.properties.get('size').hostData,
          size: 1,
          instanced: 1,
          id: `${triangles.id}size`
        }),
        size: 1,
        instanced: 1
      })
    );


    // Standard instanced drawing shaders
    let vsSource = `\
    attribute vec3 vertices;
    attribute vec2 texCoords;
    attribute vec3 normals;

    attribute vec3 position;
    attribute vec4 color;
    attribute float size;

    uniform mat4 modelMatrix;
    uniform mat4 viewMatrix;
    uniform mat4 viewProjectionMatrix;

    varying vec4 vColor;
    varying vec2 vTexCoords;
    varying vec3 normal_world;
    varying vec3 position_world;


    void main(void) {
      vec4 position_world_vec4 = modelMatrix * vec4((vertices * size + position), 1.0);
      vec4 position_clipspace = viewProjectionMatrix * position_world_vec4;

      vColor = color;
      vTexCoords = texCoords;

      vec4 normal_world_vec4 = modelMatrix * vec4(normals.xyz, 1.0);

      normal_world = normalize(normal_world_vec4.xyz / normal_world_vec4.w);
      position_world = position_world_vec4.xyz / position_world_vec4.w;

      gl_Position = position_clipspace;
    }
    `;

    let fsSource = '';
    fsSource += `\
    precision mediump float;

    `;

    if (this._shaderFlags.useColorTexture === true) {
      fsSource += `\
      #define USE_COLOR_TEXTURE
      `;
    }

    if (this._shaderFlags.useSDFTexture === true) {
      fsSource += `\
      #define USE_SDF_TEXTURE
      `;
    }

    fsSource += `\
    #define number_of_lights 2

    varying vec4 vColor;
    varying vec2 vTexCoords;
    varying vec3 normal_world;
    varying vec3 position_world;

    #ifdef USE_BLINN_PHONG_LIGHTING
    uniform vec3 cameraPos;
    uniform vec3 lightDirection[16];
    #endif

    #ifdef USE_COLOR_TEXTURE
    uniform sampler2D colorTex;
    #endif

    #ifdef USE_SDF_TEXTURE
    uniform sampler2D sdfTex;
    const float smoothing = 1.0/8.0;
    #endif

    void main(void) {
      vec4 finalColor = vColor;

    #ifdef USE_COLOR_TEXTURE
      vec4 texColor = texture2D(colorTex, vTexCoords);
      finalColor.rgb += texColor.rgb;
    #endif

    #ifdef USE_SDF_TEXTURE
      // vec4 texSDF = texture2D(sdfTex, vTexCoords);
      // finalColor.rgb += texSDF.rgb;

      float dist = texture2D(sdfTex, vTexCoords).r;
      float alpha = smoothstep(0.5 - smoothing, 0.5 + smoothing, dist);
      finalColor.a = alpha * vColor.a;
      if (finalColor.a < 0.5) discard;
    #endif

    #ifdef USE_BLINN_PHONG_LIGHTING
      finalColor.rgb += vColor.rgb;

      float lightingStrength = 0.0;

      float lambertianStrength = 1.0;
      float specularStrength = 4.0;
      float ambientStrength = 0.2;

      vec3 viewDir = normalize(cameraPos - position_world);

      for (int i = 0; i < number_of_lights; i++) {
        vec3 light_world = lightDirection[i];

        vec3 lightDir = normalize(light_world - position_world);
        vec3 halfwayDir = normalize(lightDir + viewDir);
        //vec3 reflectDir = reflect(-lightDir, normal_world);

        float lambertian = dot(lightDir, normal_world);
        float specular = 0.0;
        if (lambertian > 0.0) {
          float specAngle = max(dot(normal_world, halfwayDir), 0.0);
          specular = pow(specAngle, 32.0);
        }
        lambertian = max(lambertian, 0.0);
        lightingStrength += (ambientStrength + lambertianStrength * lambertian + specularStrength * specular) / float(number_of_lights);
      }
      finalColor *= lightingStrength;
    #endif

      gl_FragColor = finalColor;
    }
    `;


    this._programID = this.renderer.programManager.newProgramFromShaders({
      vsSource,
      fsSource
    });
  }

  render(cameraUniforms) {
    super.render(cameraUniforms);

    const instancedDrawingExtension = this.renderer.glContext.getExtension('ANGLE_instanced_arrays');

    if (this._uint32Indices === true) {
      instancedDrawingExtension.drawElementsInstancedANGLE(
        GL.TRIANGLES, this._numberOfPrimitives * 3, this.renderer.glContext.UNSIGNED_INT, 0, this._numberOfInstances
        );
    } else {
      instancedDrawingExtension.drawElementsInstancedANGLE(
        GL.TRIANGLES, this._numberOfPrimitives * 3, this.renderer.glContext.UNSIGNED_SHORT, 0, this._numberOfInstances
        );
    }
  }
}
