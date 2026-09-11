/**
 * Local 3D-style studio render of a listing photo when the AI image API is unavailable.
 */
export async function makeStudio3dFile(file) {
  const bitmap = await createImageBitmap(file);
  const size = 900;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#F4F6F8";
  ctx.fillRect(0, 0, size, size);

  const grd = ctx.createRadialGradient(size * 0.5, size * 0.42, 40, size * 0.5, size * 0.5, size * 0.55);
  grd.addColorStop(0, "#ffffff");
  grd.addColorStop(1, "#E8ECF1");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(size * 0.5, size * 0.48);
  ctx.transform(1, -0.08, 0.16, 0.9, 0, 0);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  ctx.drawImage(bitmap, sx, sy, side, side, -280, -280, 560, 560);
  ctx.restore();
  bitmap.close?.();

  ctx.save();
  ctx.translate(size * 0.5, size * 0.86);
  ctx.scale(1, 0.28);
  ctx.beginPath();
  ctx.ellipse(0, 0, 210, 210, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(15, 23, 42, 0.16)";
  ctx.fill();
  ctx.restore();

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9),
  );
  return new File([blob], "ai-3d-studio.jpg", { type: "image/jpeg" });
}

export function base64ToJpegFile(b64, name = "ai-3d.jpg") {
  const raw = String(b64 || "").replace(/^data:[^;]+;base64,/, "");
  const bin = atob(raw);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i);
  const isPng = raw.startsWith("iVBOR");
  return new File([arr], name, { type: isPng ? "image/png" : "image/jpeg" });
}
