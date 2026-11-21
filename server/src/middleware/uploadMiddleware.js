import multer from 'multer';

/** Multer configured to store files in memory (buffer) only — never on disk.
 *  The buffer is then streamed directly to Cloudinary via upload_stream.
 *  Max file size: 8 MB.  Allowed types: JPEG, PNG, WebP, GIF.
 */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type "${file.mimetype}". Allowed types: JPEG, PNG, WebP, GIF.`
      ),
      false
    );
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
});
