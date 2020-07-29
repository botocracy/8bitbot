/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

#include "motion_tracker.h"

#include "utils/emscripten_utils.h"
#include "utils/image_utils.h"

#include <algorithm>
#include <cmath>
#include <emscripten/val.h>
#include <iostream>
#include <opencv2/calib3d.hpp>
#include <opencv2/core.hpp>
#include <opencv2/core/mat.hpp>
#include <opencv2/gapi.hpp>
#include <opencv2/gapi/core.hpp>
#include <opencv2/gapi/cpu/gcpukernel.hpp>
#include <opencv2/gapi/imgproc.hpp>
#include <opencv2/gapi/video.hpp>
//#include <opencv2/sfm.hpp> // TODO
#include <opencv2/video.hpp>
#include <stddef.h>
#include <stdint.h>

namespace opencv_test
{
  struct BackSubStateParams
  {
    std::string method;
  };
}

namespace cv
{
  namespace detail
  {
    template<> struct CompileArgTag<opencv_test::BackSubStateParams>
    {
      static const char* tag()
      {
        return "org.opencv.test..background_substractor_state_params";
      }
    };
  }
}

namespace opencv_test
{
namespace
{
  G_TYPED_KERNEL(GCountCalls, <cv::GOpaque<int>(cv::GMat)>, "org.opencv.test.count_calls")
  {
    static cv::GOpaqueDesc outMeta(cv::GMatDesc /* in */)
    {
      return cv::empty_gopaque_desc();
    }
  };

  GAPI_OCV_KERNEL_ST(GOCVCountCalls, GCountCalls, int)
  {
    static void setup(const cv::GMatDesc &/* in */, std::shared_ptr<int> &state)
    {
      state.reset(new int{});
    }

    static void run(const cv::Mat &/* in */, int &out, int& state)
    {
      out = ++state;
    }
  };

  G_TYPED_KERNEL(GIsStateUpToDate, <cv::GOpaque<bool>(cv::GMat)>,
                 "org.opencv.test.is_state_up-to-date")
  {
    static cv::GOpaqueDesc outMeta(cv::GMatDesc /* in */)
    {
      return cv::empty_gopaque_desc();
    }
  };

  GAPI_OCV_KERNEL_ST(GOCVIsStateUpToDate, GIsStateUpToDate, cv::Size)
  {
    static void setup(const cv::GMatDesc &in, std::shared_ptr<cv::Size> &state)
    {
      state.reset(new cv::Size(in.size));
    }

    static void run(const cv::Mat &in , bool &out, cv::Size& state)
    {
      out = in.size() == state;
    }
  };

  G_TYPED_KERNEL(GBackSub, <cv::GMat(cv::GMat)>, "org.opencv.test.background_substractor")
  {
     static cv::GMatDesc outMeta(cv::GMatDesc in)
     {
       return in.withType(CV_8U, 1);
     }
  };

  GAPI_OCV_KERNEL_ST(GOCVBackSub, GBackSub, cv::BackgroundSubtractor)
  {
    static void setup(const cv::GMatDesc &/* desc */,
                      std::shared_ptr<cv::BackgroundSubtractor> &state,
                      const cv::GCompileArgs &compileArgs)
    {
      auto sbParams = cv::gapi::getCompileArg<BackSubStateParams>(compileArgs)
                      .value_or(BackSubStateParams{});

      if (sbParams.method == "knn")
        state = cv::createBackgroundSubtractorKNN();
      else if (sbParams.method == "mog2")
        state = cv::createBackgroundSubtractorMOG2();

      GAPI_Assert(state);
    }

    static void run(const cv::Mat& in, cv::Mat &out, cv::BackgroundSubtractor& state)
    {
      state.apply(in, out, -1);
    }
  };
}
}

bool MotionTracker::Initialize(int width, int height)
{
  if (width <= 0 || height <= 0)
    return false;

  m_width = width;
  m_height = height;

  m_currentFrame.create(m_width, m_height, CV_8UC4);
  m_previousFrame.create(m_width, m_height, CV_8UC4);

  return true;
}

