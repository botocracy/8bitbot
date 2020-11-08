/*
 * Copyright (C) 2019-2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * This file is derived from the PeerTube project, available under
 * the AGPL 3.0 (or later) license. https://github.com/Chocobozzz/PeerTube
 *
 * SPDX-License-Identifier: Apache-2.0 AND AGPL-3.0-or-later
 * See LICENSE.txt for more information.
 */

import videojs from 'video.js';
import { VideoFile, VideoStreamingPlaylist } from '../models';
// TODO: Why does import from '../models' not work?
import { VideoStreamingPlaylistType } from '../models/videos/video-streaming-playlist.type';
import { RedundancyUrlManager } from './p2p-media-loader/redundancy-url-manager';
import { segmentUrlBuilderFactory } from './p2p-media-loader/segment-url-builder';
import { segmentValidatorFactory } from './p2p-media-loader/segment-validator';
import { getStoredP2PEnabled } from './player-local-storage';
import { getRtcConfig } from './utils';
import {
  P2PMediaLoaderPluginOptions,
  PlayerMode,
  VideoJSPluginOptions,
} from './videojs-typings';

export type WebtorrentOptions = {
  videoFiles: VideoFile[];
};

export type P2PMediaLoaderOptions = {
  playlistUrl: string;
  segmentsSha256Url: string;
  trackerAnnounce: string[];
  redundancyBaseUrls: string[];
  videoFiles: VideoFile[];
};

export interface CustomizationOptions {
  startTime: number | string;
  //stopTime: number | string;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
  subtitle?: string;
  resume?: string;
  //peertubeLink: boolean;
}

export interface CommonOptions extends CustomizationOptions {
  playerElement: HTMLVideoElement;
  onPlayerElementChange: (element: HTMLVideoElement) => void;

  autoplay: boolean;

  nextVideo?: () => void;
  hasNextVideo?: () => boolean;

  previousVideo?: () => void;
  hasPreviousVideo?: () => boolean;

  //playlist?: PlaylistPluginOptions;

  videoDuration: number;
  //enableHotkeys: boolean;
  //inactivityTimeout: number;
  //poster: string;

  //theaterButton: boolean;
  //captions: boolean;

  //videoViewUrl: string;
  //embedUrl: string;

  language?: string;

  //videoCaptions: VideoJSCaption[];

  //userWatching?: UserWatching;

  //serverUrl: string;
}

export type PlayerOptions = {
  common: CommonOptions;
  webtorrent: WebtorrentOptions;
  p2pMediaLoader?: P2PMediaLoaderOptions;
};

export class VideoPlayer {
  private playerElement: HTMLVideoElement;

  private videojsPlayer: videojs.Player;
  private onPlayerChange: (player: videojs.Player) => void;

  bigPlayBackgroundColor: string;
  foregroundColor: string;

  mode: PlayerMode;
  scope: string = 'peertube';

  //userTokens: Tokens
  headers = new Headers();
  LOCAL_STORAGE_OAUTH_CLIENT_KEYS = {
    CLIENT_ID: 'client_id',
    CLIENT_SECRET: 'client_secret',
  };

  private PlayerManagerModulePromise: Promise<any>;

  //private playlist: VideoPlaylist
  //private playlistElements: VideoPlaylistElement[]
  //private currentPlaylistElement: VideoPlaylistElement

  //private peertubeHooks: Hooks = {}
  private loadedScripts = new Set<string>();

  private p2pMediaLoaderModule: any;

  /**
   * Construct a new VideoPlayer for the given HTML element.
   *
   * @param playerElement The element to render to
   */
  constructor(private wrapperElement: HTMLElement) {}

