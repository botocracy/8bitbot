import chai from 'chai';
import ffmpeg from './generated/ffmpeg-mp4';

import { World } from '../src/world';

describe('ffmpeg.js', function () {
  before(async function () {
    this.world = new World();
  });

  it('should be imported', async function () {
    chai.expect(ffmpeg).to.be.a('function');
  });

  it('should log version within 4 seconds', async function () {
    this.timeout(4000);
    let exitCode = -1;
    let stdout = '';
    let stderr = '';

    // Print FFmpeg's version.
    ffmpeg({
      arguments: ['-version'],
      print: function (data) {
        stdout += data + '\n';
      },
      printErr: function (data) {
        stderr += data + '\n';
      },
      onExit: function (code) {
        exitCode = code;
        console.log(stdout);
        console.log(stderr);
      },
    });

    chai.expect(exitCode).to.equal(0);
    chai.expect(stdout).to.match(/^ffmpeg version /);
    chai.expect(stderr).to.be.empty;
  });

  it('should load video', async function () {
    const videoUri = await this.world.getVideoMp4Uri();

    chai.expect(videoUri, 'video URI').to.be.a('string');
  });
});
