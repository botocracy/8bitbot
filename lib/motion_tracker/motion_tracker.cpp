/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

#include "motion_tracker.h"

#include "common/emscripten_utils.h"

#include <algorithm>
#include <cmath>
#include <emscripten/val.h>
#include <iostream>
#include <stddef.h>
#include <stdint.h>

namespace
{
  // Get byte length of line for AV_PIX_FMT_RGBA image
  unsigned int GetStride(unsigned int width)
  {
    return width * 4;
  }

  // Get size of buffer for AV_PIX_FMT_RGBA image
  unsigned int GetImageBufferSize(unsigned int width, unsigned int height)
  {
    return GetStride(width) * height;
  }

  /**
   * Clip a float value into the min-max range
   * @param a Value to clip
   * @param min Minimum value of the clip range
   * @param max Maximum value of the clip range
   * @return Clipped value
   */
  float ClipValue(float a, float min, float max)
  {
    if (a < min)
      return a = min;
    else if (a > max)
      return a = max;
    return a;
  }

  // Get the Sum of Absolute Differences between two frames
  uint64_t GetSceneSAD(const uint8_t* src1, ptrdiff_t stride1,
                       const uint8_t* src2, ptrdiff_t stride2,
                       ptrdiff_t width, ptrdiff_t height)
  {
    uint64_t sad = 0;

    for (unsigned y = 0; y < height; y++)
    {
      for (unsigned x = 0; x < width; x++)
        sad += std::abs(src1[x] - src2[x]);
      src1 += stride1;
      src2 += stride2;
    }

    return sad;
  }
}

bool MotionTracker::Open(int width, int height)
{
  if (width <= 0 || height <= 0)
    return false;

  if (!Initialize(static_cast<unsigned int>(width), static_cast<unsigned int>(height)))
    return false;

  return true;
}

bool MotionTracker::Initialize(unsigned int width, unsigned int height)
{
  // TODO: Initialize OpenCV

  m_width = width;
  m_height = height;

  const unsigned int frameSize = GetImageBufferSize(m_width, m_height);

  m_currentFrame.resize(frameSize);
  m_previousFrame.resize(frameSize);

  return true;
}

bool MotionTracker::AddVideoFrame(const emscripten::val& frame)
{
  const unsigned int dataSize = EmscriptenUtils::ArrayLength(frame);

  // Sanitize input
  if (dataSize == 0)
  {
    std::cerr << "Invalid data size (" << dataSize << ")" << std::endl;
    return false;
  }

  EmscriptenUtils::GetArrayData(frame, m_currentFrame.data(), m_currentFrame.size());

  const float currentMafd = CalcMafd(m_previousFrame, m_currentFrame, m_width, m_height);
  m_sceneScore = CalcSceneScore(currentMafd, m_previousMafd);

  std::swap(m_currentFrame, m_previousFrame);
  m_previousMafd = currentMafd;

  return true;
}

float MotionTracker::CalcMafd(const std::vector<uint8_t>& currentFrame,
                              const std::vector<uint8_t>& previousFrame,
                              unsigned int width, unsigned int height)
{
  const uint8_t* const src1 = previousFrame.data();
  const ptrdiff_t stride1 = GetStride(width);
  const uint8_t* const src2 = currentFrame.data();
  const ptrdiff_t stride2 = GetStride(width);
  const uint64_t sad = GetSceneSAD(src1, stride1, src2, stride2, width, height);

  const uint64_t count = width * height;
  return static_cast<float>(sad) / static_cast<float>(count);
}

float MotionTracker::CalcSceneScore(float currentMafd, float previousMafd)
{
  const float diff = std::abs(currentMafd - previousMafd);

  return ClipValue(std::min(currentMafd, diff) / 100.0f, 0, 1);
}