  /**
   * Open a video and start playing.
   *
   * @param videoInfo The video info (TODO: Convert to typed object)
   */
  async open(videoInfo: any, mode: PlayerMode = null): Promise<void> {
    // TODO: Load placeholder image

    if (!mode) {
      // Detect mode
      if (
        Array.isArray(videoInfo.streamingPlaylists) &&
        videoInfo.streamingPlaylists.length !== 0
      ) {
        mode = 'p2p-media-loader';
      } else {
        mode = 'webtorrent';
      }
    }

    await this.importPlayer(mode);

    if (this.wrapperElement) {
      this.playerElement = document.createElement('video');
      this.playerElement.className = 'video-js vjs-peertube-skin';
      this.playerElement.setAttribute('playsinline', 'true');
      this.wrapperElement.appendChild(this.playerElement);
    }

    const options: PlayerOptions = {
      common: {
        startTime: 0,
        controls: true,
        muted: true,
        loop: true,
        //peertubeLink: boolean,

        playerElement: this.playerElement,
        onPlayerElementChange: (element: HTMLVideoElement) =>
          (this.playerElement = element),

        autoplay: true,

        videoDuration: videoInfo.duration,
      },

      webtorrent: {
        videoFiles: videoInfo.files,
      },
    };

    if (mode === 'p2p-media-loader') {
      const hlsPlaylist = videoInfo.streamingPlaylists.find(
        (p: VideoStreamingPlaylist) => p.type === VideoStreamingPlaylistType.HLS
      );

      Object.assign(options, {
        p2pMediaLoader: {
          playlistUrl: hlsPlaylist.playlistUrl,
          segmentsSha256Url: hlsPlaylist.segmentsSha256Url,
          redundancyBaseUrls: hlsPlaylist.redundancies.map(
            (r: any) => r.baseUrl
          ),
          trackerAnnounce: videoInfo.trackerUrls,
          videoFiles: hlsPlaylist.files,
        } as P2PMediaLoaderOptions,
      });
    }

    // Promise that is resolved when module runtime is initialized
    // TODO: Need a better way to do this
    let resolveStart: { (): void };
    let playbackStarted = new Promise((resolve, reject) => {
      resolveStart = function () {
        resolve(null);
      };
    });

    this.videojsPlayer = await this.initialize(
      mode,
      options,
      (player: videojs.Player) => (this.videojsPlayer = player),
      resolveStart
    );

    if (this.videojsPlayer) {
      this.videojsPlayer.on('customError', (event: any, data: any) => {
        this.handleError(data.err); // TODO
        resolveStart(); // TODO
      });

      this.videojsPlayer.play();

      /*
      if (this.isPlaylistEmbed()) {
        await this.buildPlaylistManager();

        this.videojsPlayer.playlist().updateSelected();

        this.videojsPlayer.on('stopped', () => {
          this.playNextVideo();
        });
      }
      */

      await playbackStarted;
    }

    // Record mode
    this.mode = mode;
  }

  handleError(error: any): void {
    // TODO
    console.error(error);
  }

  async close() {
    if (this.videojsPlayer) {
      this.videojsPlayer.dispose();
      this.videojsPlayer = null;
    }
  }

  async importPlayer(mode: PlayerMode): Promise<void> {
    if (mode === 'webtorrent') {
      await import('./webtorrent/webtorrent-plugin');
    } else if (mode === 'p2p-media-loader') {
      [this.p2pMediaLoaderModule] = await Promise.all([
        import('p2p-media-loader-hlsjs'),
        import('./p2p-media-loader/p2p-media-loader-plugin'),
      ]);
    }
  }

  async initialize(
    mode: PlayerMode,
    options: PlayerOptions,
    onPlayerChange: (player: videojs.Player) => void,
    resolveStart: { (): void }
  ): Promise<videojs.Player> {
    let returnValue: Promise<videojs.Player>;

    // TODO: Handle construction with no video element
    if (!this.playerElement) {
      return returnValue;
    }

    this.onPlayerChange = onPlayerChange;

    const videojsOptions = VideoPlayer.getVideojsOptions(
      mode,
      options,
      this.p2pMediaLoaderModule
    );

    const self = this;

    returnValue = new Promise((res) => {
      videojs(
        options.common.playerElement,
        videojsOptions,
        function onPlayerReady(this: videojs.Player) {
          const videojsPlayer: videojs.Player = this;

          let alreadyFallback = false;

          videojsPlayer.tech(true).one('error', async () => {
            if (!alreadyFallback) {
              alreadyFallback = true;
              await self.maybeFallbackToWebTorrent(
                mode,
                videojsPlayer,
                options
              );
              resolveStart(); // TODO
            } else {
              resolveStart();
            }
          });

          videojsPlayer.one('error', async () => {
            if (!alreadyFallback) {
              alreadyFallback = true;
              await self.maybeFallbackToWebTorrent(
                mode,
                videojsPlayer,
                options
              );
              resolveStart(); // TODO
            } else {
              resolveStart();
            }
          });

          videojsPlayer.one('play', () => {
            console.log('Success!');
            resolveStart();
          });

          return res(videojsPlayer);
        }
      );
    });

    return returnValue;
  }

  private async maybeFallbackToWebTorrent(
    currentMode: PlayerMode,
    player: videojs.Player,
    options: PlayerOptions
  ) {
    if (currentMode === 'webtorrent') {
      return;
    }

    console.error('Falling back to webtorrent');

    const newVideoElement = document.createElement('video');
    //newVideoElement.className = this.playerElementClassName // TODO

    // VideoJS wraps our video element inside a div
    let currentParentPlayerElement = options.common.playerElement.parentNode;

    // Fix on IOS, don't ask me why
    if (!currentParentPlayerElement) {
      currentParentPlayerElement = document.getElementById(
        options.common.playerElement.id
      ).parentNode;
    }

    currentParentPlayerElement.parentNode.insertBefore(
      newVideoElement,
      currentParentPlayerElement
    );

    options.common.playerElement = newVideoElement;
    options.common.onPlayerElementChange(newVideoElement);

    player.dispose();

    await import('./webtorrent/webtorrent-plugin');

    const mode = 'webtorrent';
    const videojsOptions = VideoPlayer.getVideojsOptions(mode, options);

    const self = this;
    videojs(newVideoElement, videojsOptions, function (this: videojs.Player) {
      const player = this;

      //self.addContextMenu(mode, player, options.common.embedUrl);

      self.onPlayerChange(player);
    });
  }

