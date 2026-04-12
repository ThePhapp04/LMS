const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');
const { protect: auth } = require('../middleware/authMiddleware');

// Notes
router.get('/notes/:lessonId', auth, interactionController.getNotes);
router.post('/notes/:lessonId', auth, interactionController.saveNote);

// Comments
router.get('/comments/:lessonId', auth, interactionController.getComments);
router.post('/comments/:lessonId', auth, interactionController.addComment);

// Forums
router.get('/forums', interactionController.getForums);
router.get('/forums/:id', interactionController.getForumById);
router.post('/forums', auth, interactionController.createForum);
router.post('/forums/:id/reply', auth, interactionController.replyForum);

module.exports = router;
