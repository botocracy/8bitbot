/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

#include "scene_detector.h"

#include <cstring>
#include <emscripten/val.h>

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

namespace
{
  unsigned int ArrayLength(const emscripten::val& v)
  {
    return v["length"].as<unsigned int>();
  }

  void GetArrayData(const emscripten::val& v, uint8_t* dest, unsigned int destLength)
  {
    emscripten::val memoryView{emscripten::typed_memory_view(destLength, dest)};
    memoryView.call<void>("set", v);
  }
}

SceneDetector::SceneDetector(const std::string& filePath)
  : m_filePath(filePath)
{
}

SceneDetector::~SceneDetector()
{
  if (m_videoBuffer != nullptr)
    av_free(static_cast<void*>(m_videoBuffer));
}

void SceneDetector::AddVideoFrame(const emscripten::val& frame,
                                  unsigned int width,
                                  unsigned int height)
{
  const unsigned int dataSize = ArrayLength(frame);

  // Sanitize input
  if (dataSize == 0 || width == 0 || height == 0)
  {
    m_state = SceneDetectorState::Failed;
    return;
  }

  std::vector<uint8_t> pixelData(dataSize);

  GetArrayData(frame, pixelData.data(), dataSize);

  const void* dataPtr = reinterpret_cast<const void*>(pixelData.data());

  // Data context
  AVPixelFormat format = AV_PIX_FMT_RGBA;
  const unsigned int align = 4;

  // Verify size constraint
  const unsigned int videoStride = av_image_get_buffer_size(format, width, 1, align);
  /*
  if (height * videoStride != dataSize)
  {
    m_state = SceneDetectorState::Failed;
    return;
  }
  */

  // Allocate memory
  if (m_videoBuffer != nullptr)
    av_free(static_cast<void*>(m_videoBuffer));
  m_videoBuffer = static_cast<uint8_t*>(av_malloc(dataSize));

  // Copy memory
  std::memcpy(static_cast<void*>(m_videoBuffer), dataPtr, dataSize);

  // Update state
  m_state = SceneDetectorState::SceneDetected; // TODO
  m_videoStride = videoStride;
}
