/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

#include "scene_detector.h"
#include "common/emscripten_utils.h"

#include <cstring>
#include <emscripten/val.h>
#include <iostream>

extern "C"
{
#include <libavutil/imgutils.h>
#include <libavutil/mem.h>
}

void SceneDetector::AddVideoFrame(const emscripten::val& frame,
                                  int width,
                                  int height)
{
  const unsigned int dataSize = EmscriptenUtils::ArrayLength(frame);

  // Sanitize input
  if (dataSize == 0 || width <= 0 || height <= 0)
  {
    std::cerr << "Invalid parameters: dataSize=" << dataSize << ", width="
        << width << ", height=" << height << std::endl;
    m_state = SceneDetectorState::Failed;
    return;
  }

  std::vector<uint8_t> pixelData(dataSize);

  EmscriptenUtils::GetArrayData(frame, pixelData.data(), dataSize);

  const void* dataPtr = reinterpret_cast<const void*>(pixelData.data());

  // Data context
  AVPixelFormat format = AV_PIX_FMT_RGBA;
  const unsigned int align = 4;

  // Verify size constraint
  const unsigned int videoStride = av_image_get_buffer_size(format, width, 1, align);
  if (height * videoStride != dataSize)
  {
    std::cout << "Invalid dimensions: width (" << width << ") height ("
        << height << ") videoStride (" << videoStride << ") frame size ("
        << dataSize << ")" << std::endl;
    m_state = SceneDetectorState::Failed;
    return;
  }

  // Update state
  m_state = SceneDetectorState::SceneDetected; // TODO
}
