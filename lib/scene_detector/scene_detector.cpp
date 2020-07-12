/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

extern "C"
{
#include <libavutil/mem.h>

// TODO
#include <libavcodec/avcodec.h>
#include <libavformat/avformat.h>
#include <libswscale/swscale.h>
#include <libavutil/imgutils.h>
#include <libavutil/opt.h>
#include <libavutil/channel_layout.h>
#include <libavutil/samplefmt.h>
#include <libswresample/swresample.h>
}

#include <cstring>

#include "scene_detector.h"

SceneDetector::SceneDetector(const std::string& filePath)
  : m_filePath(filePath)
{
}

SceneDetector::~SceneDetector()
{
  if (m_videoBuffer != nullptr)
    av_free(static_cast<void*>(m_videoBuffer));
}

void SceneDetector::AddVideoFrame(uintptr_t decodedData,
                                  unsigned int size,
                                  unsigned int width,
                                  unsigned int height)
{
  // Data context
  AVPixelFormat format = AV_PIX_FMT_RGBA;
  const unsigned int align = 4;

  // Allocate memory
  if (m_videoBuffer != nullptr)
    av_free(static_cast<void*>(m_videoBuffer));
  m_videoBuffer = static_cast<uint8_t*>(av_malloc(size));

  // Copy memory
  std::memcpy(static_cast<void*>(m_videoBuffer), reinterpret_cast<const void*>(decodedData), size);

  // Update state
  m_state = SceneDetectorState::SceneDetected; // TODO
  m_videoStride = av_image_get_buffer_size(format, width, 1, align);
}
