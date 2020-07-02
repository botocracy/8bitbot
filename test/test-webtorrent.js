import chai from 'chai';
import MediaElementWrapper from 'mediasource';
import videostream from 'videostream';
import WebTorrent from 'webtorrent';

import { getRtcConfig } from '../src/utils';

const BIG_BUCK_BUNNY_URI =
  'magnet:?xt=urn:btih:DD8255ECDC7CA55FB0BBF81323D87062DB1F6D1C';

const VIDEOSTREAM_EXTS = ['.m4a', '.m4v', '.mp4'];

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

      // Torrents can contain many files. Let's use the .mp4 file
      let file = torrent.files.find(function (file) {
        return file.name.endsWith('.mp4');
      });

      /*
      const extension = '.mp4'; // TODO
      var element = {}; // TODO

      if (VIDEOSTREAM_EXTS.indexOf(extension) >= 0) {
        renderer = new videostream(file, element);
      } else {
        const wrapper = new MediaElementWrapper(element);
        const writable = wrapper.createWriteStream(codecs);
        file.createReadStream().pipe(writable);

        renderer = wrapper;
      }
      */

      done();
    });
  });
});
