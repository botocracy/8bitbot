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
#include <libavformat/avformat.h>
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

  void SetBlockSize(unsigned int blockSize) { m_blockSize = blockSize; }

  bool Initialize();
  void Deinitialize();

  // Can't use void* because embind has problems with a getter that returns
  // a raw pointer
  void AddPacket(const emscripten::val& packet);

  StreamDecoderState GetState() const;

  unsigned int GetFrameWidth() const;
  unsigned int GetFrameHeight() const;
  unsigned int GetFrameSize() const;

  uintptr_t GetFrame();

private:
  int ReadPacket(uint8_t* buffer, int bufferSize);
  unsigned int GetPacket(uint8_t* buffer, unsigned int bufferSize);

  static int InterruptCallback(void* context);
  static int ReadPacketInternal(void* context, uint8_t* buffer, int bufferSize);

  // Construction parameters
  const std::string& m_streamUrl;

  // State parameters
  StreamDecoderState m_state = StreamDecoderState::Init;

  // Video parameters
  unsigned int m_blockSize = 0;

  // Video handles
  AVIOContext* m_ioContext = nullptr;
  AVFormatContext* m_pFormatContext = nullptr;

  //std::deque<std::vector<uint8_t>> m_packets;
  //unsigned int m_packetOffset = 0;
  //std::vector<uint8_t> m_currentFrame;

};
