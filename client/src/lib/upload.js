// Shared image validation for both upload routes: the client-supplied
// MIME type is never trusted on its own — the file's magic bytes decide.

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

// Returns the extension (e.g. '.jpg') when the buffer's magic bytes match
// the claimed MIME type, otherwise null.
export function extensionForImage(buffer, mime) {
  if (!ALLOWED_IMAGE_TYPES.includes(mime)) return null;
  if (mime === 'image/jpeg') {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return EXT_BY_MIME[mime];
    }
    return null;
  }
  if (mime === 'image/png') {
    if (
      buffer.length >= 4 &&
      buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
    ) {
      return EXT_BY_MIME[mime];
    }
    return null;
  }
  // WebP: RIFF....WEBP
  if (mime === 'image/webp') {
    if (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
      return EXT_BY_MIME[mime];
    }
    return null;
  }
  return null;
}
