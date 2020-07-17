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

extern "C"
{
#include <libavfilter/avfilter.h>
}

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
  ~SceneDetector() { Deinitialize(); }

  bool OpenDetector(int width, int height);
  void AddVideoFrame(const emscripten::val& frame,
                     int width,
                     int height);
  void CloseDetector() { Deinitialize(); }

  SceneDetectorState GetState() const { return m_state; }

private:
  bool Initialize(unsigned int width, unsigned int height);
  void Deinitialize();

  // Construction parameters
  const std::string m_fileName;

  // State parameters
  SceneDetectorState m_state = SceneDetectorState::Init;

  // Video parameters
  unsigned int m_width = 0;
  unsigned int m_height = 0;
  AVFilterGraph* m_filterGraph = nullptr;
  AVFilterContext* m_bufferSourceContext = nullptr;
  AVFilterContext* m_bufferSinkContext = nullptr;
};
