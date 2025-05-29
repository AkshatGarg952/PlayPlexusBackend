import dotenv from 'dotenv';
dotenv.config();

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage1 = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'profile-images',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});


const storage2 = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'team-logo',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});


export const upload1 = multer({ storage: storage1 });
export const upload2 = multer({ storage: storage2 });