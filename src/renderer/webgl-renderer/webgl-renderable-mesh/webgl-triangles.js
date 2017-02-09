import {WebGLRenderableMesh} from './webgl-renderable-mesh';
import {GL} from '../../luma.gl2/webgl2';

export default class WebGLTriangles extends WebGLRenderableMesh {
  constructor({triangles, renderer}) {
    super({mesh: triangles, renderer});

    // Standard instanced drawing shaders
    let vsSource = `\
    attribute vec3 vertices;
    attribute vec2 texCoords;
    attribute vec3 normals;
    attribute vec4 color;

    attribute vec3 instancePosition;
    attribute vec4 instanceColor;
    attribute float instanceScale;
    attribute vec4 instanceRotation;

    uniform mat4 modelMatrix;
    uniform mat4 viewMatrix;
    uniform mat4 viewProjectionMatrix;

    varying vec4 vColor;
    varying vec2 vTexCoords;
    varying vec3 normal_world;
    varying vec3 position_world;

    vec3 rotate_by_quat(vec3 v, vec4 rotationQuat) {
      // Extract the vector part of the quaternion
      vec3 quat_vector = rotationQuat.xyz;

      // Extract the scalar part of the quaternion
      float quat_scalar = rotationQuat.w;

      // Do the math
      vec3 result = 2.0 * dot(quat_vector, v) * quat_vector
            + (quat_scalar * quat_scalar - dot(quat_vector, quat_vector)) * v
            + 2.0 * quat_scalar * cross(quat_vector, v);

      return result;
    }

    void main(void) {
      vec3 rotated_vertices = rotate_by_quat(vertices, instanceRotation);
      // vec3 rotated_vertices = vertices;
      vec4 position_world_vec4 = modelMatrix * vec4((rotated_vertices * instanceScale + instancePosition), 1.0);
      vec4 position_clipspace = viewProjectionMatrix * position_world_vec4;

      vColor = instanceColor + color;
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
    const float smoothing = 1.0/16.0;
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
        GL.TRIANGLES, this._numberOfVertices, this.renderer.glContext.UNSIGNED_INT, 0, this._numberOfInstances
        );
    } else {
      instancedDrawingExtension.drawElementsInstancedANGLE(
        GL.TRIANGLES, this._numberOfVertices, this.renderer.glContext.UNSIGNED_SHORT, 0, this._numberOfInstances
        );
    }
  }
}
