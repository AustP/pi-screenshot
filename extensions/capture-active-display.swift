#!/usr/bin/env swift

import AppKit
import CoreGraphics
import Foundation
import ScreenCaptureKit

enum CaptureError: Error, LocalizedError {
  case missingOutputPath
  case unableToReadMouseLocation
  case noDisplayContainsPointer
  case unableToEncodePNG

  var errorDescription: String? {
    switch self {
    case .missingOutputPath:
      return "Missing output path argument"
    case .unableToReadMouseLocation:
      return "Unable to read mouse pointer location"
    case .noDisplayContainsPointer:
      return "No shareable display contains the current mouse pointer"
    case .unableToEncodePNG:
      return "Unable to encode screenshot as PNG"
    }
  }
}

func writePNG(cgImage: CGImage, to outputPath: String) throws {
  let bitmap = NSBitmapImageRep(cgImage: cgImage)
  guard let pngData = bitmap.representation(using: .png, properties: [:]) else {
    throw CaptureError.unableToEncodePNG
  }

  let outputURL = URL(fileURLWithPath: outputPath)
  try FileManager.default.createDirectory(
    at: outputURL.deletingLastPathComponent(),
    withIntermediateDirectories: true
  )
  try pngData.write(to: outputURL, options: .atomic)
}

func displayContainingPointer(pointerLocation: CGPoint) async throws -> SCDisplay {
  let shareableContent = try await SCShareableContent.excludingDesktopWindows(false, onScreenWindowsOnly: true)

  guard let display = shareableContent.displays.first(where: { $0.frame.contains(pointerLocation) }) else {
    throw CaptureError.noDisplayContainsPointer
  }

  return display
}

func captureDisplay(_ display: SCDisplay) async throws -> CGImage {
  let contentFilter = SCContentFilter(display: display, excludingWindows: [])
  let configuration = SCStreamConfiguration()
  configuration.width = display.width
  configuration.height = display.height
  configuration.showsCursor = false

  return try await SCScreenshotManager.captureImage(contentFilter: contentFilter, configuration: configuration)
}

func run() async throws {
  guard CommandLine.arguments.count > 1 else {
    throw CaptureError.missingOutputPath
  }

  let outputPath = CommandLine.arguments[1]

  guard let pointerLocation = CGEvent(source: nil)?.location else {
    throw CaptureError.unableToReadMouseLocation
  }

  let display = try await displayContainingPointer(pointerLocation: pointerLocation)
  let image = try await captureDisplay(display)

  try writePNG(cgImage: image, to: outputPath)
}

do {
  try await run()
} catch {
  let message = (error as? LocalizedError)?.errorDescription ?? String(describing: error)
  FileHandle.standardError.write(Data((message + "\n").utf8))
  exit(1)
}
