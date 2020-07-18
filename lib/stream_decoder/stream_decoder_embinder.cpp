/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

#include "stream_decoder.h"

#include <emscripten/bind.h>

using namespace emscripten;

EMSCRIPTEN_BINDINGS(stream_decoder)
{
  enum_<StreamDecoderState>("StreamDecoderState")
    .value("Init", StreamDecoderState::Init)
    .value("Running", StreamDecoderState::Running)
    .value("HasFrame", StreamDecoderState::HasFrame)
    .value("Failed", StreamDecoderState::Failed)
    ;

  class_<StreamDecoder>("StreamDecoder")
    .constructor<const std::string&>()
    .function("setBlockSize", &StreamDecoder::SetBlockSize)
    .function("addPacket", &StreamDecoder::AddPacket)
    .function("getFrame", &StreamDecoder::GetFrame)
    .property("state", &StreamDecoder::GetState)
    .property("frameWidth", &StreamDecoder::GetFrameWidth)
    .property("frameHeight", &StreamDecoder::GetFrameHeight)
    .property("frameSize", &StreamDecoder::GetFrameSize)
    ;
}