namespace
{
  cv::GArray<cv::Point2f> GoodFeaturesToTrack(const cv::GMat& grayscalImage)
  {
    // Maximum number of corners to return. If there are more corners than are
    // found, the strongest of them is returned.
    const int maxCorners = 100;

    // Minimal accepted quality of image corners
    //
    // This parameter characterizes the minimal accepted quality of
    // corners.
    //
    // The parameter value is multiplied by the best corner quality measure,
    // which is the minimal eigenvalue or the Harris function response.
    //
    // The corners with the quality measure less than the product are rejected.
    //
    // For example, if the best corner has the quality measure = 1500, and the
    // qualityLevel = 0.01, then all the corners with the quality measure less
    // than 15 are rejected.
    const double qualityLevel = 0.1;

    // Minimum possible Euclidean distance between the returned corners
    const double minDistance = 10.0;

    return cv::gapi::goodFeaturesToTrack(grayscalImage,
                                         maxCorners,
                                         qualityLevel,
                                         minDistance);
  }

  cv::gapi::video::GOptFlowLKOutput CalcOpticalFlow(const cv::GMat& prevImg,
                                                    const cv::GMat& nextImg,
                                                    const cv::GArray<cv::Point2f>& prevPts,
                                                    const cv::GArray<cv::Point2f>& predPts)
  {
    // Window size of optical flow algorithm. Must be no less than winSize
    // argument of calcOpticalFlowPyrLK().
    //
    // It is needed to calculate required padding for pyramic levels.
    //
    // TODO: Do you pass in the same winSize value when you eventually call
    // calcOpticalFlowPyrLK?
    //const cv::Size winSize = cv::Size(11, 11);
    const cv::Size winSize = cv::Size(21, 21);

    // 0-based maximal pyramid level number.
    //
    // According to Bouguet, 2001, practical values the height of the pyramid
    // (picked heuristically) are 2, 3, 4.
    //
    // If set to 0, pyramids are not used (single level). If set to 1, two
    // levels are used, and so on.
    //
    // The LK algorithm will use as many levels as pyramids, but no more than
    // maxLevel.
    const cv::GScalar& maxLevel = 3;

    // Parameter specifying the termination criteria of the iterative search
    // algorithm.
    //
    // The algorithm terminates after the specified maximum number of
    // iterations or when the search window moves by less than the epsilon.
    const cv::TermCriteria criteria = cv::TermCriteria(
      // The maximum number of iterations or elements to compute
      cv::TermCriteria::COUNT |
      // The desired accuracy or change in parameters at which the iterative
      // algorithm stops
      cv::TermCriteria::EPS,
      // Max number
      30,
      // Epsilon
      0.01
    );

    return cv::gapi::calcOpticalFlowPyrLK(prevImg,
                                          nextImg,
                                          prevPts,
                                          predPts,
                                          winSize,
                                          maxLevel,
                                          criteria);
  }

  // The essential matrix is calculated from the corresponding points in the two
  // images
  cv::GMat FindEssentialMat(const cv::GArray<cv::Point2f>& points1,
                            const cv::GArray<cv::Point2f>& points2,
                            const cv::GArray<cv::Point2f>& mask)
  {
    // Points
    /*
    const unsigned int point_count = 100;
    std::vector<cv::Point2f> points1(point_count);
    std::vector<cv::Point2f> points2(point_count);
    */

    // Focal length of the camera
    const double focalLength = 1082.77717353143; // TODO

    // Principle point of the camera
    // TODO
    unsigned int m_width = 0;
    unsigned int m_height = 0;
    cv::Point2d principlePoint(m_width, m_height);

    // Use RANSAC for computing the fundamental matrix to allow for noisy outliers
    const int method = cv::RANSAC;

    // Desirable level of confidence (probability) that the estimated matrix is
    // correct
    const double prob = 0.999;

    // Maximum distance from a point to an epipolar line in pixels, beyond which
    // the point is considered an outlier and is not used for computing the final
    // fundamental matrix
    //
    // It can be set to something like 1-3, depending on the accuracy of the point
    // localization, image resolution, and the image noise.
    const double threshold = 1.0;

    /* TODO
    return cv::findEssentialMat(points1,
                                points2,
                                focalLength,
                                principlePoint,
                                method,
                                prob,
                                threshold,
                                mask);
    */
    return cv::GMat{};
  }

