import {Program} from './luma.gl2/program';
import * as SHADERS from './webgl-renderer/webgl-shaders';

/* shader management should go here */
export class ProgramManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.glContext = this.renderer.glContext;
    this.programs = new Map();
    this.shaderDepot = SHADERS;

    // Create a bunch of default programs
    const vsDefault = `\
      ${this.shaderDepot.defaultVs.interface}
        void main(void) {
        vec4 position_clipspace = vec4(0.0, 0.0, 0.0, 1.0);
        ${this.shaderDepot.defaultVs.body}
        gl_Position = position_clipspace;
      }`;

    const fsPassthrough = `\
      ${this.shaderDepot.passThroughFs.interface}
      void main(void) {
        vec4 finalColor = vec4(1.0, 1.0, 1.0, 1.0);
        ${this.shaderDepot.passThroughFs.body}
        gl_FragColor = finalColor;
      }`;

    const defaultProgram = new Program(this.glContext, {
      vs: vsDefault,
      fs: fsPassthrough
    });

    this.programs.set('default', defaultProgram);

    const vsScreenQuad = `\
      ${this.shaderDepot.screenQuadVs.interface}
      void main(void) {
        vec4 position_clipspace = vec4(0.0, 0.0, 0.0, 1.0);
        ${this.shaderDepot.screenQuadVs.body}
        gl_Position = position_clipspace;
      }`;

    const fsScreenQuad = `\
      ${this.shaderDepot.simpleTextureFs.interface}
      void main(void) {
        vec4 finalColor = vec4(1.0, 1.0, 1.0, 1.0);
        ${this.shaderDepot.simpleTextureFs.body}
        gl_FragColor = finalColor;
      }`;
    const screenQuadProgram = new Program(this.glContext, {
      vs: vsScreenQuad,
      fs: fsScreenQuad
    });

    this.programs.set('screenQuad', screenQuadProgram);
  }

  newProgramFromShaders({vsSource, fsSource, id}) {
    const program = new Program(this.renderer.glContext, {
      vs: vsSource,
      fs: fsSource
    });

    this.programs.set(id, program);
    return id;
  }

  getProgramByID(id) {
    return this.programs.get(id);
  }

}
