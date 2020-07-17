/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

#include "scene_detector.h"
#include "common/emscripten_utils.h"

#include <cstring>
#include <emscripten/val.h>
#include <iostream>
#include <sstream>

extern "C"
{
#include <libavfilter/buffersink.h>
#include <libavfilter/buffersrc.h>
#include <libavutil/frame.h>
#include <libavutil/imgutils.h>
#include <libavutil/mem.h>
#include <libavutil/opt.h>
}

namespace
{
// Data context
const AVPixelFormat PIXEL_FORMAT = AV_PIX_FMT_RGBA;
const unsigned int BYTE_ALIGN = 4;

// Filter parameters
const char* FILTER_DESCRIPTION = "select='gt(scene,0.3)'";
}

bool SceneDetector::OpenDetector(int width, int height)
{
  if (width <= 0 || height <= 0)
    return false;

  if (!Initialize(width, height))
  {
    m_state = SceneDetectorState::Failed;
    return false;
  }

  return true;
}

bool SceneDetector::Initialize(unsigned int width, unsigned int height)
{
  const AVFilter* bufferSource = avfilter_get_by_name("buffer");
  const AVFilter* bufferSink = avfilter_get_by_name("buffersink");

  if (bufferSource == nullptr || bufferSink == nullptr)
  {
    std::cerr << "Failed to get filters" << std::endl;
    return false;
  }

  AVFilterInOut* outputs = avfilter_inout_alloc();
  AVFilterInOut* inputs  = avfilter_inout_alloc();

  m_filterGraph = avfilter_graph_alloc();

  if (outputs == nullptr || inputs == nullptr || m_filterGraph == nullptr)
  {
    std::cerr << "Failed to allocate filter graph" << std::endl;
    return false;
  }

  // Buffer video source: the decoded frames from the decoder will be inserted
  // here
  const int TIME_BASE_NUM = 1; // TODO
  const int TIME_BASE_DEN = 1; // TODO
  const int PIXEL_ASPECT_NUM = 1; // TODO
  const int PIXEL_ASPECT_DEN = 1; // TODO
  std::ostringstream args;
  args << "video_size=" << width << "x" << height << ":pix_fmt="
      << PIXEL_FORMAT << ":time_base=" << TIME_BASE_NUM << "/"
      << TIME_BASE_DEN << ":pixel_aspect=" << PIXEL_ASPECT_NUM
      << "/" << PIXEL_ASPECT_DEN;

  int result = avfilter_graph_create_filter(&m_bufferSourceContext, bufferSource,
                                            "in", args.str().c_str(), nullptr,
                                            m_filterGraph);
  if (result < 0)
  {
    std::cerr << "Failed to create source filter: " << av_err2str(result) << std::endl;
    return false;
  }

  // Buffer video sink: to terminate the filter chain
  result = avfilter_graph_create_filter(&m_bufferSinkContext, bufferSink, "out",
                                        nullptr, nullptr, m_filterGraph);
  if (result < 0)
  {
    std::cerr << "Failed to create sink filter: " << av_err2str(result) << std::endl;
    return false;
  }

  // Set the endpoints for the filter graph. The filter graph will be linked
  // to the graph described by filters_descr.

  // The buffer source output must be connected to the input pad of the first
  // filter described by filters_descr; since the first filter input label is
  // not specified, it is set to "in" by default.
  outputs->name = av_strdup("in");
  outputs->filter_ctx = m_bufferSourceContext;
  outputs->pad_idx = 0;
  outputs->next = nullptr;

  // The buffer sink input must be connected to the output pad of the last
  // filter described by filters_descr; since the last filter output label is
  // not specified, it is set to "out" by default.
  inputs->name = av_strdup("out");
  inputs->filter_ctx = m_bufferSinkContext;
  inputs->pad_idx = 0;
  inputs->next = nullptr;

  result = avfilter_graph_parse_ptr(m_filterGraph, FILTER_DESCRIPTION, &inputs,
                                    &outputs, nullptr);
  if (result < 0)
  {
    std::cerr << "Failed avfilter_graph_parse_ptr(): " << av_err2str(result) << std::endl;
    return false;
  }

  avfilter_inout_free(&inputs);
  avfilter_inout_free(&outputs);

  m_width = width;
  m_height = height;

  return true;
}

