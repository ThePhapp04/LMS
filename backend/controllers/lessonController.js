const db = require('../config/db');
const path = require('path');
const { uploadToStorage } = require('../config/storage');

function getFileType(originalname) {
  const ext = originalname.split('.').pop().toLowerCase();
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
  if (ext === 'pdf') return 'pdf';
  if (['pptx', 'ppt'].includes(ext)) return 'pptx';
  if (['docx', 'doc'].includes(ext)) return 'docx';
  if (['xlsx', 'xls'].includes(ext)) return 'xlsx';
  return 'document';
}

exports.createLesson = async (req, res) => {
  const { course_id, chapter_id, title, content, video_url, lesson_order, duration } = req.body;
  let file_url = null, file_name = null, file_type = null;

  if (req.file) {
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(originalName).toLowerCase();
    const storageName = `lesson-${Date.now()}${ext}`;
    file_url = await uploadToStorage(req.file.buffer, 'lesson-files', storageName, req.file.mimetype);
    file_name = originalName;
    file_type = getFileType(originalName);
  }

  try {
    const [course] = await db.query('SELECT lecturer_id FROM courses WHERE id = ?', [course_id]);
    if (course.length === 0) return res.status(404).json({ message: 'Course not found' });
    if (course[0].lecturer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const [result] = await db.query(
      'INSERT INTO lessons (course_id, chapter_id, title, content, video_url, file_url, file_name, file_type, lesson_order, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
      [course_id, chapter_id || null, title, content, video_url || null, file_url, file_name, file_type, lesson_order || 0, duration || null]
    );

    res.status(201).json({
      id: result[0].id, course_id, chapter_id, title, content, video_url, file_url, file_name, file_type,
      lesson_order: lesson_order || 0, duration
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateLesson = async (req, res) => {
  const { title, chapter_id, content, video_url, lesson_order, duration } = req.body;
  try {
    const [lesson] = await db.query('SELECT l.*, c.lecturer_id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE l.id = ?', [req.params.id]);
    if (lesson.length === 0) return res.status(404).json({ message: 'Lesson not found' });
    if (lesson[0].lecturer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let file_url = lesson[0].file_url, file_name = lesson[0].file_name, file_type = lesson[0].file_type;
    if (req.file) {
      const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
      const ext = path.extname(originalName).toLowerCase();
      const storageName = `lesson-${Date.now()}${ext}`;
      file_url = await uploadToStorage(req.file.buffer, 'lesson-files', storageName, req.file.mimetype);
      file_name = originalName;
      file_type = getFileType(originalName);
    }

    await db.query(
      'UPDATE lessons SET title=?, chapter_id=?, content=?, video_url=?, file_url=?, file_name=?, file_type=?, lesson_order=?, duration=? WHERE id=?',
      [
        title || lesson[0].title,
        chapter_id !== undefined ? (chapter_id || null) : lesson[0].chapter_id,
        content || lesson[0].content,
        video_url !== undefined ? video_url : lesson[0].video_url,
        file_url, file_name, file_type,
        lesson_order !== undefined ? lesson_order : lesson[0].lesson_order,
        duration || lesson[0].duration,
        req.params.id
      ]
    );
    res.json({ message: 'Lesson updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteLesson = async (req, res) => {
  try {
    const [lesson] = await db.query('SELECT l.*, c.lecturer_id FROM lessons l JOIN courses c ON l.course_id = c.id WHERE l.id = ?', [req.params.id]);
    if (lesson.length === 0) return res.status(404).json({ message: 'Lesson not found' });
    if (lesson[0].lecturer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await db.query('DELETE FROM lessons WHERE id = ?', [req.params.id]);
    res.json({ message: 'Lesson deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markProgress = async (req, res) => {
  const { lesson_id, completed } = req.body;
  try {
    await db.query(
      `INSERT INTO lesson_progress (student_id, lesson_id, completed, completed_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (student_id, lesson_id) DO UPDATE
         SET completed = EXCLUDED.completed, completed_at = EXCLUDED.completed_at`,
      [req.user.id, lesson_id, completed, completed ? new Date() : null]
    );
    res.json({ message: 'Progress updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProgressForCourse = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT lp.lesson_id, lp.completed FROM lesson_progress lp
       JOIN lessons l ON lp.lesson_id = l.id
       WHERE l.course_id = ? AND lp.student_id = ?`,
      [req.params.courseId, req.user.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
