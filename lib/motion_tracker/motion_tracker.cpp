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
#include <opencv2/core.hpp>
#include <opencv2/core/mat.hpp>
#include <opencv2/gapi.hpp>
#include <opencv2/gapi/core.hpp>
#include <opencv2/gapi/cpu/gcpukernel.hpp>
#include <opencv2/gapi/imgproc.hpp>
#include <opencv2/gapi/video.hpp>
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
        static cv::GOpaqueDesc outMeta(cv::GMatDesc /* in */) { return cv::empty_gopaque_desc(); }
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
                                .value_or(BackSubStateParams { });

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

FrameInfo MotionTracker::AddVideoFrame(const emscripten::val& frameArray)
{
  const unsigned int dataSize = EmscriptenUtils::ArrayLength(frameArray);

  EmscriptenUtils::GetArrayData(frameArray, m_currentFrame.data, dataSize);

  // Build graph
  cv::GMat in;

  // Convert to grayscale
  cv::GMat gray = cv::gapi::BGRA2Gray(in);

  // TODO
  //cv::GScalar sceneScore = cv::gapi::sceneScore()

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

  cv::GArray<cv::Point2f> features = cv::gapi::goodFeaturesToTrack(gray,
                                                                   maxCorners,
                                                                   qualityLevel,
                                                                   minDistance);

  using OpticalFlowOutput = cv::gapi::video::GOptFlowLKOutput;




  // TODO
  cv::GMat prevImg;
  cv::GMat nextImg;
  cv::GArray<cv::Point2f> prevPts;
  cv::GArray<cv::Point2f> predPts;

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

  OpticalFlowOutput opticalFlow = cv::gapi::calcOpticalFlowPyrLK(prevImg,
                                                                 nextImg,
                                                                 prevPts,
                                                                 predPts,
                                                                 winSize,
                                                                 maxLevel,
                                                                 criteria);

  cv::Mat foregroundFrame;

  // G-API code
  cv::GMat out = opencv_test::GBackSub::on(gray);

  cv::GComputation c(cv::GIn(in), cv::GOut(out));

  const auto pkg = cv::gapi::kernels<opencv_test::GOCVBackSub>();

  auto gapiBackSub = c.compile(cv::descr_of(m_currentFrame),
                               cv::compile_args(pkg, opencv_test::BackSubStateParams { "knn" }));

  gapiBackSub(cv::gin(m_currentFrame), cv::gout(foregroundFrame));

  // Frame parameters
  float currentMafd = 0.0f;
  float sceneScore = 0.0f;

  // Calculate frame parameters
  if (!m_previousFrame.empty())
  {
    currentMafd = ImageUtils::CalcMAFD(m_previousFrame.data, m_currentFrame.data, m_width, m_height);
    sceneScore = ImageUtils::CalcSceneScore(m_previousMafd, currentMafd);
  }

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
