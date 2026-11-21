import { cloudinary } from '../config/cloudinary.js';

/**
 * @desc    Upload a single image to Cloudinary
 * @route   POST /api/upload/image
 * @access  Private (authenticated users only)
 *
 * Accepts:  multipart/form-data with field name "image"
 * Returns:  { success: true, url: "<secure Cloudinary URL>", publicId: "..." }
 *
 * The Cloudinary URL is HTTPS and safe to store in the database as-is.
 * Cloudinary credentials never leave the server.
 */
export const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file provided. Send a multipart/form-data request with field name "image".',
    });
  }

  try {
    // Stream the in-memory buffer to Cloudinary — no temp files on disk
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'campus-chronicles',
          resource_type: 'image',
          // Auto-select best format and quality
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    return res.status(200).json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    return res.status(500).json({
      success: false,
      message: 'Image upload failed. Please try again.',
    });
  }
};
