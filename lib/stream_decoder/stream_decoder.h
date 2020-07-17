/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

#pragma once

#include <deque>
#include <stdint.h>
#include <string>
#include <vector>

extern "C"
{
#include <libavformat/avio.h>
}

namespace emscripten
{
class val;
}

enum class StreamDecoderState
{
  Init,
  Running,
  HasFrame,
  Failed,
};

class StreamDecoder
{
public:
  StreamDecoder(const std::string& streamUrl);
  ~StreamDecoder();

  // Can't use void* because embind has problems with a getter that returns
  // a raw pointer
  void AddPacket(const emscripten::val& packet);

  StreamDecoderState GetState() const;

  unsigned int GetFrameWidth() const;
  unsigned int GetFrameHeight() const;
  unsigned int GetFrameSize() const;

  uintptr_t GetFrame();

private:
  // Construction parameters
  const std::string& m_streamUrl;

  // Video parameters
  AVIOContext* m_ioContext = nullptr;
  std::deque<std::vector<uint8_t>> m_frames;
  std::vector<uint8_t> m_currentFrame;

  // State parameters
  StreamDecoderState m_state = StreamDecoderState::Init;
};
