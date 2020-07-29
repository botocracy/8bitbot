/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import cv from './generated/opencv';
import * as THREE from 'three';

const WORKER_PATH = './motion_tracker/motion_tracker_worker.js';

// Promise that is resolved when a decoded frame is processed
let resolveFrameProcessed;

class MotionTracker {
  constructor(window, video) {
    // Construction parameters
    this.cv = null;
    this.window = window;
    this.video = video;

    // Canvas handles
    this.renderCanvas = document.getElementById('renderCanvas');
    this.overlayCanvas2D = document.getElementById('overlayCanvas2D');
    this.overlayCanvas3D = document.getElementById('overlayCanvas3D');

    // Render context handles
    this.renderContext = this.renderCanvas.getContext('2d');
    this.overlayContext = this.overlayCanvas2D.getContext('2d');

    // Setup 3D
    this.scene = new THREE.Scene();
    this.camera = null; // TODO: Construct camera here, might not be set in computeDimensions()
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.overlayCanvas3D,
      alpha: true,
    });

    const radius = 1;
    const widthSegments = 8;
    const heightSegments = 8;
    this.geometry = new THREE.SphereBufferGeometry(
      radius,
      widthSegments,
      heightSegments
    );
    this.wireframe = new THREE.WireframeGeometry(this.geometry);
    this.line = new THREE.LineSegments(this.wireframe);
    this.line.position.z = -10;
    this.line.material.depthTest = false;
    this.line.material.opacity = 0.25;
    this.line.material.transparent = true;
    //this.scene.add(this.line); // TODO

    // Web worker
    this.motionWorker = new Worker(WORKER_PATH);
    this.motionWorkerRunning = false;

    // Reverence given to event handlers
    let self = this;

    // Video events
    this.video.addEventListener('loadedmetadata', function () {
      self.computeDimensions();
    });
    this.video.addEventListener(
      'play',
      async function () {
        // Wait for OpenCV to load
        self.cv = await cv;
        self.initialFeatures = new self.cv.Mat();
        self.initialHomography = new self.cv.Mat();
        self.previousImage = new self.cv.Mat();
        self.previousFeatures = new self.cv.Mat();

        // Video has started playing, update dimensions
        self.computeDimensions();

        // Show overlay canvas
        const viewOverlayIcon = document.getElementById('viewOverlayIcon');
        const hideOverlayIcon = document.getElementById('hideOverlayIcon');

        if (self.window.showOverlay) {
          viewOverlayIcon.style.display = 'none';
          hideOverlayIcon.style.display = 'block';
          self.overlayCanvas2D.style.display = 'block';
          self.overlayCanvas3D.style.display = 'block';
        } else {
          viewOverlayIcon.style.display = 'block';
          hideOverlayIcon.style.display = 'none';
          self.overlayCanvas2D.style.display = 'none';
          self.overlayCanvas3D.style.display = 'none';
        }

        // Start animation loop
        function animate() {
          requestAnimationFrame(animate);
          self.renderer.render(self.scene, self.camera);
        }
        animate();

        // Start render loop
        await self.renderLoop();
      },
      false
    );

    // Window events
    this.window.addEventListener('resize', () => {
      this.computeDimensions();
    });
    this.window.addEventListener('orientationchange', () => {
      this.computeDimensions();
    });

    // Worker events
    this.motionWorker.onmessage = function (event) {
      const msg = event.data;

      if (msg.error) {
        throw new Error(msg.error);
      }

      switch (msg.type) {
        case 'moduleInitialized':
          console.log('Motion tracker worker initialized');
          self.motionTrackerRunning = true;
          break;

        case 'onFrameProcessed':
          const frameInfo = {
            pts: msg.pts,
            sceneScore: msg.sceneScore,
            pointsBuffer: msg.pointsBuffer,
            rotationMatrix: msg.rotationMatrix,
            translationVector: msg.translationVector,
          };
          resolveFrameProcessed(frameInfo);
          break;

        default:
          console.error('Unkown message type: ' + msg.type);
      }
    };
  }

  doUnload() {
    // TODO: Cleanup worker
  }

  async renderLoop() {
    if (this.video.paused || this.video.ended) {
      return;
    }

    // Render the frame
    await this.renderFrame();

    // Schedule the next frame
    let self = this;
    setTimeout(async function () {
      await self.renderLoop();
    }, 0);
  }

  computeDimensions() {
    // Get the resolution of the video stream
    const videoWidth = this.video.videoWidth;
    const videoHeight = this.video.videoHeight;

    // Look up the size the browser is displaying the canvas
    const displayWidth = this.video.clientWidth;
    const displayHeight = this.video.clientHeight;

    // Avoid division by zero
    if (
      videoWidth == 0 ||
      videoHeight == 0 ||
      displayWidth == 0 ||
      displayHeight == 0
    ) {
      return false;
    }

    /*
     * Calculate render dimensions
     */

    let renderWidth = videoWidth;
    let renderHeight = videoHeight;

    // Maximum size of the largest dimension
    const MAX_SIZE = 512;

    while (Math.max(renderWidth, renderHeight) > MAX_SIZE) {
      renderWidth /= 2;
      renderHeight /= 2;
    }

    /*
     * Update the render dimensions
     */

    // Resize the render canvas
    if (
      this.renderCanvas.width != renderWidth ||
      this.renderCanvas.height != renderHeight
    ) {
      this.renderCanvas.width = renderWidth;
      this.renderCanvas.height = renderHeight;
    }

    // Resize the overlay canvases
    if (
      this.overlayCanvas2D.width != displayWidth ||
      this.overlayCanvas2D.height != displayHeight
    ) {
      this.overlayCanvas2D.width = displayWidth;
      this.overlayCanvas2D.height = displayHeight;

      // Update 3D
      // Camera frustum vertical field of view
      const fov = 75;
      // Camera frustum aspect ratio
      const aspect = displayWidth / displayHeight;
      // Camera frustum near plane
      const near = 0.1;
      // Camera frustum far plane
      const far = 1000;
      this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
      this.camera.position.x = 0;
      this.camera.position.y = 0;
      this.camera.position.z = 0;
      this.camera.rotation.x = 0;
      this.camera.rotation.y = 0;
      this.camera.rotation.z = 0;
      //this.camera.matrixAutoUpdate = false;

      this.renderer.setSize(displayWidth, displayHeight);
    }

    return true;
  }

  async renderFrame() {
    if (!this.motionTrackerRunning) {
      return;
    }

    // Update dimensions before the video is rendered
    if (!this.computeDimensions()) {
      return;
    }

    if (!this.window.showOverlay) {
      return;
    }

    const renderWidth = this.renderCanvas.width;
    const renderHeight = this.renderCanvas.height;

    // Render video to the render canvas
    const { renderPixels, pts } = this.renderVideo(
      this.video,
      renderWidth,
      renderHeight
    );
    if (!renderPixels) {
      return;
    }

    // Hand off render pixels to web worker
    this.frameProcessed = new Promise((resolve, reject) => {
      resolveFrameProcessed = resolve;
    });
    this.motionWorker.postMessage(
      {
        type: 'processFrame',
        pts: pts,
        pixelBuffer: renderPixels.data.buffer,
        byteOffset: renderPixels.data.byteOffset,
        byteLength: renderPixels.data.byteLength,
      },
      [renderPixels.data.buffer]
    );
    const frameInfo = await this.frameProcessed;

    const nowMs = performance.now();
    console.log(`Processed frame in ${nowMs - frameInfo.pts} ms`);

    const sceneScore = frameInfo.sceneScore;
    const pointsBuffer = frameInfo.pointsBuffer;
    const rotationMatrix = frameInfo.rotationMatrix;
    const translationVector = frameInfo.translationVector;

    console.log(`Scene score: ${sceneScore}`);
    console.log(`Point count: ${pointsBuffer.length}`);
    console.log(`Rotation matrix: ${rotationMatrix}`);
    console.log(`Translation vector: ${translationVector}`);

    // Update dimensions before the overlay is rendered
    this.computeDimensions();

    const overlayWidth = this.overlayCanvas2D.width;
    const overlayHeight = this.overlayCanvas2D.height;

    // Rodrigues
    const rotationVector = null;

    // Update camera position
    this.camera.rotation.x = 0;
    this.camera.rotation.y = 0;
    this.camera.rotation.z = 0;

    this.camera.updateMatrixWorld(true);

    // Crop the image
    const cropRegion = this.getCropRegion(
      renderWidth,
      renderHeight,
      overlayWidth,
      overlayHeight
    );

    // Scale matrix
    const scale = [
      [overlayWidth / renderWidth, 0],
      [0, overlayHeight / renderHeight],
    ];

    // Draw overay image
    const initialPoints = {
      rows: 0,
    };
    const nextPoints = {
      rows: 0,
    };
    const overlayImage = this.getOverlayImage(
      initialPoints,
      nextPoints,
      scale,
      overlayWidth,
      overlayHeight
    );

    // Render overlay image to the canvas
    this.renderOverlay(overlayImage);

    overlayImage.delete();
  }

  /*
   * Render the video to an OpenCV image
   */
  renderVideo(video, renderWidth, renderHeight) {
    // Render the video to the render canvas
    this.renderContext.drawImage(video, 0, 0, renderWidth, renderHeight);

    // Get render memory
    const renderPixels = this.renderContext.getImageData(
      0,
      0,
      renderWidth,
      renderHeight
    );

    // "Present timestamp", the time the frame was presented
    const pts = performance.now();

    return { renderPixels, pts };
  }

  /*
   * Crop matrix to visible area
   */
  getCropRegion(renderWidth, renderHeight, overlayWidth, overlayHeight) {
    // Calculate aspect ratio of the video and the display
    const videoAspect = renderWidth / renderHeight;
    const displayAspect = overlayWidth / overlayHeight;

    let croppedWidth = renderWidth;
    let croppedHeight = renderHeight;

    if (displayAspect < videoAspect) {
      // Display is cropped horizontally
      croppedWidth = (renderWidth * displayAspect) / videoAspect;
    } else {
      // Display is cropped vertically
      croppedHeight = (renderHeight * videoAspect) / displayAspect;
    }

    const cropX = (renderWidth - croppedWidth) / 2;
    const cropY = (renderHeight - croppedHeight) / 2;

    const cropRegion = new this.cv.Rect(
      Math.floor(cropX),
      Math.floor(cropY),
      Math.ceil(croppedWidth),
      Math.ceil(croppedHeight)
    );

    return cropRegion;
  }

  /*
   * Draw circles on the corners and tracks on the motion
   */
  getOverlayImage(
    initialPoints,
    nextPoints,
    scale,
    overlayWidth,
    overlayHeight
  ) {
    // Create a transparent matrix for the overlay image
    const overlayImage = this.cv.Mat.zeros(
      overlayHeight,
      overlayWidth,
      this.cv.CV_8UC4
    );

    for (let i = 0; i < nextPoints.rows; i++) {
      const newX = nextPoints.data32F[2 * i];
      const newY = nextPoints.data32F[2 * i + 1];
      const newPoint = [newX, newY];

      const oldX = initialPoints.data32F[2 * i];
      const oldY = initialPoints.data32F[2 * i + 1];
      const oldPoint = [oldX, oldY];

      // Transformed points
      const src = new this.cv.Point(
        oldPoint[0] * scale[0][0],
        oldPoint[1] * scale[1][1]
      );
      const dest = new this.cv.Point(
        newPoint[0] * scale[0][0],
        newPoint[1] * scale[1][1]
      );

      // Draw track
      {
        const thickness = 1;
        const color = [255, 255, 255, 128];
        this.cv.line(overlayImage, dest, src, color, thickness);
      }

      // Draw outer black circle
      {
        const radius = 1;
        const thickness = 12;
        const color = [0, 0, 0, 255];
        this.cv.circle(overlayImage, dest, radius, color, thickness);
      }

      // Draw inner white circle
      {
        const radius = 1;
        const thickness = 2;
        const color = [255, 255, 255, 255];
        this.cv.circle(overlayImage, dest, radius, color, thickness);
      }
    }

    return overlayImage;
  }

  /*
   * Render overlay
   */
  renderOverlay(overlayImage) {
    this.cv.imshow(this.overlayCanvas2D, overlayImage);
  }
}

export { MotionTracker };