  private static getVideojsOptions(
    mode: PlayerMode,
    options: PlayerOptions,
    p2pMediaLoaderModule?: any
  ): videojs.PlayerOptions {
    const commonOptions = options.common;
    const isHLS = mode === 'p2p-media-loader';

    let autoplay = true;
    let html5 = {};

    const plugins: VideoJSPluginOptions = {
      /*
      peertube: {
        mode,
        autoplay, // Use peertube plugin autoplay because we get the file by webtorrent
        //videoViewUrl: commonOptions.videoViewUrl,
        videoDuration: commonOptions.videoDuration,
        //userWatching: commonOptions.userWatching,
        //subtitle: commonOptions.subtitle,
        //videoCaptions: commonOptions.videoCaptions,
        //stopTime: commonOptions.stopTime,
      },
      */
    };

    /*
    if (commonOptions.playlist) {
      plugins.playlist = commonOptions.playlist;
    }
    */

    if (isHLS) {
      const { hlsjs } = VideoPlayer.addP2PMediaLoaderOptions(
        plugins,
        options,
        p2pMediaLoaderModule
      );

      html5 = hlsjs.html5;
    }

    if (mode === 'webtorrent') {
      // TODO
      VideoPlayer.addWebTorrentOptions(plugins, options);

      // WebTorrent plugin handles autoplay, because we do some hackish stuff in there
      autoplay = false;
    }

    const videojsOptions = {
      html5,

      // We don't use text track settings for now
      textTrackSettings: false as any, // FIXME: typings
      controls: false,
      loop: true,

      muted: true,

      // TODO: On first play, disable autoplay to avoid issues
      // If the player already played videos, we can safely autoplay next ones
      //autoplay: this.getAutoPlayValue(autoplay),
      autoplay: autoplay,

      /*
      poster: commonOptions.poster,
      inactivityTimeout: commonOptions.inactivityTimeout,
      */
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],

      plugins,
    };

    return videojsOptions;
  }

  private static addP2PMediaLoaderOptions(
    plugins: VideoJSPluginOptions,
    options: PlayerOptions,
    p2pMediaLoaderModule: any
  ): any {
    const p2pMediaLoaderOptions = options.p2pMediaLoader;
    const commonOptions = options.common;

    const trackerAnnounce = p2pMediaLoaderOptions.trackerAnnounce.filter((t) =>
      t.startsWith('ws')
    );

    const redundancyUrlManager = new RedundancyUrlManager(
      options.p2pMediaLoader.redundancyBaseUrls
    );

    const p2pMediaLoader: P2PMediaLoaderPluginOptions = {
      redundancyUrlManager,
      type: 'application/x-mpegURL',
      startTime: commonOptions.startTime,
      src: p2pMediaLoaderOptions.playlistUrl,
    };

    let consumeOnly = false;
    // FIXME: typings
    if (
      navigator &&
      (navigator as any).connection &&
      (navigator as any).connection.type === 'cellular'
    ) {
      console.log('We are on a cellular connection: disabling seeding.');
      consumeOnly = true;
    }

    const p2pMediaLoaderConfig = {
      loader: {
        trackerAnnounce,
        segmentValidator: segmentValidatorFactory(
          options.p2pMediaLoader.segmentsSha256Url
        ),
        rtcConfig: getRtcConfig(),
        requiredSegmentsPriority: 5,
        segmentUrlBuilder: segmentUrlBuilderFactory(redundancyUrlManager),
        useP2P: getStoredP2PEnabled(),
        consumeOnly,
      },
      segments: {
        swarmId: p2pMediaLoaderOptions.playlistUrl,
      },
    };

    const hlsjs: object = {
      levelLabelHandler: (level: { height: number; width: number }): string => {
        const resolution: number = Math.min(
          level.height || 0,
          level.width || 0
        );

        const file = p2pMediaLoaderOptions.videoFiles.find(
          (f) => f.resolution.id === resolution
        );
        if (!file) {
          console.log(
            `Cannot find video file for level ${level.width}x${level.height}`
          );
          return level.height.toString();
        }

        let label: string = file.resolution.label;
        if (file.fps >= 50) {
          label += file.fps;
        }

        return label;
      },
      html5: {
        hlsjsConfig: {
          capLevelToPlayerSize: true,
          autoStartLoad: false,
          liveSyncDurationCount: 7,
          loader: new p2pMediaLoaderModule.Engine(
            p2pMediaLoaderConfig
          ).createLoaderClass(),
        },
      },
    };

    const toAssign = { p2pMediaLoader, hlsjs };
    Object.assign(plugins, toAssign);

    return toAssign;
  }

  private static addWebTorrentOptions(
    plugins: VideoJSPluginOptions,
    options: PlayerOptions
  ) {
    const commonOptions = options.common;
    const webtorrentOptions = options.webtorrent;

    const webtorrent = {
      autoplay: commonOptions.autoplay,
      videoDuration: commonOptions.videoDuration,
      playerElement: commonOptions.playerElement,
      videoFiles: webtorrentOptions.videoFiles,
      startTime: commonOptions.startTime,
    };

    Object.assign(plugins, { webtorrent });
  }
}
