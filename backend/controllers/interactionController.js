const db = require('../config/db');

// --- NOTES ---
exports.getNotes = async (req, res) => {
  try {
    const [notes] = await db.query(
      'SELECT * FROM notes WHERE user_id = ? AND lesson_id = ?',
      [req.user.id, req.params.lessonId]
    );
    res.json(notes[0] || { content: '' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.saveNote = async (req, res) => {
  const { content } = req.body;
  const lesson_id = req.params.lessonId;
  const user_id = req.user.id;
  try {
    const [existing] = await db.query(
      'SELECT id FROM notes WHERE user_id = ? AND lesson_id = ?',
      [user_id, lesson_id]
    );

    if (existing.length > 0) {
      await db.query('UPDATE notes SET content = ? WHERE id = ?', [content, existing[0].id]);
    } else {
      await db.query('INSERT INTO notes (user_id, lesson_id, content) VALUES (?, ?, ?)', [user_id, lesson_id, content]);
    }
    res.json({ message: 'Note saved' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- COMMENTS ---
exports.getComments = async (req, res) => {
  try {
    const [comments] = await db.query(`
      SELECT c.*, u.name as user_name, u.avatar_url 
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.lesson_id = ?
      ORDER BY c.created_at DESC
    `, [req.params.lessonId]);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addComment = async (req, res) => {
  const { content } = req.body;
  const lesson_id = parseInt(req.params.lessonId, 10);
  const user_id = req.user?.id;

  console.log('[addComment] body:', req.body, '| lesson_id:', lesson_id, '| user_id:', user_id);

  if (!content) return res.status(400).json({ message: 'Content is required' });
  if (!user_id) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const [result] = await db.query(
      'INSERT INTO comments (user_id, lesson_id, content) VALUES (?, ?, ?) RETURNING id',
      [user_id, lesson_id, content]
    );

    const [newComment] = await db.query(`
      SELECT c.*, u.name as user_name, u.avatar_url 
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result[0].id]);

    res.status(201).json(newComment[0]);
  } catch (error) {
    console.error('[addComment error]', error.message, { user_id, lesson_id, content });
    res.status(500).json({ message: error.message });
  }
};

// --- FORUM TOPICS ---
exports.getForums = async (req, res) => {
  try {
    // If course_id is provided, fetch for that course, otherwise fetch global topics
    const course_id = req.query.course_id;
    let query = `
      SELECT f.*, u.name as author_name, c.title as course_title,
             (SELECT COUNT(*) FROM forum_replies WHERE topic_id = f.id) as reply_count
      FROM forum_topics f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN courses c ON f.course_id = c.id
    `;
    const params = [];

    if (course_id) {
      query += ' WHERE f.course_id = ?';
      params.push(course_id);
    } else {
      query += ' WHERE f.course_id IS NULL'; // Global forum
    }
    
    query += ' ORDER BY f.created_at DESC';

    const [topics] = await db.query(query, params);
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getForumById = async (req, res) => {
  try {
    await db.query('UPDATE forum_topics SET views = views + 1 WHERE id = ?', [req.params.id]);

    const [topics] = await db.query(`
      SELECT f.*, u.name as author_name, c.title as course_title
      FROM forum_topics f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN courses c ON f.course_id = c.id
      WHERE f.id = ?
    `, [req.params.id]);

    if (topics.length === 0) return res.status(404).json({ message: 'Topic not found' });

    const [replies] = await db.query(`
      SELECT r.*, u.name as reply_author, u.role as reply_role
      FROM forum_replies r
      JOIN users u ON r.user_id = u.id
      WHERE r.topic_id = ?
      ORDER BY r.created_at ASC
    `, [req.params.id]);

    res.json({ ...topics[0], replies });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createForum = async (req, res) => {
  const { title, content, course_id } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO forum_topics (course_id, user_id, title, content) VALUES (?, ?, ?, ?) RETURNING id',
      [course_id || null, req.user.id, title, content]
    );
    res.status(201).json({ id: result[0].id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- FORUM REPLIES ---
exports.replyForum = async (req, res) => {
  const { content } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO forum_replies (topic_id, user_id, content) VALUES (?, ?, ?) RETURNING id',
      [req.params.id, req.user.id, content]
    );
    res.status(201).json({ id: result[0].id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
