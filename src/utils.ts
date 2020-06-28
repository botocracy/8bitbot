function getRtcConfig() {
  return {
    iceServers: [
      {
        urls: 'stun:stun.stunprotocol.org',
      },
      {
        urls: 'stun:stun.framasoft.org',
      },
    ],
  };
}

// ---------------------------------------------------------------------------

export { getRtcConfig };
