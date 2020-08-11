/*
 * Copyright (C) 2020 Marquise Stein
 * This file is part of 8bitbot - https://github.com/botocracy/8bitbot
 *
 * SPDX-License-Identifier: Apache-2.0
 * See LICENSE.txt for more information.
 */

#include "motion_tracker.hpp"
#include "vision_graph.hpp"

#include "utils/emscripten_utils.hpp"
#include "utils/math_utils.hpp"

#include <algorithm>
#include <emscripten/val.h>
#include <iostream>
#include <opencv2/video/tracking.hpp>

// TODO
#include <opencv2/sfm/reconstruct.hpp>
#include <iostream>

// Scene score from libav's "select" filter. You may have seen filters that
// look like:
//
//   select='gt(scene,0.4)'
//
// Typical values suggested online are 0.3 and 0.4, but this can miss scene
// changes in dark videos.
//
// In testing drone footage, scene changes can dip below 0.2. False positives
// typically occur below 0.15
//
// We care more about false negatives than false positives, so let's go with
// 0.15.
constexpr double SCENE_THREASHOLD = 0.15;

// Minimum number of points to force redetection
constexpr unsigned int MIN_POINT_COUNT = 5;

bool MotionTracker::Initialize(int width, int height)
{
  if (width <= 0 || height <= 0)
    return false;

  // Initialize video parameters
  m_width = width;
  m_height = height;

  // Initialize buffers
  m_rgbaFrameBuffer.create(m_height, m_width, CV_8UC4);
  m_currentGrayscaleBuffer.create(m_height, m_width, CV_8UC1);
  m_previousGrayscale.create(m_height, m_width, CV_8UC1);

  // Focal length of the camera
  const double f = 1082.77717353143; // TODO

  // Principle point of the camera
  cv::Point2d pp(static_cast<double>(m_width),
                 static_cast<double>(m_height)); // TODO

  // Initialize camera calibration matrix with sensible values
  m_cameraMatrix = cv::Matx33d( f, 0, pp.x,
                                0, f, pp.y,
                                0, 0,  1.0 );

  m_visionGraph.reset(new VisionGraph);
  m_visionGraph->Compile(width,
                         height,
                         m_rgbaFrameBuffer,
                         m_currentGrayscaleBuffer,
                         m_previousGrayscale);

  m_framePool.reset(new FramePool);

  return true;
}

void MotionTracker::SetConfig(const ConfigOptions& config)
{
  m_config = config;
}

FrameInfo MotionTracker::AddVideoFrame(const emscripten::val& frameArray)
{
  // Dereference buffers
  cv::Mat& rgbaFrame = m_rgbaFrameBuffer;
  cv::Mat& currentGrayscale = m_currentGrayscaleBuffer;

  // Get a frame to gather our results
  FramePtr currentFrame = m_framePool->GetFrame();

  // Fetch array from JavaScript
  // TODO: Elide copy
  ReadArray(frameArray, rgbaFrame.data);

  // Convert to grayscale
  ConvertToGrayscale(rgbaFrame, currentGrayscale);

  // TODO: Check for full black image

  // Get the scene score by comparing the last two frames
  GetScreenScoreSAD(currentGrayscale, currentFrame->mafd, currentFrame->sceneScore);

  // Reset frame history when a scene change is detected
  if (currentFrame->sceneScore >= SCENE_THREASHOLD)
  {
    std::cout << "Scene change detected (score: " << currentFrame->sceneScore << ")"
        << std::endl;
    m_frameHistory.clear();
  }

  // TODO
  if (m_frameHistory.size() > m_config.maxFrameCount)
  {
    m_frameHistory.clear();
  }

  if (m_frameHistory.empty())
  {
    FindFeatures(currentGrayscale, currentFrame->points, currentFrame->status, currentFrame->errors);
  }
  else
  {
    // Calculate optical flow if we have a previous frame
    CalculateOpticalFlow(currentGrayscale, currentFrame->points, currentFrame->status, currentFrame->errors);

    // If feature count drops by 10% or more, consider it a scene change
    const unsigned int missing = std::count(currentFrame->status.begin(),
                                            currentFrame->status.end(),
                                            0);

    // TODO: Better scene detection

    if (10 * missing > currentFrame->status.size())
    {
      std::cout << "Scene change detected (missing points: " << missing << ")"
          << std::endl;
      m_frameHistory.clear();
    }

    if (currentFrame->points.size() <= MIN_POINT_COUNT)
    {
      std::cout << "Scene change detected (points count: " << currentFrame->points.size()
          << ")" << std::endl;
      m_frameHistory.clear();
    }

    if (m_frameHistory.empty())
      FindFeatures(currentGrayscale, currentFrame->points, currentFrame->status, currentFrame->errors);
  }

  if (!currentFrame->points.empty())
    AddFrameToHistory(std::move(currentFrame));

  // Reconstruct trajectory
  GetProjectionMatrix(currentFrame->projectionMatrix);

  // Update state
  std::swap(currentGrayscale, m_previousGrayscale);

  // Create result
  FrameInfo frameInfo = GetResult();

  return frameInfo;
}

