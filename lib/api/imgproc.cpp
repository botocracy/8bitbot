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

cv::GArray<cv::Point2f> imgproc::GoodFeaturesToTrack(const cv::GMat& grayscaleImage,
                                                     const cv::GScalar& maxFeatures,
                                                     const cv::GScalar& minDistance,
                                                     double qualityLevel,
                                                     const cv::Mat& mask,
                                                     int blockSize,
                                                     bool useHarrisDetector,
                                                     double k)
{
  return GGoodFeatures::on(grayscaleImage,
                           maxFeatures,
                           qualityLevel,
                           minDistance,
                           mask,
                           blockSize,
                           useHarrisDetector,
                           k);
}
