const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { register, login, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination(req, file, cb) { cb(null, 'uploads/'); },
  filename(req, file, cb) { cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`); }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/me', protect, upload.single('avatar'), updateProfile);

module.exports = router;
