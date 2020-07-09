import chai from 'chai';

import { World } from '../src/world';

describe('World', function () {
  before(function () {
    this.world = new World();
  });

  it('should construct World', async function () {
    chai.expect(this.world).to.be.an('object');
  });

  it('should provide video URIs', async function () {
    chai
      .expect(await this.world.getVideoHlsUri(), 'HLS video URI')
      .to.be.a('string');
    chai
      .expect(await this.world.getVideoMp4Uri(), 'MP4 video URI')
      .to.be.a('string');
  });
});
