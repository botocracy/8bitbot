import chai from 'chai';
import cv from '../src/generated/opencv';

// Promise that is resolved when OpenCV is initialized
let openCvLoaded;

// Run OpenCV code, deferring until after open OpenCV is initialized
async function runcv(callback) {
  openCvLoaded.then(callback);
  await openCvLoaded;
}

// Get the OpenCV version
async function getOpenCvVersion() {
  let version = null;

  await runcv(() => {
    const versionRegex = /Version control: +([0-9a-zA-Z.-]+)/;
    version = cv.getBuildInformation().match(versionRegex)[1];
  });

  return version;
}

// Install OpenCV runtime initialization handler
let resolveCvInit;

openCvLoaded = new Promise((resolve, reject) => {
  resolveCvInit = resolve;
});

cv['onRuntimeInitialized'] = () => {
  resolveCvInit();
};

describe('opencv.js', function () {
  before(async function () {});

  it('should be imported', async function () {
    chai.expect(cv).to.be.an('object');
  });

  it('should create a point', async function () {
    const point = new cv.Point(-1, -1);
    chai.expect(point).to.be.a('object');
  });

  it('should create a matrix (async)', async function () {
    return runcv(() => {
      const mat = new cv.Mat();
      chai.expect(mat).to.be.an('object');
    });
  });

  it('should create a matrix (now sync)', async function () {
    await runcv(() => {
      const mat = new cv.Mat();
      chai.expect(mat).to.be.an('object');
    });
  });

  it('should log the OpenCV version', async function () {
    const version = await getOpenCvVersion();

    chai.expect(version).to.be.a('string');

    console.log(`OpenCV version: ${version}`);
  });
});
