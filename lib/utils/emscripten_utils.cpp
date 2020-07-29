/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

#include "emscripten_utils.h"

#include <emscripten/val.h>

unsigned int EmscriptenUtils::ArrayLength(const emscripten::val& v)
{
  return v["length"].as<unsigned int>();
}

void EmscriptenUtils::GetArrayData(const emscripten::val& v, uint8_t* dest, unsigned int destLength)
{
  emscripten::val memoryView{emscripten::typed_memory_view(destLength, dest)};
  memoryView.call<void>("set", v);
}
