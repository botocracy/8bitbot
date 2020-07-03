/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import cv from './generated/opencv';
import * as THREE from 'three';

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

    // State
    this.frameCount = 0;
    this.hasInitialFeatures = false;
    this.initialFeatures = null;
    this.hasInitialHomography = false;
    this.initialHomography = null;
    this.hasPrevious = false;
    this.previousImage = null;
    this.previousFeatures = null;
    this.lastDetection = performance.now();

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
        self.renderLoop();
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
  }

  doUnload() {
    this.initialFeatures.delete();
    this.initialHomography.delete();
    this.previousImage.delete();
    this.previousFeatures.delete();
  }

  renderLoop() {
    if (this.video.paused || this.video.ended) {
      return;
    }

    // Render the frame
    this.renderFrame();

    // Update frame count
    this.frameCount += 1;

    // Schedule the next frame
    let self = this;
    setTimeout(function () {
      self.renderLoop();
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

  renderFrame() {
    // Update dimensions before the video is rendered
    if (!this.computeDimensions()) {
      return;
    }

    const renderWidth = this.renderCanvas.width;
    const renderHeight = this.renderCanvas.height;

    // Render video to the render canvas
    const renderImage = this.renderVideo(this.video, renderWidth, renderHeight);
    if (!renderImage) {
      return;
    }

    // Update dimensions before the overlay is rendered
    this.computeDimensions();

    // TODO: Avoid copy to overlay and draw circles directly to canvas
    // memory

    const overlayWidth = this.overlayCanvas2D.width;
    const overlayHeight = this.overlayCanvas2D.height;

    // Crop the image
    const renderImageCropped = this.cropRenderImage(
      /* move */ renderImage,
      renderWidth,
      renderHeight,
      overlayWidth,
      overlayHeight
    );

    // Convert to grayscale
    const grayscaleImage = this.convertToGrayscale(
      /* move */ renderImageCropped
    );

    // Corner detection on grayscale image
    if (!this.hasInitialFeatures) {
      this.hasInitialFeatures = true;
      this.initialFeatures.delete();
      this.initialFeatures = this.getCorners(grayscaleImage);
      this.lastDetection = performance.now();
    }

    if (!this.hasPrevious) {
      this.hasPrevious = true;
      this.previousImage = grayscaleImage;
      this.previousFeatures = this.getCorners(grayscaleImage);
      return;
    }

    // Should we re-detect features?
    let redetect = false;

    const nowMs = performance.now();

    // Detect resolution change
    if (
      this.previousImage.rows != grayscaleImage.rows ||
      this.previousImage.cols != grayscaleImage.cols
    ) {
      redetect = true;
    } else if (this.initialFeatures.rows == 0) {
      // Force re-detection is current state is invalid
      // TODO: Cound features with valid status
      redetect = true;
    } else if (nowMs - this.lastDetection > 2 * 1000) {
      redetect = true;
    } else {
      // Force re-detection if 10% of features disappear
      const initialRows = this.initialFeatures.rows;
      const previousRows = this.previousFeatures.rows;
      if (previousRows / initialRows < 0.9) {
        redetect = true;
      }
    }

    // Reshuffle features every few seconds or on resolution change
    if (redetect) {
      this.initialFeatures.delete();
      this.previousImage.delete();
      this.previousFeatures.delete();

      this.initialFeatures = this.getCorners(grayscaleImage);
      this.previousImage = grayscaleImage;
      this.previousFeatures = this.getCorners(grayscaleImage);

      this.hasInitialHomography = false;
      this.lastDetection = performance.now();

      return;
    }

    // Calculate optical flow
    const { nextFeatures, status } = this.calcOpticalFlow(
      this.previousImage,
      grayscaleImage,
      this.previousFeatures
    );

    if (nextFeatures.rows > 0) {
      // Find good corners
      const { goodNew, goodOld } = this.selectGoodPoints(
        nextFeatures,
        this.initialFeatures,
        status
      );

      if (goodNew.rows > 0) {
        // Find essential matrix
        const cameraMatrix = this.cv.matFromArray(3, 3, this.cv.CV_64F, [
          1082.77717353143,
          0,
          690.835449448,
          0,
          1082.77717353143,
          457.750756458,
          0,
          0,
          1,
        ]);
        const E = this.cv.findEssentialMat(goodOld, goodNew, cameraMatrix);

        if (E.rows != 0 && E.cols != 0) {
          const R = new this.cv.Mat(); // Rotation matrix
          const t = new this.cv.Mat(); // Translation vector

          this.cv.recoverPose(E, goodOld, goodNew, cameraMatrix, R, t);

          const rotationVector = new this.cv.Mat(1, 3, this.cv.CV_64F);

          this.cv.Rodrigues(R, rotationVector);

          //this.camera.position.x = t.data64F[0];
          //this.camera.position.y = t.data64F[1];
          //this.camera.position.z = t.data64F[2] + 10;

          //this.camera.rotation.x = rotationVector.data64F[0];
          //this.camera.rotation.y = rotationVector.data64F[1];
          //this.camera.rotation.z = rotationVector.data64F[2];

          this.camera.rotation.x = 0;
          this.camera.rotation.y = 0;
          this.camera.rotation.z = 0;

          this.camera.updateMatrixWorld(true);
        }

        goodNew.delete();
        goodOld.delete();
      }

      // Scale matrix
      const scale = [
        [overlayWidth / grayscaleImage.cols, 0],
        [0, overlayHeight / grayscaleImage.rows],
      ];

      // Draw overay image
      const overlayImage = this.getOverlayImage(
        this.initialFeatures,
        nextFeatures,
        scale,
        overlayWidth,
        overlayHeight
      );

      // Render overlay image to the canvas
      this.renderOverlay(/* move */ overlayImage, overlayWidth, overlayHeight);
    }

    // Clean up memory
    this.previousImage.delete();
    this.previousFeatures.delete();
    this.previousImage = grayscaleImage;
    this.previousFeatures = nextFeatures;
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

    if (!this.window.showOverlay) {
      return null;
    }

    // Get matrix for source image
    const renderImage = this.cv.matFromImageData(renderPixels);

    return renderImage;
  }

  /*
   * Crop matrix to visible area
   */
  cropRenderImage(
    renderImage,
    renderWidth,
    renderHeight,
    overlayWidth,
    overlayHeight
  ) {
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

    // Crop the image
    const renderImageCropped = renderImage.roi(cropRegion);

    renderImage.delete();

    return renderImageCropped;
  }

  /*
   * Convert to grayscale
   *
   * TODO: Re-use buffer from previous state
   */
  convertToGrayscale(colorImage) {
    // Grayscale matrix
    const grayscaleImage = new this.cv.Mat();

    // Do the conversion
    this.cv.cvtColor(colorImage, grayscaleImage, this.cv.COLOR_RGBA2GRAY);

    // Clean up resources
    colorImage.delete();

    return grayscaleImage;
  }

  getCorners(grayscaleImage) {
    const outputCorners = new this.cv.Mat();

    // Maximum number of corners to return. If there are more corners than are
    // found, the strongest of them is returned.
    const maxCorners = 100;

    // Minimal accepted quality of image corners
    //
    // This parameter characterizes the minimal accepted quality of
    // corners.
    //
    // The parameter value is multiplied by the best corner quality measure,
    // which is the minimal eigenvalue or the Harris function response.
    //
    // The corners with the quality measure less than the product are rejected.
    //
    // For example, if the best corner has the quality measure = 1500, and the
    // qualityLevel = 0.01, then all the corners with the quality measure less
    // than 15 are rejected.
    const qualityLevel = 0.1;

    // Minimum possible Euclidean distance between the returned corners
    const minDistance = 10;

    // Optional region of interest
    const mask = new this.cv.Mat();

    // Size of an average block for computing a derivative covariation matrix
    // over each pixel neighborhood
    const blockSize = 3;

    // Parameter indicating whether to use a Harris detector
    const useHarrisDetector = false;

    // Free parameter of the Harris detector
    const k = 0.04;

    // Apply corner detection
    this.cv.goodFeaturesToTrack(
      grayscaleImage,
      outputCorners,
      maxCorners,
      qualityLevel,
      minDistance,
      mask,
      blockSize,
      useHarrisDetector,
      k
    );

    return outputCorners;
  }

  /*
   * Calculate an optical flow for a sparse feature set using the iterative
   * Lucas-Kanade method.
   */
  calcOpticalFlow(previousImage, nextImage, previousFeatures) {
    // Output vector of 3D points (with single-recision floating-point
    // coordinates) containing the calculated new positions of input features
    // in the second image.
    const nextFeatures = new this.cv.Mat();

    // Output status vector (of unsigned chars).
    //
    // Each element of the vector is set to 1 if the flow for the corresponding
    // features has been found, otherwise, it is set to 0.
    const status = new this.cv.Mat();

    // Output vector of errors.
    //
    // Each element of the vector is set to an error for the corresponding
    // feature. The type of the error measure can be set in the "flags"
    // parameter.
    //
    // If the flow wasn’t found then the error is not defined (use the status
    // parameter to find such cases).
    const err = new this.cv.Mat();

    // Window size of optical flow algorithm. Must be no less than winSize
    // argument of calcOpticalFlowPyrLK().
    //
    // It is needed to calculate required padding for pyramic levels.
    //
    // TODO: Do you pass in the same winSize value when you eventually call
    // cv.calcOpticalFlowPyrLK?
    const winSize = new this.cv.Size(11, 11);
    //const winSize = new this.cv.Size(15, 15);

    // 0-based maximal pyramid level number.
    //
    // According to Bouguet, 2001, practical values the hight of the pyramid
    // (picked heuristically) are 2, 3, 4.
    //
    // If set to 0, pyramids are not used (single level). If set to 1, two
    // levels are used, and so on.
    //
    // The LK algorithm will use as many levels as pyramids, but no more than
    // maxLevel.
    const maxLevel = 3;

    // Parameter specifying the termination criteria of the iterative search
    // algorithm.
    //
    // The algorithm terminates after the specified maximum number of
    // iterations or when the search window moves by less than the epsilon.
    const criteria = new this.cv.TermCriteria(
      // The maximum number of iterations or elements to compute
      this.cv.TERM_CRITERIA_COUNT |
        // The desired accuracy or change in parameters at which the iterative
        // algorithm stops
        this.cv.TERM_CRITERIA_EPS,
      // Max number
      10,
      // Epsilon
      0.03
    );

    // Calculate optical flow
    this.cv.calcOpticalFlowPyrLK(
      previousImage,
      nextImage,
      previousFeatures,
      nextFeatures,
      status,
      err,
      winSize,
      maxLevel,
      criteria
    );

    return {
      nextFeatures: nextFeatures,
      status: status,
    };
  }

  /*
   * Calculate perspective transformation between two planes
   */
  findHomography(sourcePoints, destPoints) {
    // Method used to computed a homography matrix. The following methods are
    // possible:
    //
    //   0 - a regular method using all the points
    //   CV_RANSAC - RANSAC-based robust method
    //   CV_LMEDS - Least-Median robust method
    //
    // The method RANSAC can handle practically any ratio of outliers but it
    // needs a threshold to distinguish inliers from outliers. The method
    // LMeDS does not need any threshold but it works correctly only when
    // there are more than 50% of inliers. Finally, if there are no outliers
    // and the noise is rather small, use the default method (method=0).
    //
    const method = this.cv.LMEDS;

    // Maximum allowed reprojection error to treat a point pair as an inlier
    // (used in the RANSAC method only). If srcPoints and dstPoints are
    // measured in pixels, it usually makes sense to set this parameter
    // somewhere in the range of 1 to 10.
    const ransacReprojThreshold = 3.0;

    const homography = this.cv.findHomography(
      sourcePoints,
      destPoints,
      method,
      ransacReprojThreshold
    );

    return homography;
  }

  /*
   * Select good points
   *
   * See: https://docs.opencv.org/3.4/db/d7f/tutorial_js_lucas_kanade.html
   */
  selectGoodPoints(nextFeatures, referenceFeatures, status) {
    // Count number of features with good status
    let goodCount = 0;
    for (let i = 0; i < status.rows; i++) {
      if (status.data[i] == 1) {
        goodCount++;
      }
    }

    let goodNew = new this.cv.Mat(goodCount, 2, this.cv.CV_32F);
    let goodOld = new this.cv.Mat(goodCount, 2, this.cv.CV_32F);

    for (let i = 0, count = 0; i < status.rows; i++) {
      if (status.data[i] === 1) {
        goodNew.data32F[count * 2] = nextFeatures.data32F[i * 2];
        goodNew.data32F[count * 2 + 1] = nextFeatures.data32F[i * 2 + 1];

        goodOld.data32F[count * 2] = referenceFeatures.data32F[i * 2];
        goodOld.data32F[count * 2 + 1] = referenceFeatures.data32F[i * 2 + 1];

        count++;
      }
    }

    return {
      goodNew: goodNew,
      goodOld: goodOld,
    };
  }

  /*
   * Draw circles on the corners and tracks on the motion
   */
  getOverlayImage(
    initialFeatures,
    nextFeatures,
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

    for (let i = 0; i < nextFeatures.rows; i++) {
      const newX = nextFeatures.data32F[2 * i];
      const newY = nextFeatures.data32F[2 * i + 1];
      const newPoint = [newX, newY];

      const oldX = initialFeatures.data32F[2 * i];
      const oldY = initialFeatures.data32F[2 * i + 1];
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
  renderOverlay(overlayImage, overlayWidth, overlayHeight) {
    this.cv.imshow(this.overlayCanvas2D, overlayImage);

    overlayImage.delete();
  }

  renderSphere(ctx, width, height) {
    // TODO
  }
}

export { MotionTracker };
