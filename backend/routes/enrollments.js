const express = require('express');
const router = express.Router();
const { enroll, getMyEnrollments } = require('../controllers/enrollmentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, enroll);
router.get('/my', protect, getMyEnrollments);

module.exports = router;
