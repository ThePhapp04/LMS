const express = require('express');
const router = express.Router();
const chapterController = require('../controllers/chapterController');
const { protect: auth } = require('../middleware/authMiddleware');

router.post('/', auth, chapterController.createChapter);
router.put('/:id', auth, chapterController.updateChapter);
router.delete('/:id', auth, chapterController.deleteChapter);

module.exports = router;
