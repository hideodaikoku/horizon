const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl');
if (!gl) {
  alert('Your browser does not support WebGL.');
  throw new Error('WebGL not supported');
}

let shaderProgram;

async function loadShaderSource(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load shader: ${url}`);
  }
  return await response.text();
}

async function initShaders() {
  const vertexShaderSource = await loadShaderSource('./vertexShader.glsl');
  const fragmentShaderSource = await loadShaderSource('./fragmentShader.glsl');

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('An error occurred compiling the vertex shader: ' + gl.getShaderInfoLog(vertexShader));
    gl.deleteShader(vertexShader);
    return null;
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error('An error occurred compiling the fragment shader: ' + gl.getShaderInfoLog(fragmentShader));
    gl.deleteShader(fragmentShader);
    return null;
  }

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  gl.useProgram(shaderProgram);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  const positions = [
    -1.0,  1.0,
     1.0,  1.0,
    -1.0, -1.0,
     1.0, -1.0,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const positionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
  gl.enableVertexAttribArray(positionAttribute);
  gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);
}

function render(time) {
  resizeCanvas();
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.uniform2f(gl.getUniformLocation(shaderProgram, 'iResolution'), gl.canvas.width, gl.canvas.height);
  gl.uniform2f(gl.getUniformLocation(shaderProgram, 'iMouse'), mouseX, mouseY);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  requestAnimationFrame(render);
}

function resizeCanvas() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

let mouseX = 0;
let mouseY = 0;

canvas.addEventListener('mousemove', (event) => {
  mouseX = event.clientX;
  mouseY = canvas.height - event.clientY; // Flip Y for shader coordinates
});

window.addEventListener('resize', resizeCanvas);

async function main() {
  await initShaders();
  requestAnimationFrame(render);
}

main();