import {Program} from './luma.gl2/program';
import * as SHADERS from './webgl-renderer/webgl-shaders';

/* shader management should go here */
export class ProgramManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.glContext = this.renderer.glContext;
    this.programs = new Map();
    this.shaderDepot = SHADERS;
    this.programCounter = 0;

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

    let programID = id;
    if (programID === undefined) {
      programID = `unamed_program${this.programCounter++}`;
    }
    const program = new Program(this.renderer.glContext, {
      vs: vsSource,
      fs: fsSource
    });

    this.programs.set(programID, program);
    return programID;
  }

  getProgramByID(id) {
    return this.programs.get(id);
  }

}
