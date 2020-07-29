/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

#include "motion_tracker.h"

#include <emscripten/bind.h>

using namespace emscripten;

EMSCRIPTEN_BINDINGS(motion_tracker)
{
  value_object<FrameInfo>("FrameInfo")
    .field("sceneScore", &FrameInfo::sceneScore)
    .field("pointData", &FrameInfo::pointData)
    .field("pointSize", &FrameInfo::pointSize)
    .field("rotationMatrixData", &FrameInfo::rotationMatrixData)
    .field("rotationMatrixSize", &FrameInfo::rotationMatrixSize)
    .field("translationVectorData", &FrameInfo::translationVectorData)
    .field("translationVectorSize", &FrameInfo::translationVectorSize)
    ;

  class_<MotionTracker>("MotionTracker")
    .constructor<>()
    .function("initialize", &MotionTracker::Initialize)
    .function("addVideoFrame", &MotionTracker::AddVideoFrame)
    .function("deinitialize", &MotionTracker::Deinitialize)
    ;
}
