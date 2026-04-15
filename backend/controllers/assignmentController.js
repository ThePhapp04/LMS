const db = require('../config/db');

// --- ASSIGNMENTS ---

exports.createAssignment = async (req, res) => {
  const { title, description, chapter_id, type, total_points, due_date } = req.body;
  const course_id = req.params.courseId;
  try {
    const [result] = await db.query(
      'INSERT INTO assignments (course_id, chapter_id, title, description, type, total_points, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [course_id, chapter_id, title, description, type, total_points || 100, due_date || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Assignment created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const [assignments] = await db.query('SELECT * FROM assignments WHERE course_id = ?', [req.params.courseId]);
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAssignmentById = async (req, res) => {
  try {
    const [assignments] = await db.query('SELECT * FROM assignments WHERE id = ?', [req.params.id]);
    if (assignments.length === 0) return res.status(404).json({ message: 'Assignment not found' });
    
    const assignment = assignments[0];
    if (assignment.type === 'quiz') {
      // Check if student already submitted — if so, include correct_option for review
      let includeAnswer = true;
      if (req.user.role === 'student') {
        const [subs] = await db.query(
          'SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ? LIMIT 1',
          [assignment.id, req.user.id]
        );
        includeAnswer = subs.length > 0;
      }
      const fields = includeAnswer
        ? 'id, question_text, options, correct_option, points'
        : 'id, question_text, options, points';
      const [questions] = await db.query(`SELECT ${fields} FROM assignment_questions WHERE assignment_id = ?`, [assignment.id]);
      assignment.questions = questions.map(q => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      }));
    }
    
    // Check if the current user has already submitted (for students)
    if (req.user.role === 'student') {
      const [submissions] = await db.query(
        'SELECT * FROM assignment_submissions WHERE assignment_id = ? AND student_id = ? ORDER BY score DESC, submitted_at DESC LIMIT 1',
        [assignment.id, req.user.id]
      );
      if (submissions.length > 0) {
        assignment.my_submission = submissions[0];
        if (typeof assignment.my_submission.answers === 'string') {
          assignment.my_submission.answers = JSON.parse(assignment.my_submission.answers);
        }
      }
    }
    
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    await db.query('DELETE FROM assignments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Assignment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- QUESTIONS ---

exports.addQuestion = async (req, res) => {
  const { question_text, options, correct_option, points } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO assignment_questions (assignment_id, question_text, options, correct_option, points) VALUES (?, ?, ?, ?, ?)',
      [req.params.id, question_text, JSON.stringify(options), correct_option, points || 10]
    );
    res.status(201).json({ id: result.insertId, message: 'Question added' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateQuestion = async (req, res) => {
  const { question_text, options, correct_option, points } = req.body;
  try {
    await db.query(
      'UPDATE assignment_questions SET question_text = ?, options = ?, correct_option = ?, points = ? WHERE id = ?',
      [question_text, JSON.stringify(options), correct_option, points || 10, req.params.questionId]
    );
    res.json({ message: 'Question updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.bulkSaveQuestions = async (req, res) => {
  const { questions } = req.body;
  const assignment_id = req.params.id;
  try {
    // Delete all existing questions for this assignment
    await db.query('DELETE FROM assignment_questions WHERE assignment_id = ?', [assignment_id]);
    
    // Insert all new questions
    for (const q of questions) {
      await db.query(
        'INSERT INTO assignment_questions (assignment_id, question_text, options, correct_option, points) VALUES (?, ?, ?, ?, ?)',
        [assignment_id, q.question_text, JSON.stringify(q.options), q.correct_option, q.points || 10]
      );
    }
    
    // Return the newly created questions
    const [saved] = await db.query('SELECT id, question_text, options, correct_option, points FROM assignment_questions WHERE assignment_id = ?', [assignment_id]);
    const result = saved.map(q => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    }));
    
    res.json({ message: `${questions.length} questions saved`, questions: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    // Check if user is authorized (instructor/admin who owns the course)
    const [question] = await db.query(`
      SELECT aq.*, a.course_id, c.lecturer_id 
      FROM assignment_questions aq
      JOIN assignments a ON aq.assignment_id = a.id
      JOIN courses c ON a.course_id = c.id
      WHERE aq.id = ?
    `, [req.params.questionId]);
    
    if (question.length === 0) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    if (question[0].lecturer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await db.query('DELETE FROM assignment_questions WHERE id = ?', [req.params.questionId]);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- SUBMISSIONS & GRADING ---

exports.submitAssignment = async (req, res) => {
  const { content, answers } = req.body; // 'content' for essay, 'answers' for quiz (JSON array/obj)
  const assignment_id = req.params.id;
  const student_id = req.user.id;

  try {
    const [assignments] = await db.query('SELECT * FROM assignments WHERE id = ?', [assignment_id]);
    if (assignments.length === 0) return res.status(404).json({ message: 'Assignment not found' });
    const assignment = assignments[0];

    // Check Due Date
    if (assignment.due_date && new Date() > new Date(assignment.due_date)) {
      return res.status(403).json({ message: 'Assignment due date has passed. You cannot submit it anymore.' });
    }

    if (assignment.type === 'quiz') {
      // Auto-Grade Quiz
      const [questions] = await db.query('SELECT * FROM assignment_questions WHERE assignment_id = ?', [assignment_id]);
      
      let score = 0;
      let total_possible = 0;
      
      questions.forEach(q => {
        total_possible += q.points;
        // answers could be a map of question_id -> selected_option_index
        if (answers && answers[q.id] !== undefined && answers[q.id] == q.correct_option) {
          score += q.points;
        }
      });
      
      // Auto-scale score to total_points of the assignment
      const final_score = total_possible > 0 ? Math.round((score / total_possible) * assignment.total_points) : 0;

      await db.query(
        'INSERT INTO assignment_submissions (assignment_id, student_id, answers, score, status) VALUES (?, ?, ?, ?, ?)',
        [assignment_id, student_id, JSON.stringify(answers), final_score, 'graded']
      );

      // Return per-question results so frontend can show correct/incorrect
      const questionResults = questions.map(q => ({
        id: q.id,
        correct_option: q.correct_option,
        is_correct: answers && answers[q.id] !== undefined && answers[q.id] == q.correct_option
      }));

      res.status(201).json({
        message: 'Quiz graded successfully',
        score: final_score,
        total: assignment.total_points,
        question_results: questionResults
      });
    } else {
      // Essay submission
      let file_url = null;
      if (req.file) {
        file_url = `/uploads/${req.file.filename}`;
      }
      
      await db.query(
        'INSERT INTO assignment_submissions (assignment_id, student_id, content, file_url, status) VALUES (?, ?, ?, ?, ?)',
        [assignment_id, student_id, content, file_url, 'submitted']
      );
      res.status(201).json({ message: 'Essay submitted successfully. Waiting for grading.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const [submissions] = await db.query(`
      SELECT s.*, u.name as student_name, u.email as student_email 
      FROM assignment_submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.assignment_id = ?
      ORDER BY s.submitted_at DESC
    `, [req.params.id]);
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.gradeSubmission = async (req, res) => {
  const { score, feedback } = req.body;
  try {
    await db.query(
      'UPDATE assignment_submissions SET score = ?, feedback = ?, status = ? WHERE id = ?',
      [score, feedback, 'graded', req.params.subId]
    );
    res.json({ message: 'Submission graded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- GRADEBOOK ---

exports.getCourseGrades = async (req, res) => {
  const course_id = req.params.courseId;
  try {
    // Get all students enrolled
    const [students] = await db.query(`
      SELECT u.id, u.name, u.email 
      FROM users u
      JOIN enrollments e ON u.id = e.student_id
      WHERE e.course_id = ?
    `, [course_id]);

    // Get all assignments in the course
    const [assignments] = await db.query('SELECT id, title, total_points FROM assignments WHERE course_id = ?', [course_id]);

    // Get all 'graded' submissions for the course (we keep the latest/highest grade for each assignment per student)
    const [submissions] = await db.query(`
      SELECT s.student_id, s.assignment_id, s.score 
      FROM assignment_submissions s
      JOIN assignments a ON s.assignment_id = a.id
      WHERE a.course_id = ? AND s.status = 'graded'
    `, [course_id]);

    const studentMap = {};
    students.forEach(s => {
      studentMap[s.id] = {
        ...s,
        grades: {} // map of assignment_id -> score
      };
    });

    submissions.forEach(sub => {
      if (studentMap[sub.student_id]) {
        // If retaking is allowed, only store the highest score
        const current_score = studentMap[sub.student_id].grades[sub.assignment_id];
        if (current_score === undefined || sub.score > current_score) {
          studentMap[sub.student_id].grades[sub.assignment_id] = sub.score;
        }
      }
    });

    // Also get progress %
    const [lessons] = await db.query('SELECT id FROM lessons WHERE course_id = ?', [course_id]);
    const totalLessons = lessons.length;

    if (totalLessons > 0) {
      const [progress] = await db.query(`
        SELECT p.student_id, COUNT(p.id) as count
        FROM lesson_progress p
        JOIN lessons l ON p.lesson_id = l.id
        WHERE l.course_id = ?
        GROUP BY p.student_id
      `, [course_id]);
      
      progress.forEach(p => {
        if (studentMap[p.student_id]) {
          studentMap[p.student_id].progress = Math.round((p.count / totalLessons) * 100);
        }
      });
    }

    // Populate default 0% progress
    Object.values(studentMap).forEach(s => {
      if (s.progress === undefined) s.progress = 0;
    });

    res.json({
      assignments,
      students: Object.values(studentMap)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
