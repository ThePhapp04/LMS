const db = require('../config/db');

exports.createChapter = async (req, res) => {
  const { course_id, title, chapter_order } = req.body;
  try {
    // Quick auth check - owner only, or admin
    const [course] = await db.query('SELECT * FROM courses WHERE id = ?', [course_id]);
    if (course.length === 0) return res.status(404).json({ message: 'Course not found' });
    if (course[0].lecturer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const [result] = await db.query(
      'INSERT INTO chapters (course_id, title, chapter_order) VALUES (?, ?, ?) RETURNING id',
      [course_id, title, chapter_order || 0]
    );
    res.status(201).json({ id: result[0].id, course_id, title, chapter_order: chapter_order || 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateChapter = async (req, res) => {
  const { title, chapter_order } = req.body;
  try {
    const [chapter] = await db.query('SELECT * FROM chapters WHERE id = ?', [req.params.id]);
    if (chapter.length === 0) return res.status(404).json({ message: 'Chapter not found' });

    // auth check
    const [course] = await db.query('SELECT * FROM courses WHERE id = ?', [chapter[0].course_id]);
    if (course[0].lecturer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await db.query(
      'UPDATE chapters SET title=?, chapter_order=? WHERE id=?',
      [title || chapter[0].title, chapter_order ?? chapter[0].chapter_order, req.params.id]
    );
    res.json({ message: 'Chapter updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteChapter = async (req, res) => {
  try {
    const [chapter] = await db.query('SELECT * FROM chapters WHERE id = ?', [req.params.id]);
    if (chapter.length === 0) return res.status(404).json({ message: 'Chapter not found' });

    const [course] = await db.query('SELECT * FROM courses WHERE id = ?', [chapter[0].course_id]);
    if (course[0].lecturer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await db.query('DELETE FROM chapters WHERE id = ?', [req.params.id]);
    res.json({ message: 'Chapter deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
