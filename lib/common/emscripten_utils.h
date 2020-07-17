/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

#pragma once

#include <stdint.h>

namespace emscripten
{
class val;
}

class EmscriptenUtils
{
public:
  static unsigned int ArrayLength(const emscripten::val& v);
  static void GetArrayData(const emscripten::val& v, uint8_t* dest, unsigned int destLength);
};