  cv::GScalar RecoverPose(const cv::GMat& E,
                          const cv::GArray<cv::Point2f>& points1,
                          const cv::GArray<cv::Point2f>& points2,
                          const cv::GArray<cv::Point2f>& mask)
  {
    // Output rotation matrix. Together with the translation vector, this matrix
    // makes up a tuple that performs a change of basis from the first camera's
    // coordinate system to the second camera's coordinate system.
    cv::GMat R;

    // Output translation vector. This vector is only known up to scale, i.e. t
    // is the direction of the translation vector and has unit length.
    cv::GMat t;

    /* TODO
    const int inlierCount = cv::recoverPose(E,
                                            points1,
                                            points2,
                                            R,
                                            t,
                                            focalLength,
                                            principlePoint,
                                            mask);
    */
    return cv::GScalar{};
  }
}

FrameInfo MotionTracker::AddVideoFrame(const emscripten::val& frameArray)
{
  const unsigned int dataSize = EmscriptenUtils::ArrayLength(frameArray);

  EmscriptenUtils::GetArrayData(frameArray, m_currentFrame.data, dataSize);

  // Check for scene change
  float currentMafd = 0.0f;
  float sceneScore = 0.0f;

  // Calculate frame parameters
  if (!m_previousFrame.empty())
  {
    currentMafd = ImageUtils::CalcMAFD(m_previousFrame.data, m_currentFrame.data, m_width, m_height);
    sceneScore = ImageUtils::CalcSceneScore(m_previousMafd, currentMafd);
  }

  /*
  // Build graph
  cv::GMat in;

  // Convert to grayscale
  cv::GMat grayscaleImage = cv::gapi::BGRA2Gray(in);

  // Calculate scene score
  //cv::GScalar sceneScore = cv::gapi::sceneScore()

  cv::GArray<cv::Point2f> features = GoodFeaturesToTrack(grayscaleImage);



  // TODO
  cv::GMat prevImg;
  cv::GMat nextImg;
  cv::GArray<cv::Point2f> prevPts;
  cv::GArray<cv::Point2f> predPts;

  cv::gapi::video::GOptFlowLKOutput opticalFlow = CalcOpticalFlow(prevImg,
                                                                  nextImg,
                                                                  prevPts,
                                                                  predPts);

  // Output array of N elements, every element of which is set to 0 for outliers
  // and to 1 for the other points
  cv::GArray<cv::Point2f> mask;

  // The essential matrix is calculated from the corresponding points in the two
  // images
  cv::GMat E = FindEssentialMat(features, features, mask);

  cv::GScalar inlierCount = RecoverPose(E,
                                        prevPts,
                                        predPts,
                                        mask);

  cv::Mat foregroundFrame;

  // G-API code
  cv::GMat out = opencv_test::GBackSub::on(grayscaleImage);

  cv::GComputation c(cv::GIn(in), cv::GOut(out));

  const auto pkg = cv::gapi::kernels<opencv_test::GOCVBackSub>();

  /*
  auto gapiBackSub = c.compile(cv::descr_of(m_currentFrame),
                               cv::compile_args(pkg, opencv_test::BackSubStateParams { "knn" }));
  gapiBackSub(cv::gin(m_currentFrame), cv::gout(foregroundFrame));
  */

  // Create result
  FrameInfo frameInfo{};
  frameInfo.sceneScore = sceneScore;
  if (!m_points.empty())
  {
    frameInfo.pointData = reinterpret_cast<uintptr_t>(m_points.data());
    frameInfo.pointSize = m_points.size();
  }
  if (!m_rotationMatrix.empty())
  {
    frameInfo.rotationMatrixData = reinterpret_cast<uintptr_t>(m_rotationMatrix.data());
    frameInfo.rotationMatrixSize = m_rotationMatrix.size();
  }
  if (!m_translationVector.empty())
  {
    frameInfo.translationVectorData = reinterpret_cast<uintptr_t>(m_translationVector.data());
    frameInfo.translationVectorSize = m_translationVector.size();
  }

  // Update state
  std::swap(m_currentFrame, m_previousFrame);
  m_previousMafd = currentMafd;

  return frameInfo;
}
