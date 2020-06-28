import chai from 'chai';
import Hls from 'hls.js';

describe('hls.js', function () {
  it('should be imported', async function () {
    // If no DOM is available, Hls.js will import an empty object
    chai.expect(Hls, 'HLS import').to.not.be.an('object');
  });

  it('should have isSupported() function', async function () {
    // MediaStream API not supported in Node.js
    chai.expect(Hls.isSupported(), 'HLS support').to.be.a('boolean');
  });
});
