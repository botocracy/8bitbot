/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

#include "scene_detector.h"

#include <emscripten/bind.h>

using namespace emscripten;

EMSCRIPTEN_BINDINGS(scene_detector)
{
  enum_<SceneDetectorState>("SceneDetectorState")
    .value("Init", SceneDetectorState::Init)
    .value("Running", SceneDetectorState::Running)
    .value("SceneDetected", SceneDetectorState::SceneDetected)
    .value("Failed", SceneDetectorState::Failed)
    ;

  class_<SceneDetector>("SceneDetector")
    .constructor<>()
    .function("open", &SceneDetector::OpenDetector)
    .function("addVideoFrame", &SceneDetector::AddVideoFrame)
    .function("close", &SceneDetector::CloseDetector)
    .property("state", &SceneDetector::GetState)
    ;
}
