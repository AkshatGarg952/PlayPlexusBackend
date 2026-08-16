import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import config from '../config/env.js';

const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

if (config.hasCloudinary) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
} else {
  console.warn('[uploads] Cloudinary is not configured — images will be discarded, everything else still works.');
}

const uploaderFor = (folder) =>
  multer({
    // Without Cloudinary credentials the file is discarded, but multer still has
    // to run: it is what parses the multipart text fields into req.body.
    storage: config.hasCloudinary
      ? new CloudinaryStorage({ cloudinary, params: { folder, allowed_formats: ALLOWED_FORMATS } })
      : multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
  });

/**
 * Wraps a multer single-file middleware so upload failures become clean 400s.
 * Uploads are always optional: a registration or profile update without an
 * image must still go through.
 */
const optionalUpload = (upload, field) => (req, res, next) => {
  upload.single(field)(req, res, (error) => {
    if (!error) return next();

    const tooLarge = error.code === 'LIMIT_FILE_SIZE';
    console.error('[uploads] failed:', error.message);
    return res.status(400).json({
      message: tooLarge
        ? 'Image is too large. Maximum size is 5 MB.'
        : `Image upload failed: ${error.message}`,
    });
  });
};

export const uploadProfileImage = optionalUpload(uploaderFor('profile-images'), 'profileImage');
export const uploadTeamLogo = optionalUpload(uploaderFor('team-logo'), 'logo');
