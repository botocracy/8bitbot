/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

#include "stream_decoder.h"

#include <cstdio>
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

static AVCodecContext* createCodecContext(AVFormatContext* formatContext, int streamId)
{
    AVCodecContext* codecContext = nullptr;
    auto orignalContext = formatContext->streams[streamId]->codec;
    auto codec = avcodec_find_decoder(orignalContext->codec_id);
    JIF(codec == nullptr, "failed avcodec_find_decoder %d", orignalContext->codec_id);
    codecContext = avcodec_alloc_context3(codec);
    JIF(codecContext == nullptr, "failed avcodec_alloc_context3");
    JIF(avcodec_copy_context(codecContext, orignalContext) != 0, "failed avcodec_copy_context");
    JIF(avcodec_open2(codecContext, codec, nullptr) < 0, "failed avcodec_open2");

    return codecContext;
err:
    if (codecContext) avcodec_free_context(&codecContext);
    return nullptr;
}

StreamDecoder::StreamDecoder(const std::string& streamUrl)
 : m_streamUrl(streamUrl)
{
}

StreamDecoder::~StreamDecoder()
{
  Deinitialize();
}

bool StreamDecoder::Initialize()
{
  AVInputFormat* inputFormat = NULL;

  const AVIOInterruptCB interruptCallback = { InterruptCallback, this };

  // Preallocate an AVFormatContext to use our custom read function instead of
  // the avformat internal I/O layer
  m_pFormatContext = avformat_alloc_context();
  m_pFormatContext->interrupt_callback = interruptCallback;

  unsigned int bufferSize = 4096;

  if (m_blockSize > 1)
    bufferSize = m_blockSize;

  uint8_t* buffer = static_cast<uint8_t*>(av_malloc(bufferSize));
  m_ioContext = avio_alloc_context(buffer, bufferSize, 0, this, ReadPacketInternal, nullptr, nullptr);

  if (m_blockSize > 1)
    m_ioContext->max_packet_size = bufferSize;

  //m_ioContext->seekable = 0;

  // TODO
  inputFormat = av_find_input_format("mp4");

  if (inputFormat->name)
    std::printf("Probing detected format [%s]", inputFormat->name);
  else
    std::printf("Probing detected unnamed format");

  // Set the pb field of the AVFormatContext to the newly created AVIOContext
  m_pFormatContext->pb = m_ioContext;

  if (avformat_open_input(&m_pFormatContext, m_streamUrl.c_str(), inputFormat, nullptr) < 0)
  {
    std::printf("Error, could not open file %s", m_streamUrl.c_str());
    Deinitialize();
    return false;
  }

  // Use nonblocking reads
  m_pFormatContext->flags |= AVFMT_FLAG_NONBLOCK;

  return true;
}

void StreamDecoder::Deinitialize()
{
  //m_pkt.result = -1;
  //av_packet_unref(&m_pkt.pkt);

  if (m_pFormatContext != nullptr)
  {
    avformat_close_input(&m_pFormatContext);
    m_pFormatContext = nullptr;
  }

  if (m_ioContext != nullptr)
  {
    av_free(m_ioContext->buffer);
    av_free(m_ioContext);
    m_ioContext = nullptr;
  }
}

void StreamDecoder::AddPacket(const emscripten::val& packet)
{
  if (m_state == StreamDecoderState::Init)
  {
    m_state = StreamDecoderState::Running;
    Initialize();
  }




  const unsigned int dataSize = ArrayLength(packet);

  std::vector<uint8_t> data(dataSize);

  GetArrayData(packet, data.data(), dataSize);

  m_packets.emplace_back(std::move(data));

  // TODO: Consume data
}

StreamDecoderState StreamDecoder::GetState() const
{
  if (!m_packets.empty())
    return StreamDecoderState::HasFrame;

  return m_state;
}

unsigned int StreamDecoder::GetFrameWidth() const
{
  if (!m_packets.empty())
  {
    // TODO
    return 720;
  }

  return 0;
}

unsigned int StreamDecoder::GetFrameHeight() const
{
  if (!m_packets.empty())
  {
    // TODO
    return 480;
  }

  return 0;
}

unsigned int StreamDecoder::GetFrameSize() const
{
  if (!m_packets.empty())
    return m_packets.front().size();

  return 0;
}

uintptr_t StreamDecoder::GetFrame()
{
  if (!m_packets.empty()) {
    m_currentFrame = std::move(m_packets.front());
    m_packets.pop_front();

    return reinterpret_cast<uintptr_t>(m_currentFrame.data());
  }

  return 0;
}

int StreamDecoder::ReadPacket(uint8_t* buffer, int bufferSize)
{
  if (GetState() == StreamDecoderState::Failed)
    return AVERROR_EXIT;

  unsigned int length = GetPacket(buffer, static_cast<unsigned int>(bufferSize));

  if (length == 0)
    return AVERROR_EOF;
  else
    return length;
}

unsigned int StreamDecoder::GetPacket(uint8_t* buffer, unsigned int bufferSize)
{
  if (!m_packets.empty())
  {
    std::vector<uint8_t>& packet = m_packets.front();

    unsigned int start = m_packetOffset;
    unsigned int copySize = std::min(bufferSize, static_cast<unsigned int>(packet.size()) - m_packetOffset);

    if (copySize > 0)
    {
      std::memcpy(static_cast<void*>(buffer), static_cast<const void*>(packet.data() + m_packetOffset), copySize);

      m_packetOffset += copySize;

      if (m_packetOffset >= packet.size())
      {
        m_packetOffset = 0;
        m_packets.pop_front();
      }

      return copySize;
    }
  }

  return 0;
}

int StreamDecoder::InterruptCallback(void* context)
{
  StreamDecoder* decoder = static_cast<StreamDecoder*>(context);
  if (decoder && decoder->GetState() == StreamDecoderState::Failed)
    return 1;

  return 0;
}

int StreamDecoder::ReadPacketInternal(void* context, uint8_t* buffer, int bufferSize)
{
  StreamDecoder* decoder = static_cast<StreamDecoder*>(context);
  if (decoder != nullptr)
    return decoder->ReadPacket(buffer, bufferSize);

  return AVERROR_EXIT;
}
