const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { protect: auth, authorize } = require('../middleware/authMiddleware');

// Get all assignments for a course
router.get('/course/:courseId', auth, assignmentController.getAssignments);

// Create an assignment
router.post('/course/:courseId', auth, authorize('lecturer', 'admin'), assignmentController.createAssignment);

// Get grades for a course (Gradebook)
router.get('/course/:courseId/grades', auth, authorize('lecturer', 'admin'), assignmentController.getCourseGrades);

// Get, Submit, and Delete a specific assignment
router.route('/:id')
  .get(auth, assignmentController.getAssignmentById)
  .post(auth, assignmentController.submitAssignment)
  .delete(auth, authorize('lecturer', 'admin'), assignmentController.deleteAssignment);

// Add Question to a Quiz assignment
router.post('/:id/questions', auth, authorize('lecturer', 'admin'), assignmentController.addQuestion);

// Get all submissions for an assignment
router.get('/:id/submissions', auth, authorize('lecturer', 'admin'), assignmentController.getSubmissions);

// Grade a specific submission
router.put('/submissions/:subId', auth, authorize('lecturer', 'admin'), assignmentController.gradeSubmission);

module.exports = router;
