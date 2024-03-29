/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

#pragma once

class MathUtils
{
public:
  /*!
   * \brief Calculate the geometric mean of two dimensions
   *
   * \param width An image width, in pixels
   * \param height An image height, in pixels
   *
   * \return The geometric mean, the square root of the product
   */
  static double GeometricMean(unsigned int width, unsigned int height);
};
