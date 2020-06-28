import chai from 'chai';
import WebTorrent from 'webtorrent';

import { getRtcConfig } from '../src/utils';

const BIG_BUCK_BUNNY_URI =
  'magnet:?xt=urn:btih:DD8255ECDC7CA55FB0BBF81323D87062DB1F6D1C';

// SI file size strings
function fileSizeSI(size) {
  let exp = (Math.log(size) / Math.log(1e3)) | 0;

  return (
    (size / Math.pow(1e3, exp)).toFixed(0) +
    ' ' +
    (exp ? 'kMGTPEZY'[--exp] + 'B' : 'Bytes')
  );
}

describe('WebTorrent', function () {
  before(async function () {
    this.client = new WebTorrent({
      tracker: {
        rtcConfig: getRtcConfig(),
      },
    });

    this.client.on('error', function (err) {
      chai.assert.fail(err);
    });
    this.client.on('warning', function (err) {
      chai.assert.fail(err);
    });
  });

  after(async function () {
    this.client.destroy();
  });

  it('should be imported', async function () {
    chai.expect(this.client, 'WebTorrent client').to.be.an('object');
  });

  it('should have WEBRTC_SUPPORT property', async function () {
    // WebRTC not supported in Node.js
    chai.expect(WebTorrent.WEBRTC_SUPPORT).to.be.a('boolean');
  });

  it('should download Big Buck Bunny metadata within 10s', function (done) {
    this.timeout(10000);

    this.client.add(BIG_BUCK_BUNNY_URI, function (torrent) {
      // Got torrent metadata
      console.log(
        `Client is downloading "${torrent.name}" (${fileSizeSI(
          torrent.length
        )})`
      );

      torrent.files.forEach(function (file) {
        console.log(
          `Torrent has file "${file.path}" (${fileSizeSI(file.length)})`
        );
      });

      done();
    });
  });
});
