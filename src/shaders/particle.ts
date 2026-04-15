export const particleVertexShader = `
  uniform float uPixelRatio;
  uniform float uSize;
  attribute vec3 color;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uSize * uPixelRatio * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const particleFragmentShader = `
  varying vec3 vColor;
  void main() {
    // d: 0 at center, 1 at edge
    float d = length(gl_PointCoord - vec2(0.5)) * 2.0;
    if (d > 1.0) discard;

    // Cubic falloff — concentrated neon light distribution
    float t = 1.0 - d;
    float glow = t * t * t;

    // Tight white-hot pinpoint at center
    float core = max(0.0, 1.0 - d * 7.0);

    // Oversaturate the color so it blooms into white at dense clusters
    vec3 col = vColor * glow * 2.5 + vec3(core * core);
    float a = glow + core * 0.35;

    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }
`;
