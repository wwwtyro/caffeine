precision highp float;

uniform sampler2D source;
uniform float count;

varying vec2 uv;

void main() {
  vec3 src = texture2D(source, uv).rgb/count;
  src = pow(src, vec3(1.0/2.2));
  gl_FragColor = vec4(src, 1.0);
}
