//////////////////////////////////////////////////////////////////////////
// WebRTC video playback
//////////////////////////////////////////////////////////////////////////

async function loadWebRtcVideo() {
  var mediaSource = new MediaSource()
  video.src = URL.createObjectURL(mediaSource)

  mediaSource.addEventListener('sourceopen', function(e) {
    // TODO: Codec
    var sourceBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.64000d,mp4a.40.2')

    // Open IPFS stream
    console.log(`Opening ${VIDEO_ID}`)
    var ipfsStream = node.getReadableStream(VIDEO_ID)

    // Log IPFS error messages
    ipfsStream.on('error', (error) => {
      console.error(`IPFS stream error: ${error.message}`)
    })

    ipfsStream.on('readable', (file) => {
      console.log(`IPFS stream is readable: ${file.path}`)
    })

    ipfsStream.on('data', (file) => {
      // Log the path
      console.log(`${file.path} (${file.size} bytes)`)

      file.content.on('data', (data) => {
        console.log('Here')
        sourceBuffer.appendStream(data)
      })
      file.content.resume()

      ipfsStream.on('end', () => {
        console.log(`IPFS stream ended for ${file.path}`)

        // TODO: Notify sourceBuffer of end
      })
    })
  })
}
