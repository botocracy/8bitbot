/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

#pragma once

#include <stdint.h>
#include <string>

namespace emscripten
{
class val;
}

enum class SceneDetectorState
{
  Init,
  Running,
  SceneDetected,
  Failed,
};

class SceneDetector
{
public:
  SceneDetector(const std::string& filePath);
  ~SceneDetector();

  SceneDetectorState GetState() const { return m_state; }

  void AddVideoFrame(const emscripten::val& frame,
                     unsigned int width,
                     unsigned int height);

private:
  // Construction parameters
  const std::string m_filePath;

  // Memory parameters
  uint8_t* m_videoBuffer = nullptr;

  // State parameters
  SceneDetectorState m_state = SceneDetectorState::Init;
  unsigned int m_videoStride = 0;
};
