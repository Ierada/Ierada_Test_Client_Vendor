import { fileToBase64 } from "./fileToBase64";

const MAX_EDGE = 1024;
const JPEG_QUALITY = 0.72;
const MAX_B64_CHARS = 900000;

/**
 * Shrink a listing photo before category-vision API.
 * Raw 20MB phone photos as base64 exceed the server JSON body limit.
 */
export async function fileToSuggestPayload(file) {
  const fromFile = async (source, mimeType) => {
    const image_base64 = await fileToBase64(source);
    if ((image_base64 || "").length > MAX_B64_CHARS) {
      throw new Error(
        "Photo is too large to analyze. Use a JPG or PNG front photo.",
      );
    }
    return { image_base64, mime_type: mimeType };
  };

  try {
    if (typeof createImageBitmap !== "function") {
      return fromFile(file, file.type || "image/jpeg");
    }
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return fromFile(file, file.type || "image/jpeg");
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) return fromFile(file, file.type || "image/jpeg");
    const compact = new File([blob], "category-suggest.jpg", {
      type: "image/jpeg",
    });
    return fromFile(compact, "image/jpeg");
  } catch (err) {
    if (err?.message?.includes("too large to analyze")) throw err;
    return fromFile(file, file.type || "image/jpeg");
  }
}
