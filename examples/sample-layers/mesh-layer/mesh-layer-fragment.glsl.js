const carLayerFragment = `
#define SHADER_NAME mesh-layer-fs

#ifdef GL_ES
precision highp float;
#endif

// uniform bool hasTexture1;
uniform sampler2D sampler1;
uniform float renderPickingBuffer;
uniform float opacity;
uniform float desaturate;
uniform float brightness;

varying vec2 vTexCoord;
varying vec4 vPickingColor;
varying float vLightWeight;

// apply desaturation and brightness
vec3 color_transform(vec3 color) {
  float luminance = (color.r + color.g + color.b) * 0.333333333 + brightness;
  return mix(color, vec3(luminance), desaturate);
}

void main(void) {
  vec4 color = texture2D(sampler1, vTexCoord);
  color = vec4(color_transform(color.rgb), color.a * opacity);
  gl_FragColor = mix(color * vLightWeight, vPickingColor, renderPickingBuffer);
}
`;

export default carLayerFragment;
