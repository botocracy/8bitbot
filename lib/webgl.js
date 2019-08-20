//////////////////////////////////////////////////////////////////////////
// WebGL stuff
//////////////////////////////////////////////////////////////////////////

//<script id="2d-vertex-shader" type="x-shader/x-vertex">
vertexShaderSource = `#version 300 es
  in vec4 a_position;
  //in vec2 a_texCoord;

  // Used to pass in the resolution of the canvas
  //univorm vec2 u_resolution;

  // Used to pass the texture coordinates to the fragment shader
  //out vec2 v_texCoord;
  //uniform mat4 u_matrix;
  //varying vec2 v_texcoord;

  void main() {
    gl_Position = a_position;
  }
`

//<script id="2d-fragment-shader" type="x-shader/x-fragment">
fragmentShaderSource = `#version 300 es
  precision mediump float;

  out vec4 outColor;

  void main() {
    // Redish-purple
    outColor = vec4(1, 0, 0.5, 1);
  }
`

function createShader(gl, type, source) {
  var shader = gl.createShader(type)

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
  if (success) {
    return shader
  }

  console.log(gl.getShaderInfoLog(shader))
  gl.deleteShader(shader)
}

function createProgram(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram()

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  var success = gl.getProgramParameter(program, gl.LINK_STATUS)
  if (success) {
    return program
  }

  console.log(gl.getProgramInfoLog(program))
  gl.deleteProgram(program)
}

/*
function initBuffers(gl) {
  // Create a buffer for the texture's positions
  const positionBuffer = gl.createBuffer()

  // Select the positionBuffer as the one to apply buffer operations to
  // from here out
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

  // Now create an array of positions for the texture
  const positions = [
    -1.0,  1.0,
     1.0,  1.0,
    -1.0, -1.0,
     1.0, -1.0
   ]

   // Now pass the list of positions into WebGL to build the shape
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

   return {
     position: positionBuffer,
   }
}
*/

function drawScene(gl, programInfo, buffers) {
  // TODO
  // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context

  //gl.clearDepth(1.0)

  // Enable depth testing
  //gl.enable(gl.DEPTH_TEST)

  // Near things obscure far things
  //gl.depthFunc(gl.LEQUAL)

  // Aspect ratio and coordinate system details
  let aspectRatio;
  let currentRotation = [0, 1];
  let currentScale = [1.0, 1.0];

  // Vertex informatio[n
  let vertexArray;
  let vertexBuffer;
  let vertexNumComponents;
  let vertexCount;

  // Rendering data shared with the scalers.
  let uScalingFactor;
  let uGlobalColor;
  let uRotationVector;
  let aVertexPosition;

  // Animation timing
  let previousTime = 0.0;
  let degreesPerSecond = 90.0;

  const shaderSet = [
    {
      type: gl.VERTEX_SHADER,
      id: 'vertex-shader'
    },
    {
      type: gl.FRAGMENT_SHADER,
      id: 'fragment-shader'
    }
  ]

  shaderProgram = buildShaderProgram(shaderSet)

  aspectRatio = 1.0 // TODO: foregroundCanvas.width / foregroundCanvas.height
  currentRotation = [0, 1]
  currentScale = [1.0, aspectRatio]

  vertexArray = new Float32Array([
    -0.5,  0.5,
     0.5,  0.5,
     0.5, -0.5,
    -0.5, -0.5
    // TODO
  ])

  //vertexBuffer = gl.
}

