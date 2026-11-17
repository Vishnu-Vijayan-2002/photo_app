import Foundation
import Photos

@objc(IosStorageModule)
class IosStorageModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc(saveToCameraRoll:resolver:rejecter:)
  func saveToCameraRoll(filePath: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let cleanPath = filePath.replacingOccurrences(of: "file://", with: "")
    let url = URL(fileURLWithPath: cleanPath)

    PHPhotoLibrary.requestAuthorization { status in
      guard status == .authorized || status == .limited else {
        reject("PERMISSION_DENIED", "Access to photo library denied", nil)
        return
      }

      PHPhotoLibrary.shared().performChanges({
        PHAssetChangeRequest.creationRequestForAssetFromImage(atFileURL: url)
      }) { success, error in
        if success {
          resolve(true)
        } else {
          reject("SAVE_FAILED", error?.localizedDescription ?? "Failed to save photo", error)
        }
      }
    }
  }
}