void SceneDetector::Deinitialize()
{
  if (m_filterGraph)
    avfilter_graph_free(&m_filterGraph);
}

void SceneDetector::AddVideoFrame(const emscripten::val& frame,
                                  int width,
                                  int height)
{
  if (m_state == SceneDetectorState::Failed)
    return;

  // Reset state
  m_state = SceneDetectorState::Running;

  const unsigned int dataSize = EmscriptenUtils::ArrayLength(frame);

  // Sanitize input
  if (dataSize == 0 || width <= 0 || height <= 0)
  {
    std::cerr << "Invalid parameters: dataSize=" << dataSize << ", width="
        << width << ", height=" << height << std::endl;
    m_state = SceneDetectorState::Failed;
    return;
  }

  // Verify size constraint
  const unsigned int videoStride = av_image_get_buffer_size(PIXEL_FORMAT, width, 1, BYTE_ALIGN);
  if (height * videoStride != dataSize)
  {
    std::cout << "Invalid dimensions: width (" << width << ") height ("
        << height << ") videoStride (" << videoStride << ") frame size ("
        << dataSize << ")" << std::endl;
    m_state = SceneDetectorState::Failed;
    return;
  }

  AVFrame* decodedFrame = av_frame_alloc();
  if (decodedFrame == nullptr)
  {
    std::cerr << "Failed to allocate frame" << std::endl;
    m_state = SceneDetectorState::Failed;
    return;
  }

  decodedFrame->data[0] = static_cast<uint8_t*>(av_malloc(dataSize));
  if (decodedFrame->data[0] == nullptr)
  {
    std::cerr << "Failed to allocate frame pixels" << std::endl;
    m_state = SceneDetectorState::Failed;
    return;
  }

  decodedFrame->linesize[0] = videoStride;
  decodedFrame->width = width;
  decodedFrame->height = height;
  decodedFrame->format = PIXEL_FORMAT;

  EmscriptenUtils::GetArrayData(frame, decodedFrame->data[0], dataSize);

  // Push the decoded frame into the filter graph
  int result = av_buffersrc_add_frame_flags(m_bufferSourceContext, decodedFrame, AV_BUFFERSRC_FLAG_PUSH);

  if (result < 0)
  {
    std::cerr << "Error while feeding the filter graph: " << av_err2str(result) << std::endl;
    m_state = SceneDetectorState::Failed;
    // TODO: RAII
    av_free(decodedFrame->data[0]);
    av_frame_free(&decodedFrame);
    return;
  }

  // Pull filtered frames from the filter graph
  AVFrame* filterFrame = av_frame_alloc();
  if (filterFrame == nullptr)
  {
    std::cerr << "Could not allocate frame" << std::endl;
    m_state = SceneDetectorState::Failed;
    // TODO: RAII
    av_free(decodedFrame->data[0]);
    av_frame_free(&decodedFrame);
    return;
  }

  while (true)
  {
    result = av_buffersink_get_frame(m_bufferSinkContext, filterFrame);

    if (result == AVERROR(EAGAIN) || result == AVERROR_EOF)
      break;

    av_frame_unref(filterFrame);

    if (result < 0)
    {
      std::cerr << "Failed to get frame from filter graph: " << av_err2str(result) << std::endl;
      m_state = SceneDetectorState::Failed;
      break;
    }

    // Update state
    m_state = SceneDetectorState::SceneDetected;
  }

  av_frame_free(&filterFrame);
  av_free(decodedFrame->data[0]);
  av_frame_free(&decodedFrame);
}
