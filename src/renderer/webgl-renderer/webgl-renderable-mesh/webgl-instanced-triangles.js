import {WebGLRenderableMesh} from './webgl-renderable-mesh';
import {GL} from '../../luma.gl2/webgl2';

export default class WebGLInstancedTriangleMesh extends WebGLRenderableMesh {
  constructor({instancedTriangleMesh, renderer}) {
    super({mesh: instancedTriangleMesh, renderer});

    this._numberOfPrimitives = instancedTriangleMesh.properties.get('index').hostData.length / 3;

    // Additional properties and properties required for instanced drawing
    this._numberOfInstances = instancedTriangleMesh.properties.get('instancedPosition').hostData.length / 3;

    // All renderable mesh need to have vertice position, texture coords, vertex color and vertex indices

    this._vertexAttributes.set(
      'instancedPosition',
      {
        bufferID: this.renderer.bufferManager.newBuffer({
          data: instancedTriangleMesh.properties.get('instancedPosition').hostData,
          size: 3,
          instanced: 1,
          id: instancedTriangleMesh.id + '_instanced_position'
        }),
        size: 3,
        instanced: 1
      }
    );

    this._vertexAttributes.set(
      'instancedColor',
      {
        bufferID: this.renderer.bufferManager.newBuffer({
          data: instancedTriangleMesh.properties.get('instancedColor').hostData,
          size: 4,
          instanced: 1,
          id: instancedTriangleMesh.id + '_instanced_color'
        }),
        size: 4,
        instanced: 1
      }
    );

    this._vertexAttributes.set(
      'instancedRadius',
      {
        bufferID: this.renderer.bufferManager.newBuffer({
          data: instancedTriangleMesh.properties.get('instancedRadius').hostData,
          size: 1,
          instanced: 1,
          id: instancedTriangleMesh.id + '_instanced_radius'
        }),
        size: 1,
        instanced: 1
      }
    );

    // Standard instanced drawing shaders
    const vsSource = `\
    attribute vec3 position;
    attribute vec4 color;
    attribute vec2 texCoords;
    attribute vec3 normals;

    attribute vec3 instancedPosition;
    attribute vec4 instancedColor;
    attribute float instancedRadius;

    uniform mat4 modelMatrix;
    uniform mat4 viewMatrix;
    uniform mat4 viewProjectionMatrix;

    varying vec4 vColor;
    varying vec2 vTexCoords;
    varying vec3 normal_world;
    varying vec3 position_world;


    void main(void) {
      vec4 position_world_vec4 = modelMatrix * vec4((position * instancedRadius + instancedPosition), 1.0);
      vec4 position_clipspace = viewProjectionMatrix * position_world_vec4;

      vColor = instancedColor;
      vTexCoords = texCoords;

      vec4 normal_world_vec4 = modelMatrix * vec4(normals.xyz, 1.0);

      normal_world = normalize(normal_world_vec4.xyz / normal_world_vec4.w);
      position_world = position_world_vec4.xyz / position_world_vec4.w;

      gl_Position = position_clipspace;
    }
    `;

    const fsSource = `\
    #ifdef GL_ES
    precision highp float;
    #endif
    #define number_of_lights 2

    varying vec4 vColor;
    varying vec2 vTexCoords;
    varying vec3 normal_world;
    varying vec3 position_world;

    uniform vec3 cameraPos;
    uniform vec3 lightDirection[16];
    void main(void) {
      vec3 lightingColor = vec3(0.0, 0.0, 0.0);

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
        lightingColor += vColor.rgb * (ambientStrength + lambertianStrength * lambertian + specularStrength * specular) / float(number_of_lights);
      }
      gl_FragColor = vec4(lightingColor.xyz, vColor.a);
    }
    `;

    this._programID = this.renderer.programManager.newProgramFromShaders({
      vsSource,
      fsSource
    });
  }

  render(cameraUniforms) {
    super.render(cameraUniforms);
    // Non-instanced attribute has to be set before instanced attribute for it to work
    // this.getProgramByID(this._programID).setBuffers({
    //   normals: buffer4
    // });

    // Additional properties (instance drawing related)
    /* because setBuffers are separated into two calls between super class's render()
    and sub class's render(), luma.gl will complain that some properties are not supplied
    in the first setBuffers() call. But the rendering works fine */
    // this.getProgramByID(this._programID).setBuffers({
    //   instancedPosition: this.getBufferByID('instancedPosition'),
    //   instancedColor: this.getBufferByID('instancedColor'),
    //   instancedRadius: this.getBufferByID('instancedRadius')
    // });

    // console.log("camera pos", cameraUniforms.cameraPosition);

    const instancedDrawingExtension = this.renderer.glContext.getExtension('ANGLE_instanced_arrays');
    if (this._uint32Indices === true) {
      instancedDrawingExtension.drawElementsInstancedANGLE(
        GL.TRIANGLES, this._numberOfPrimitives * 3, this.renderer.glContext.UNSIGNED_INT, 0, this._numberOfInstances
        );
    }
    else {
      instancedDrawingExtension.drawElementsInstancedANGLE(
        GL.TRIANGLES, this._numberOfPrimitives * 3, this.renderer.glContext.UNSIGNED_SHORT, 0, this._numberOfInstances
        );
    }
  }
}
