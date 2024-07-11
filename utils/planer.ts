import { Curtains, Plane, type PlaneParams } from "curtainsjs";

export type PlanerOptions = {
  interval: number;
  yMultiplier: number;
  xMultiplier: number;
  div: number;
  axis: "x" | "y" | "xy";
  randomOp: boolean;
};

export class Planer {
  curtains: Curtains;
  element: Element;
  plane: Plane;

  constructor(curtains: Curtains, element: Element, options: PlanerOptions) {
    this.curtains = curtains;
    this.element = element;
    this.plane = this.create(options);
  }

  create(options: PlanerOptions) {
    const intervalFloat = options.interval.toFixed(20);
    const yMultiplierFloat = options.yMultiplier.toFixed(20);
    const xMultiplierFloat = options.xMultiplier.toFixed(20);
    const divFloat = options.div.toFixed(20);
    const rd = (op: string) => (options.randomOp ? randomOp() : op);

    const textureCoordX = options.axis.includes("x")
      ? `textureCoord.x += sin(textureCoord.y ${rd(
          "*"
        )} ${yMultiplierFloat}) ${rd("*")} cos(textureCoord.x ${rd(
          "*"
        )} ${xMultiplierFloat}) ${rd(
          "*"
        )} (cos(uTime / ${intervalFloat})) / ${divFloat};`
      : "";
    const textureCoordY = options.axis.includes("y")
      ? `textureCoord.y += cos(textureCoord.y ${rd(
          "*"
        )} ${yMultiplierFloat}) ${rd("*")} sin(textureCoord.x ${rd(
          "*"
        )} ${xMultiplierFloat}) ${rd(
          "*"
        )} (cos(uTime / ${intervalFloat})) / ${divFloat};`
      : "";

    const vs = `
      precision mediump float;

			// those are the mandatory attributes that the lib sets
			attribute vec3 aVertexPosition;
			attribute vec2 aTextureCoord;

			// those are mandatory uniforms that the lib sets and that contain our model view and projection matrix
			uniform mat4 uMVMatrix;
			uniform mat4 uPMatrix;

			// our texture matrix that will handle image cover
			uniform mat4 uTextureMatrix0;

			// if you want to pass your vertex and texture coords to the fragment shader
			varying vec3 vVertexPosition;
			varying vec2 vTextureCoord;

			void main() {
				vec3 vertexPosition = aVertexPosition;

				gl_Position = uPMatrix * uMVMatrix * vec4(vertexPosition, 1.0);

				// set the varyings
				// here we use our texture matrix to calculate the accurate texture coords
				vTextureCoord = (uTextureMatrix0 * vec4(aTextureCoord, 0.0, 1.0)).xy;
				vVertexPosition = vertexPosition;
    `;
    const fs = `
      precision mediump float;

			// get our varyings
			varying vec3 vVertexPosition;
			varying vec2 vTextureCoord;

			// the uniform we declared inside our javascript
			uniform float uTime;

			// our texture sampler (default name, to use a different name please refer to the documentation)
			uniform sampler2D uSampler0;

			void main() {
				vec2 textureCoord = vTextureCoord;

				// displace our pixels along the X axis based on our time uniform
				// textures coords are ranging from 0.0 to 1.0 on both axis
        ${textureCoordX}
        ${textureCoordY}

				gl_FragColor = texture2D(uSampler0, textureCoord);
			}
    `;
    const params: PlaneParams = {
      vertexShader: vs,
      fragmentShader: fs,
      uniforms: {
        time: {
          name: "uTime", // uniform name that will be passed to our shaders
          type: "1f", // this means our uniform is a float
          value: 0,
        },
      },
    };

    const plane = new Plane(this.curtains, this.element, params);
    plane.onRender(() => {
      (this.plane.uniforms.time.value as number)++; // update our time uniform value
    });
    return plane;
  }

  refresh(options: PlanerOptions) {
    this.plane.remove();
    this.plane = this.create(options);
  }
}

function randomOp() {
  const ops = ["*", "/", "+", "-"];
  return ops[Math.floor(Math.random() * ops.length)];
}
