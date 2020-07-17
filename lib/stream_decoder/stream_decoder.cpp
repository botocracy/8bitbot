/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

#include "stream_decoder.h"

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

StreamDecoder::StreamDecoder(const std::string& streamUrl)
 : m_streamUrl(streamUrl)
{
}

StreamDecoder::~StreamDecoder() = default;

void StreamDecoder::AddPacket(const emscripten::val& packet)
{
  if (m_frames.empty())
  {
    const unsigned int dataSize = ArrayLength(packet);

    std::vector<uint8_t> data(dataSize);

    GetArrayData(packet, data.data(), dataSize);

    m_frames.emplace_back(std::move(data));
  }

  m_state = StreamDecoderState::Running;
}

StreamDecoderState StreamDecoder::GetState() const
{
  if (!m_frames.empty())
    return StreamDecoderState::HasFrame;

  return m_state;
}

unsigned int StreamDecoder::GetFrameWidth() const
{
  if (!m_frames.empty())
  {
    // TODO
    return 720;
  }

  return 0;
}

unsigned int StreamDecoder::GetFrameHeight() const
{
  if (!m_frames.empty())
  {
    // TODO
    return 480;
  }

  return 0;
}

unsigned int StreamDecoder::GetFrameSize() const
{
  if (!m_frames.empty())
    return m_frames.front().size();

  return 0;
}

uintptr_t StreamDecoder::GetFrame()
{
  if (!m_frames.empty()) {
    m_currentFrame = std::move(m_frames.front());
    m_frames.pop_front();

    return reinterpret_cast<uintptr_t>(m_currentFrame.data());
  }

  return 0;
}
