const express = require('express');
const router = express.Router();
const { enroll, getMyEnrollments, getCourseStudents, getStudentProgress } = require('../controllers/enrollmentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, enroll);
router.get('/my', protect, getMyEnrollments);
router.get('/course/:courseId/students', protect, getCourseStudents);
router.get('/course/:courseId/student/:studentId', protect, getStudentProgress);

module.exports = router;