void MotionTracker::ReadArray(const emscripten::val& frameArray, uint8_t* data)
{
  // Get array size
  const unsigned int dataSize = EmscriptenUtils::ArrayLength(frameArray);

  // Copy data
  EmscriptenUtils::GetArrayData(frameArray, data, dataSize);
}

void MotionTracker::ConvertToGrayscale(const cv::Mat& in, cv::Mat& out)
{
  m_visionGraph->ApplyGrayscale(in, out);
}

void MotionTracker::GetScreenScoreSAD(const cv::Mat& currentGrayscale, double& currentMafd, double& sceneScore)
{
  if (!m_frameHistory.empty())
  {
    // TODO: Zero-copy
    m_pointHistoryBuffer.clear();
    for (const auto& frame : m_frameHistory)
      m_pointHistoryBuffer.emplace_back(frame->points);

    const FramePtr& previousFrame = m_frameHistory.back();

    double previousMafd = previousFrame->mafd;

    // Calculate scene score
    m_visionGraph->CalcSceneScore(m_previousGrayscale, currentGrayscale, previousMafd, currentMafd, sceneScore);
  }
  else
  {
    currentMafd = 0.0;
    sceneScore = 0.0;
  }
}

void MotionTracker::FindFeatures(const cv::Mat& currentGrayscale,
                                 std::vector<cv::Point2f>& currentPoints,
                                 std::vector<uint8_t>& status,
                                 std::vector<float>& errors)
{
  // TODO
  const double minDistance = std::max(
      MathUtils::GeometricMean(m_width, m_height) / (static_cast<double>(m_config.maxPointCount) / 2.0),
      2.0
  );

  m_visionGraph->FindFeatures(currentGrayscale, m_config.maxPointCount, minDistance, currentPoints);
  status.assign(currentPoints.size(), 1U);
  errors.assign(currentPoints.size(), 0.0f);
}

void MotionTracker::CalculateOpticalFlow(const cv::Mat& currentGrayscale,
                                         std::vector<cv::Point2f>& currentPoints,
                                         std::vector<uint8_t>& status,
                                         std::vector<float>& errors)
{
  if (!m_frameHistory.empty())
  {
    const std::vector<cv::Point2f>& previousPoints = m_frameHistory.back()->points;
    if (!previousPoints.empty())
    {
      // TODO: Zero-copy
      m_pointHistoryBuffer.clear();
      for (const auto& frame : m_frameHistory)
        m_pointHistoryBuffer.emplace_back(frame->points);

      m_visionGraph->CalcOpticalFlow(m_previousGrayscale,
                                     currentGrayscale,
                                     previousPoints,
                                     m_pointHistoryBuffer,
                                     currentPoints,
                                     status,
                                     errors);
    }
  }
}

void MotionTracker::AddFrameToHistory(FramePtr&& frame)
{
  // Check for missing points (value of "status" is 0)
  std::vector<unsigned int> missing;
  for (unsigned int index = 0; index < frame->status.size(); index++)
  {
    if (frame->status[index] == 0)
      missing.push_back(index);
  }

  m_frameHistory.emplace_back(std::move(frame));

  if (!missing.empty())
  {
    // Prune missing points from history
    for (auto& frame : m_frameHistory)
    {
      if (frame->points.empty())
        continue;

      // This used to use lambdas, but they were causing function index
      // out-of-bound errors in the browser
      for (auto it = missing.end(); it != missing.begin(); --it)
      {
        const unsigned int index = *(it - 1);

        frame->points.erase(frame->points.begin() + index);
        frame->status.erase(frame->status.begin() + index);
        frame->errors.erase(frame->errors.begin() + index);
       }
    }
  }
}

