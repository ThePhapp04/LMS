const db = require('../config/db');

exports.enroll = async (req, res) => {
  const { course_id } = req.body;
  try {
    const [existing] = await db.query('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?', [req.user.id, course_id]);
    if (existing.length > 0) return res.status(400).json({ message: 'Already enrolled in this course' });

    await db.query(
      'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)',
      [req.user.id, course_id]
    );
    res.status(201).json({ message: 'Successfully enrolled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyEnrollments = async (req, res) => {
  try {
    const [courses] = await db.query(`
      SELECT c.*, e.enrolled_at 
      FROM enrollments e 
      JOIN courses c ON e.course_id = c.id 
      WHERE e.student_id = ?
    `, [req.user.id]);
    
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all students enrolled in a course (for lecturers)
exports.getCourseStudents = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    // Verify lecturer owns this course
    const [course] = await db.query('SELECT * FROM courses WHERE id = ?', [courseId]);
    if (course.length === 0) return res.status(404).json({ message: 'Course not found' });
    if (course[0].lecturer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get all lessons for this course
    const [lessons] = await db.query('SELECT id FROM lessons WHERE course_id = ?', [courseId]);
    const totalLessons = lessons.length;

    // Get students with their progress
    const [students] = await db.query(`
      SELECT 
        u.id, u.name, u.email, u.avatar_url,
        e.enrolled_at,
        COUNT(DISTINCT lp.lesson_id) as completed_lessons,
        ROUND(COUNT(DISTINCT lp.lesson_id) * 100.0 / NULLIF(?, 0), 1) as progress_percentage,
        MAX(lp.completed_at) as last_activity
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      LEFT JOIN lesson_progress lp ON lp.student_id = u.id 
        AND lp.lesson_id IN (SELECT id FROM lessons WHERE course_id = ?)
        AND lp.completed = TRUE
      WHERE e.course_id = ?
      GROUP BY u.id, u.name, u.email, u.avatar_url, e.enrolled_at
      ORDER BY e.enrolled_at DESC
    `, [totalLessons, courseId, courseId]);

    res.json({
      course: {
        id: course[0].id,
        title: course[0].title,
        total_lessons: totalLessons
      },
      students
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get detailed progress for a specific student in a course
exports.getStudentProgress = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    
    // Verify lecturer owns this course
    const [course] = await db.query('SELECT * FROM courses WHERE id = ?', [courseId]);
    if (course.length === 0) return res.status(404).json({ message: 'Course not found' });
    if (course[0].lecturer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get student info
    const [student] = await db.query('SELECT id, name, email, avatar_url FROM users WHERE id = ?', [studentId]);
    if (student.length === 0) return res.status(404).json({ message: 'Student not found' });

    // Get lessons with progress
    const [lessons] = await db.query(`
      SELECT 
        l.id, l.title, l.chapter_id, l.lesson_order, l.duration,
        ch.title as chapter_title,
        lp.completed, lp.completed_at
      FROM lessons l
      LEFT JOIN chapters ch ON l.chapter_id = ch.id
      LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.student_id = ?
      WHERE l.course_id = ?
      ORDER BY ch.chapter_order, l.lesson_order
    `, [studentId, courseId]);

    // Get assignment submissions
    const [submissions] = await db.query(`
      SELECT 
        a.id as assignment_id, a.title, a.total_points,
        sub.score, sub.status, sub.submitted_at
      FROM assignments a
      LEFT JOIN assignment_submissions sub ON sub.assignment_id = a.id AND sub.student_id = ?
      WHERE a.course_id = ?
      ORDER BY a.created_at
    `, [studentId, courseId]);

    const completedLessons = lessons.filter(l => l.completed).length;
    const totalLessons = lessons.length;
    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    res.json({
      student: student[0],
      course: {
        id: course[0].id,
        title: course[0].title
      },
      progress: {
        completed_lessons: completedLessons,
        total_lessons: totalLessons,
        progress_percentage: progressPercentage
      },
      lessons,
      assignments: submissions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
