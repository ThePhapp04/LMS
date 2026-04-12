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
