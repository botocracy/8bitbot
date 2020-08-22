/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

#include "imgproc.hpp"

#include <opencv2/gapi/imgproc.hpp>

cv::GMat imgproc::RGBA2Gray(const cv::GMat& rgbaImage)
{
  return cv::gapi::RGBA2Gray(rgbaImage);
}

cv::GArray<cv::Point2f> imgproc::GoodFeaturesToTrack(const cv::GMat& grayscalImage,
                                                     unsigned int maxCorners,
                                                     double qualityLevel,
                                                     double minDistance)
{
  return cv::gapi::goodFeaturesToTrack(grayscalImage,
                                       static_cast<int>(maxCorners),
                                       qualityLevel,
                                       minDistance);
}
