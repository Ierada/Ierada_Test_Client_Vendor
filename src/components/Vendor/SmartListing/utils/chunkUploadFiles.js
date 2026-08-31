/** Split files so each chunk stays under byte + count limits (Cloudflare ~100MB). */
export function chunkFilesForUpload(files, { maxBytes = 28 * 1024 * 1024, maxCount = 40 } = {}) {
  const chunks = [];
  let current = [];
  let size = 0;

  for (const file of files) {
    const wouldExceedBytes = current.length > 0 && size + file.size > maxBytes;
    const wouldExceedCount = current.length >= maxCount;
    if (wouldExceedBytes || wouldExceedCount) {
      chunks.push(current);
      current = [];
      size = 0;
    }
    current.push(file);
    size += file.size;
  }
  if (current.length) chunks.push(current);
  return chunks;
}
