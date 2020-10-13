/*
 * Copyright (C) 2019-2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

import videojs from 'video.js';
import {
  P2PMediaLoaderOptions,
  PlayerManagerOptions,
  PlayerMode,
} from './player-manager';

export class VideoPlayer {
  playerElement: HTMLVideoElement;
  videojsPlayer: videojs.Player;

  autoplay: boolean;
  controls: boolean;
  muted: boolean;
  loop: boolean;
  subtitle: string;
  enableApi = false;
  startTime: number | string = 0;
  stopTime: number | string;

  title: boolean;
  warningTitle: boolean;
  peertubeLink: boolean;
  bigPlayBackgroundColor: string;
  foregroundColor: string;

  mode: PlayerMode;
  scope = 'peertube';

  //userTokens: Tokens
  headers = new Headers();
  LOCAL_STORAGE_OAUTH_CLIENT_KEYS = {
    CLIENT_ID: 'client_id',
    CLIENT_SECRET: 'client_secret',
  };

  private translationsPromise: Promise<{ [id: string]: string }>;
  private configPromise: Promise<ServerConfig>;
  private PlayerManagerModulePromise: Promise<any>;

  //private playlist: VideoPlaylist
  //private playlistElements: VideoPlaylistElement[]
  //private currentPlaylistElement: VideoPlaylistElement

  private wrapperElement: HTMLElement;

  //private peertubeHooks: Hooks = {}
  private loadedScripts = new Set<string>();

  /**
   * Construct a new VideoPlayer for the given HTML video element.
   *
   * @param videoElement
   */
  constructor(private videoElement: HTMLVideoElement) {}

  private async buildVideoPlayer(
    videoResponse: Response,
    captionsPromise: Promise<Response>
  ) {
    let alreadyHadPlayer = false;

    if (this.videojsPlayer) {
      this.videojsPlayer.dispose();
      alreadyHadPlayer = true;
    }

    this.playerElement = document.createElement('video');
    this.playerElement.className = 'video-js vjs-peertube-skin';
    this.playerElement.setAttribute('playsinline', 'true');
    this.wrapperElement.appendChild(this.playerElement);

    const videoInfoPromise = videoResponse
      .json()
      .then((videoInfo: VideoDetails) => {
        if (!alreadyHadPlayer) this.loadPlaceholder(videoInfo);

        return videoInfo;
      });

    const [
      videoInfoTmp,
      serverTranslations,
      captionsResponse,
      config,
      PlayerManagerModule,
    ] = await Promise.all([
      videoInfoPromise,
      this.translationsPromise,
      captionsPromise,
      this.configPromise,
      this.PlayerManagerModulePromise,
    ]);

    const videoInfo: VideoDetails = videoInfoTmp;

    const PlayerManager = PlayerManagerModule.PlayerManager;
    const videoCaptions = await this.buildCaptions(
      serverTranslations,
      captionsResponse
    );

    this.loadParams(videoInfo);

    const playlistPlugin = this.currentPlaylistElement
      ? {
          elements: this.playlistElements,
          playlist: this.playlist,

          getCurrentPosition: () => this.currentPlaylistElement.position,

          onItemClicked: (videoPlaylistElement: VideoPlaylistElement) => {
            this.currentPlaylistElement = videoPlaylistElement;

            this.loadVideoAndBuildPlayer(
              this.currentPlaylistElement.video.uuid
            ).catch((err) => console.error(err));
          },
        }
      : undefined;

    const options: PlayerManagerOptions = {
      common: {
        // Autoplay in playlist mode
        autoplay: alreadyHadPlayer ? true : this.autoplay,
        controls: this.controls,
        muted: this.muted,
        loop: this.loop,

        captions: videoCaptions.length !== 0,
        subtitle: this.subtitle,

        startTime: this.playlist
          ? this.currentPlaylistElement.startTimestamp
          : this.startTime,
        stopTime: this.playlist
          ? this.currentPlaylistElement.stopTimestamp
          : this.stopTime,

        nextVideo: this.playlist ? () => this.playNextVideo() : undefined,
        hasNextVideo: this.playlist
          ? () => !!this.getNextPlaylistElement()
          : undefined,

        previousVideo: this.playlist
          ? () => this.playPreviousVideo()
          : undefined,
        hasPreviousVideo: this.playlist
          ? () => !!this.getPreviousPlaylistElement()
          : undefined,

        playlist: playlistPlugin,

        videoCaptions,
        inactivityTimeout: 2500,
        videoViewUrl: this.getVideoUrl(videoInfo.uuid) + '/views',

        playerElement: this.playerElement,
        onPlayerElementChange: (element: HTMLVideoElement) =>
          (this.playerElement = element),

        videoDuration: videoInfo.duration,
        enableHotkeys: true,
        peertubeLink: this.peertubeLink,
        poster: window.location.origin + videoInfo.previewPath,
        theaterButton: false,

        serverUrl: window.location.origin,
        language: navigator.language,
        embedUrl: window.location.origin + videoInfo.embedPath,
      },

      webtorrent: {
        videoFiles: videoInfo.files,
      },
    };

    if (this.mode === 'p2p-media-loader') {
      const hlsPlaylist = videoInfo.streamingPlaylists.find(
        (p) => p.type === VideoStreamingPlaylistType.HLS
      );

      Object.assign(options, {
        p2pMediaLoader: {
          playlistUrl: hlsPlaylist.playlistUrl,
          segmentsSha256Url: hlsPlaylist.segmentsSha256Url,
          redundancyBaseUrls: hlsPlaylist.redundancies.map((r) => r.baseUrl),
          trackerAnnounce: videoInfo.trackerUrls,
          videoFiles: hlsPlaylist.files,
        } as P2PMediaLoaderOptions,
      });
    }

    this.videojsPlayer = await PlayerManager.initialize(
      this.mode,
      options,
      (videojsPlayer: videojs.Player) => (this.videojsPlayer = videojsPlayer)
    );
    this.videojsPlayer.on('customError', (event: any, data: any) =>
      this.handleError(data.err, serverTranslations)
    );

    window['videojsPlayer'] = this.videojsPlayer;

    this.buildCSS();

    await this.buildDock(videoInfo, config);

    this.initializeApi();

    this.removePlaceholder();

    if (this.isPlaylistEmbed()) {
      await this.buildPlaylistManager();

      this.videojsPlayer.playlist().updateSelected();

      this.videojsPlayer.on('stopped', () => {
        this.playNextVideo();
      });
    }
  }
}
