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
  class_<MotionTracker>("MotionTracker")
    .constructor<>()
    .function("open", &MotionTracker::Open)
    .function("addVideoFrame", &MotionTracker::AddVideoFrame)
    .function("close", &MotionTracker::Close)
    .property("sceneScore", &MotionTracker::GetSceneScore)
    .property("pointData", &MotionTracker::GetPointData)
    .property("pointSize", &MotionTracker::GetPointSize)
    .property("rotationMatrix", &MotionTracker::GetRotationMatrix)
    .property("translationVector", &MotionTracker::GetTranslationVector)
    ;
}
