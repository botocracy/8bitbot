/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

#pragma once

#include <stdint.h>
#include <vector>

namespace emscripten
{
class val;
}

class MotionTracker
{
public:
  MotionTracker() = default;
  ~MotionTracker() { Deinitialize(); }

  bool Open(int width, int height);
  bool AddVideoFrame(const emscripten::val& frame);
  void Close() { Deinitialize(); }

  float GetSceneScore() const { return m_sceneScore; }
  uintptr_t GetPointData() const { return reinterpret_cast<uintptr_t>(m_points.data()); }
  unsigned int GetPointSize() const { return static_cast<unsigned int>(m_points.size()); }
  unsigned int GetRotationMatrix() const { return 0; } // TODO
  unsigned int GetTranslationVector() const { return 0; } // TODO

private:
  bool Initialize(unsigned int width, unsigned int height);
  void Deinitialize() { }

  static float CalcMafd(const std::vector<uint8_t>& currentFrame,
                        const std::vector<uint8_t>& previousFrame,
                        unsigned int width, unsigned int height);
  static float CalcSceneScore(float currentMafd, float previousMafd);

  // Video parameters
  unsigned int m_width = 0;
  unsigned int m_height = 0;
  std::vector<uint8_t> m_currentFrame;

  // State parameters
  std::vector<uint8_t> m_previousFrame;
  float m_previousMafd = 0.0;

  // Frame parameters
  float m_sceneScore = 0.0f;
  std::vector<uint8_t> m_points; // TODO
  std::vector<uint8_t> m_rotationMatrix; // TODO
  std::vector<uint8_t> m_translationVector; // TODO
};