void MotionTracker::GetProjectionMatrix(cv::Mat& projectionMatrix)
{
  std::cout << "GetProjectionMatrix() - " << m_frameHistory.size() << " frames"
      << std::endl;

  // TODO: Zero-copy
  std::vector<cv::Mat> points2d;
  points2d.reserve(m_frameHistory.size());

  // Embed data in reconstruction api format
  for (int i = 0; i < m_frameHistory.size(); ++i)
  {
    const std::vector<cv::Point2f>& tracks = m_frameHistory[0]->points;
    const unsigned int trackCount = tracks.size();

    cv::Mat_<double> frame(2, trackCount);

    for (int j = 0; j < trackCount; ++j)
    {
      frame(0, j) = static_cast<double>(tracks[j].x);
      frame(1, j) = static_cast<double>(tracks[j].y);
    }

    points2d.emplace_back(cv::Mat(frame));
  }

  std::cout << "Points: " << points2d[0].cols << std::endl;

  // If true, the cameras is supposed to be projective
  constexpr bool isProjective = true;

  // Reconstruct the scene using the 2d correspondences
  std::vector<cv::Mat> projections;

  if (m_frameHistory.size() == 2)
  {
    // TODO: cv::sfm::reconstruct() expects cv::Mat instead of std::vector<cv::Mat>
    // for estimated 3D points output

    // Unused (we would have to project these back to 2D image space for them
    // to be useful)
    cv::Mat estimated3dPoints;

    // Perform reconstruction
    cv::sfm::reconstruct(points2d, projections, estimated3dPoints, m_cameraMatrix, isProjective);
  }
  else if (m_frameHistory.size() >= 3)
  {
    // Unused (we would have to project these back to 2D image space for them
    // to be useful)
    std::vector<cv::Mat> estimated3dPoints;

    // Perform reconstruction
    cv::sfm::reconstruct(points2d, projections, estimated3dPoints, m_cameraMatrix, isProjective);
  }

  std::cout << "Projections: " << projections.size() << std::endl;

  // We are interested in the most recent projection
  if (!projections.empty())
  {
    projectionMatrix = projections.back();

    /*
    std::cout << "projectionMatrix: " << projectionMatrix.t() << std::endl;

    const auto& initialProjectionMatrix = projections.front();

    std::cout << "initialProjectionMatrix: " << initialProjectionMatrix.t() << std::endl;
    */
  }
}

FrameInfo MotionTracker::GetResult() const
{
  FrameInfo frameInfo{};

  m_points.clear();
  m_initialPoints.clear();
  m_projectionMatrix.clear();

  if (!m_frameHistory.empty())
  {
    // Grab references to pertinent frames
    const FramePtr& currentFrame = m_frameHistory.back();
    const FramePtr& initialFrame = m_frameHistory.front();

    // Set the scene score
    frameInfo.sceneScore = currentFrame->sceneScore;

    // Set current points
    const std::vector<cv::Point2f>& currentPoints = currentFrame->points;
    if (!currentPoints.empty())
    {
      m_points.reserve(currentPoints.size() * 2);
      for (const cv::Point2f& point : currentPoints)
      {
        m_points.push_back(point.x);
        m_points.push_back(point.y);
      }
      frameInfo.pointData = reinterpret_cast<uintptr_t>(m_points.data());
      frameInfo.pointSize = m_points.size();
    }

    // Set initial points
    const std::vector<cv::Point2f>& initialPoints = initialFrame->points;
    if (!initialPoints.empty())
    {
      m_initialPoints.reserve(initialPoints.size() * 2);
      for (const cv::Point2f& point : initialPoints)
      {
        m_initialPoints.push_back(point.x);
        m_initialPoints.push_back(point.y);
      }
      frameInfo.initialPointData = reinterpret_cast<uintptr_t>(m_initialPoints.data());
      frameInfo.initialPointSize = m_initialPoints.size();
    }

    // Set projection matrix
    const cv::Mat& projectionMatrix = currentFrame->projectionMatrix;
    m_projectionMatrix.resize(projectionMatrix.rows * projectionMatrix.cols); // TODO
  }

  return frameInfo;
}
