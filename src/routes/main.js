import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import homeController from '../controllers/homeController.js';
import authController from '../controllers/authController.js';
import postController from '../controllers/postController.js';
import reactionController from '../controllers/reactionController.js';

const uploadDir = 'public/uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

const router = express.Router();

router.get('/', homeController.index);

router.post('/api/auth/signup', upload.single('profileImage'), authController.signup);
router.post('/api/auth/signin', authController.signin);
router.post('/api/auth/signout', authController.signout);
router.post('/api/auth/update', upload.single('profileImage'), authController.updateProfile);

router.post('/api/posts/create', upload.single('image'), postController.create);

router.post('/api/reactions/types', upload.single('image'), reactionController.createType);
router.get('/api/reactions/types', reactionController.getTypes);

export default router;
