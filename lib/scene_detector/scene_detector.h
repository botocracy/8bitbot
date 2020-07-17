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
  SceneDetector() = default;
  ~SceneDetector() = default;

  SceneDetectorState GetState() const { return m_state; }

  void AddVideoFrame(const emscripten::val& frame,
                     int width,
                     int height);

private:
  // Construction parameters
  const std::string m_fileName;

  // State parameters
  SceneDetectorState m_state = SceneDetectorState::Init;
};
