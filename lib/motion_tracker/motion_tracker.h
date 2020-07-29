/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

#pragma once

#include <opencv2/core/mat.hpp>
#include <stdint.h>
#include <vector>

namespace emscripten
{
class val;
}

struct FrameInfo
{
  float sceneScore = 0.0f; // in the range [0.0, 1.0]
  uintptr_t pointData = 0; // TODO: uint8_t*
  unsigned int pointSize = 0;
  uintptr_t rotationMatrixData = 0;
  unsigned int rotationMatrixSize = 0;
  uintptr_t translationVectorData = 0;
  unsigned int translationVectorSize = 0;
};

class MotionTracker
{
public:
  MotionTracker() = default;
  ~MotionTracker() { Deinitialize(); }

  bool Initialize(int width, int height);
  FrameInfo AddVideoFrame(const emscripten::val& frameArray);
  void Deinitialize() { }

private:
  // Video parameters
  unsigned int m_width = 0;
  unsigned int m_height = 0;

  // Frame resources
  std::vector<uint8_t> m_points;
  std::vector<uint8_t> m_rotationMatrix;
  std::vector<uint8_t> m_translationVector;

  // State parameters
  cv::Mat m_currentFrame;
  cv::Mat m_previousFrame;
  float m_previousMafd = 0.0;
};
