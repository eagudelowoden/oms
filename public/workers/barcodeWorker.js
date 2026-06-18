import {
  MultiFormatReader,
  BinaryBitmap,
  HybridBinarizer,
  RGBLuminanceSource,
  DecodeHintType,
  BarcodeFormat,
} from "@zxing/library";

const hints = new Map();
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

self.addEventListener("message", (e) => {
  const { pixels, width, height } = e.data;

  try {
    const luminance = new RGBLuminanceSource(pixels, width, height);
    const bitmap = new BinaryBitmap(new HybridBinarizer(luminance));
    const result = reader.decode(bitmap);
    self.postMessage({ text: result.getText() });
  } catch (_) {
    self.postMessage({ text: null });
  }
});