// Initialize a texture and load an image
function loadTexture(gl, url) {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)

  // Because images have to be download over the internet they might
  // take a moment until they are ready. Until then put a single pixel
  // in the texture so we can use it immediately. When the image has
  // finished downloading we'll update the texture with the contents of
  // the image.
  const level = 0
  const internalFormat = gl.RGBA
  //const width = 1
  //const height = 1
  //const border = 0
  const srcFormat = gl.RGBA
  const srcType = gl.UNSIGNED_BYTE
  //const pixel = new Uint8Array([0, 0, 255, 255]) // Opaque blue
  //gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel)

  const image = new Image()
  image.onload = function() {
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image)

    // Nearest-neighbor (pixelate) filtering
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)

    // Prevents s-coordinate wrapping (repeating).
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // Prevents t-coordinate wrapping (repeating).
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // WebGL1 has different requirements for power-of-2 images vs
    // non-power-of-2 images, so check if the image is a power of 2 in
    // both dimensions
    if (isPowerOf2(uimage.width) && isPowerOf2(image.height)) {
      // Yes, it's a power of 2. Generate mips.
      gl.generateMipmap(gl.TEXTURE_2D)
    } else {
      // No, it's not a power of 2. Turn off mips and set wrapping to
      // clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    }
  }
  // TODO: CORS
  //image.src = url

  return texture
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0
}

function glMain(node) {
  const canvas = document.getElementById('foregroundCanvas')

  // Initialize GL context
  const gl = canvas.getContext('webgl2')

  // Only continue if WebGL is available and working
  if (gl == null) {
    console.error('Unable to initialize WebGL')
    return
  }

  // Create shaders
  var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
  var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

  // Link shaders into a program
  var program = createProgram(gl, vertexShader, fragmentShader)

  // Look up the location of the attribute for the program we just created
  var positionAttributeLocation = gl.getAttribLocation(program, 'a_position')

  // Create a position buffer
  var positionBuffer = gl.createBuffer()

  // Bind the position buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

  // Put data in the buffer by referencing it through the bind point
  // gl.STATIC_DRAW tells WebGL we are not likely to change this data much
  var positions = [
    0, 0,
    0, 0.5,
    0.7, 0
  ]
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

  // Create a collection of attribute state called a Vertex Array Object
  var vao = gl.createVertexArray()

  // Make it the current vertex array so that all of our attribute
  // settings will apply to that set of attribute state
  gl.bindVertexArray(vao)

  // Turn the attribute on so we can get data out of the buffer
  gl.enableVertexAttribArray(positionAttributeLocation)

  // Specify how to pull the data out
  var size = 2 // 2 components per iteration ('z' and 'w' will default to 0 and 1, respectively)
  var type = gl.FLOAT // The data is 32bit floats
  var normalize = false // Don't normalize the data
  var stride = 0 // 0 = advance size * sizeof(type) each iteration
  var offset = 0 // Start at the beginning of the buffer
  gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)



  // Adjust the display size to match the canvas size
  //webglUtils.resizeCanvaseToDisplay(gl.canvas)

  // Tell WebGL how to convert from the clip space to screen space
  //gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)



  // TODO
  //initBuffers(gl)

  //const texture = loadTexture(gl, 'Green_bot_sprite.png')
  const texture = loadTexture(gl, 'https://ipfs.globalupload.io/QmcCCBvaUZoJ7a588W4YmNVkQMTRURd7NPn9jLVNDRfAn9')



  // Draw loop
  var lastTimeSecs = 0

  function draw(nowMs) {
    // Convert the time to seconds
    nowSecs = nowMs * 0.0001

    // Subtract the previous time from the current time
    var deltaTime = nowSecs - lastTimeSecs

    // Remember the current time for the next frame
    lastTimeSecs = nowSecs

    // Make the canvas transparent
    //gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // Tell WebGL to use our shader program (pair of shaders)
    gl.useProgram(program)

    // Bind the attribute/buffer set we want
    gl.bindVertexArray(vao)

    // Finally, ask WebGL to execute our GLSL program
    var primiteType = gl.TRIANGLES
    var offset = 0
    var count = 3
    gl.drawArrays(primiteType, offset, count)

    window.requestAnimationFrame(draw);
  }
  window.requestAnimationFrame(draw);
}

// TODO: GL entry point
await glMain(node)
