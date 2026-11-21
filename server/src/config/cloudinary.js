import { v2 as cloudinary } from 'cloudinary';

/**
 * Initializes the Cloudinary SDK using the CLOUDINARY_URL environment variable.
 *
 * The URL format is:
 *   cloudinary://API_KEY:API_SECRET@CLOUD_NAME
 *
 * This single variable replaces the deprecated three-variable approach
 * (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).
 *
 * NEVER expose CLOUDINARY_URL to the frontend. It must remain server-side only.
 */
const initCloudinary = () => {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  if (!cloudinaryUrl) {
    console.warn(
      '⚠️  CLOUDINARY_URL is not set. Media uploads will be unavailable.\n' +
      '   Add CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name> to server/.env'
    );
    return false;
  }

  // The Cloudinary SDK automatically reads CLOUDINARY_URL from process.env,
  // but calling config() here makes the dependency explicit and testable.
  cloudinary.config({
    cloudinary_url: cloudinaryUrl,
    secure: true,
  });

  const { cloud_name } = cloudinary.config();
  console.log(`☁️  Cloudinary connected: cloud "${cloud_name}" (secure: true)`);
  return true;
};

export { cloudinary, initCloudinary };
