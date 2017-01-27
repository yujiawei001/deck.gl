import {GL} from './webgl2';
import {assertWebGL2Context} from './webgl2-checks';
import {Program} from './program';

export class TransformFeedbackProgram extends Program {
  constructor(gl, {
    id,
    vs,
    fs,
    defaultUniforms,
    handle,
    transformFeedbackVaryings
  } = {}) {
    super(gl, {id, vs, fs, defaultUniforms, handle, transformFeedbackVaryings});
    this.transformFeedbackHandle = gl.createTransformFeedback();

  }

  setFeedbackBuffers(buffers, {drawParams = {}} = {}) {
    const {gl} = this;
    if (Array.isArray(buffers)) {
      throw new Error('Program.setFeedbackBuffers expects map of buffers');
    }

    // const {locations, elements} = this._sortBuffersByLocation(buffers);
    const locations = [];
    for (const key in buffers) {
      locations.push(key);
    }

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.transformFeedbackHandle);

    for (let location = 0; location < locations.length; location++) {
      const bufferName = locations[location];
      const buffer = buffers[bufferName];
      if (buffer !== undefined) {
        buffer.bindBase({target: gl.TRANSFORM_FEEDBACK_BUFFER, index: location});
      }
    }
  }

  execute({numberItems}) {
    const {gl} = this;
    gl.bindFramebuffer(GL.FRAMEBUFFER, null);
    gl.enable(gl.RASTERIZER_DISCARD);
    gl.beginTransformFeedback(gl.POINTS);
    gl.drawArrays(gl.POINTS, 0, numberItems);
    gl.endTransformFeedback();
    gl.disable(gl.RASTERIZER_DISCARD);
  }

  getData(buffers) {
    for (const key in buffers) {
      buffers[key].getSubData({});
    }
  }

  bufferToTexture(buffers) {
    for (const key in buffers) {
      buffers[key].bind({target: gl.PIXEL_UNPACK_BUFFER});

    }
  }
}
