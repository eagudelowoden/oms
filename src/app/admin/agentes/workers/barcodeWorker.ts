/// <reference lib="webworker" />

import {
  MultiFormatReader,
  BinaryBitmap,
  HybridBinarizer,
  RGBLuminanceSource,
  DecodeHintType,
  BarcodeFormat,
} from "@zxing/library";

const hints = new Map<DecodeHintType, unknown>();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.QR_CODE,
]);
hints.set(DecodeHintType.TRY_HARDER, true);

const reader = new MultiFormatReader();
reader.setHints(hints);

self.addEventListener("message", (e: MessageEvent) => {
  const { pixels, width, height } = e.data as {
    pixels: Uint8ClampedArray;
    width: number;
    height: number;
  };

  try {
    const luminance = new RGBLuminanceSource(pixels, width, height);
    const bitmap = new BinaryBitmap(new HybridBinarizer(luminance));
    const result = reader.decode(bitmap);
    (self as unknown as DedicatedWorkerGlobalScope).postMessage({ text: result.getText() });
  } catch (_) {
    (self as unknown as DedicatedWorkerGlobalScope).postMessage({ text: null });
  }
});
