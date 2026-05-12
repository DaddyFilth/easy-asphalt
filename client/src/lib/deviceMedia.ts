import { Camera as DeviceCamera } from "@capacitor/camera";
import {
  CameraDirection,
  EncodingType,
  MediaTypeSelection,
  type CameraPermissionState,
  type MediaResult,
} from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

export type DevicePermissionResult = "granted" | "denied";

const PHOTO_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isNativeMobileApp() {
  return Capacitor.isNativePlatform();
}

export function isAllowedPermissionState(
  state: CameraPermissionState | "prompt" | "prompt-with-rationale"
) {
  return state === "granted" || state === "limited";
}

export function normalizeMediaMimeType(
  blobType?: string,
  metadataFormat?: string
) {
  const normalizedBlobType = blobType?.toLowerCase();
  if (normalizedBlobType && PHOTO_MIME_TYPES.has(normalizedBlobType)) {
    return normalizedBlobType;
  }
  if (normalizedBlobType?.startsWith("image/")) {
    return normalizedBlobType;
  }

  const format = metadataFormat?.toLowerCase().replace(/^\./, "");
  if (format === "jpg" || format === "jpeg") return "image/jpeg";
  if (format === "png") return "image/png";
  if (format === "webp") return "image/webp";
  if (format === "heic") return "image/heic";
  if (format === "heif") return "image/heif";

  return "image/jpeg";
}

export function extensionForMimeType(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

function base64ToBlob(base64: string, mimeType: string) {
  const payload = base64.includes(",") ? base64.split(",")[1] : base64;
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

async function mediaResultToFile(
  media: MediaResult,
  source: "camera" | "gallery"
) {
  const mediaUrl =
    media.webPath ?? (media.uri ? Capacitor.convertFileSrc(media.uri) : "");
  const fallbackMimeType = normalizeMediaMimeType(
    undefined,
    media.metadata?.format
  );

  const blob = mediaUrl
    ? await fetch(mediaUrl).then(response => {
        if (!response.ok) {
          throw new Error("Unable to read selected image");
        }
        return response.blob();
      })
    : media.thumbnail
      ? base64ToBlob(media.thumbnail, fallbackMimeType)
      : null;

  if (!blob) {
    throw new Error("No image was returned by the device");
  }

  const mimeType = normalizeMediaMimeType(blob.type, media.metadata?.format);
  const extension = extensionForMimeType(mimeType);

  return new File([blob], `driveway-${source}-${Date.now()}.${extension}`, {
    type: mimeType,
    lastModified: Date.now(),
  });
}

export async function requestNativeCameraPermission(): Promise<DevicePermissionResult> {
  if (!isNativeMobileApp()) {
    if (!navigator.mediaDevices?.getUserMedia) return "denied";

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      stream.getTracks().forEach(track => track.stop());
      return "granted";
    } catch {
      return "denied";
    }
  }

  try {
    const status = await DeviceCamera.requestPermissions({
      permissions: ["camera"],
    });
    return isAllowedPermissionState(status.camera) ? "granted" : "denied";
  } catch {
    return "denied";
  }
}

export async function requestNativePhotoPermission(): Promise<DevicePermissionResult> {
  if (!isNativeMobileApp()) return "granted";

  try {
    const status = await DeviceCamera.requestPermissions({
      permissions: ["photos"],
    });
    return isAllowedPermissionState(status.photos) ? "granted" : "denied";
  } catch {
    return "denied";
  }
}

export async function requestDeviceLocationPermission(): Promise<DevicePermissionResult> {
  if (isNativeMobileApp()) {
    try {
      const status = await Geolocation.requestPermissions({
        permissions: ["location"],
      });
      return status.location === "granted" ? "granted" : "denied";
    } catch {
      return "denied";
    }
  }

  if (!navigator.geolocation) return "denied";

  return new Promise<DevicePermissionResult>(resolve => {
    navigator.geolocation.getCurrentPosition(
      () => resolve("granted"),
      () => resolve("denied"),
      {
        enableHighAccuracy: true,
        maximumAge: 5 * 60 * 1000,
        timeout: 10_000,
      }
    );
  });
}

export async function takeDrivewayPhotoWithCamera() {
  if (!isNativeMobileApp()) return null;

  const permission = await requestNativeCameraPermission();
  if (permission !== "granted") {
    throw new Error("Camera permission is required to take a driveway photo");
  }

  const media = await DeviceCamera.takePhoto({
    quality: 90,
    targetWidth: 1920,
    targetHeight: 1920,
    correctOrientation: true,
    encodingType: EncodingType.JPEG,
    saveToGallery: false,
    cameraDirection: CameraDirection.Rear,
    includeMetadata: true,
  });

  return mediaResultToFile(media, "camera");
}

export async function chooseDrivewayPhotoFromGallery() {
  if (!isNativeMobileApp()) return null;

  const permission = await requestNativePhotoPermission();
  if (permission !== "granted") {
    throw new Error("Photo library permission is required to upload an image");
  }

  const media = await DeviceCamera.chooseFromGallery({
    mediaType: MediaTypeSelection.Photo,
    allowMultipleSelection: false,
    quality: 90,
    targetWidth: 1920,
    targetHeight: 1920,
    correctOrientation: true,
    includeMetadata: true,
  });
  const photo = media.results[0];

  if (!photo) return null;
  return mediaResultToFile(photo, "gallery");
}

export function isMediaSelectionCanceled(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /cancel|cancelled|canceled|dismissed/i.test(message);
}
