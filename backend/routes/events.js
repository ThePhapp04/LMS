const express = require('express');
const router = express.Router();
const { getEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getEvents)
  .post(protect, authorize('lecturer', 'admin'), createEvent);

router.route('/:id')
  .put(protect, authorize('lecturer', 'admin'), updateEvent)
  .delete(protect, authorize('lecturer', 'admin'), deleteEvent);

module.exports = router;
