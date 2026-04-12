const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getCourses, getCourseById, createCourse, updateCourse, deleteCourse } = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination(req, file, cb) { cb(null, 'uploads/'); },
  filename(req, file, cb) {
    cb(null, `thumb-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.route('/')
  .get(protect, getCourses)
  .post(protect, authorize('lecturer', 'admin'), upload.single('thumbnail'), createCourse);

router.route('/:id')
  .get(protect, getCourseById)
  .put(protect, authorize('lecturer', 'admin'), upload.single('thumbnail'), updateCourse)
  .delete(protect, authorize('lecturer', 'admin'), deleteCourse);

module.exports = router;
