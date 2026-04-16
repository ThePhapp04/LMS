const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createLesson, updateLesson, deleteLesson, markProgress, getProgressForCourse } = require('../controllers/lessonController');
const { protect, authorize } = require('../middleware/authMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB for video
  fileFilter(req, file, cb) {
    const allowed = [
      '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.xlsx', '.xls',
      '.mp4', '.webm', '.mov', '.avi', '.mkv', '.mp3', '.wav',
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error('File type not allowed'));
    cb(null, true);
  }
});

router.post('/', protect, authorize('lecturer', 'admin'), upload.single('file'), createLesson);
router.put('/:id', protect, authorize('lecturer', 'admin'), upload.single('file'), updateLesson);
router.delete('/:id', protect, authorize('lecturer', 'admin'), deleteLesson);
router.post('/progress', protect, markProgress);
router.get('/progress/:courseId', protect, getProgressForCourse);

module.exports = router;
