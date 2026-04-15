const db = require('../config/db');

// @desc    Get upcoming events or all events for a user
// @route   GET /api/events
exports.getEvents = async (req, res) => {
  try {
    const { startDetail, endDetail } = req.query; // optional date filters
    let query = '';
    let params = [];

    // If student, get events for enrolled courses
    if (req.user.role === 'student') {
      query = `
        SELECT e.*, c.title as course_title, c.category as course_category 
        FROM events e
        JOIN courses c ON e.course_id = c.id
        JOIN enrollments en ON en.course_id = c.id
        WHERE en.student_id = ?
      `;
      params.push(req.user.id);
    } else {
      // Admin or Lecturer - get events they manage or all
      if (req.user.role === 'admin') {
        query = `
          SELECT e.*, c.title as course_title, c.category as course_category 
          FROM events e
          JOIN courses c ON e.course_id = c.id
        `;
      } else {
        query = `
          SELECT e.*, c.title as course_title, c.category as course_category 
          FROM events e
          JOIN courses c ON e.course_id = c.id
          WHERE e.lecturer_id = ?
        `;
        params.push(req.user.id);
      }
    }

    if (startDetail && endDetail) {
      query += ` AND e.start_time >= ? AND e.end_time <= ? `;
      params.push(startDetail, endDetail);
    }

    query += ' ORDER BY e.start_time ASC';
    const [events] = await db.query(query, params);

    // Also map assignments to deadline events logically if we want?
    // For simplicity, we just rely on standard events table. We could UNION, but letting frontend fetch is easier or backend maps it here:
    
    let deadlines = [];
    if (req.user.role === 'student') {
      const [assignmentData] = await db.query(`
        SELECT a.id, a.title, a.due_date, c.title as course_title, c.id as course_id
        FROM assignments a
        JOIN courses c ON a.course_id = c.id
        JOIN enrollments en ON en.course_id = c.id
        WHERE en.student_id = ? AND a.due_date IS NOT NULL
      `, [req.user.id]);
      
      deadlines = assignmentData.map(a => ({
        id: 'assignment_' + a.id,
        course_id: a.course_id,
        course_title: a.course_title,
        title: a.title,
        start_time: a.due_date,
        end_time: a.due_date,
        event_type: 'deadline',
        status: 'upcoming'
      }));
    } else if (req.user.role === 'lecturer') {
      const [assignmentData] = await db.query(`
        SELECT a.id, a.title, a.due_date, c.title as course_title, c.id as course_id
        FROM assignments a
        JOIN courses c ON a.course_id = c.id
        WHERE c.lecturer_id = ? AND a.due_date IS NOT NULL
      `, [req.user.id]);
      
      deadlines = assignmentData.map(a => ({
        id: 'assignment_' + a.id,
        course_id: a.course_id,
        course_title: a.course_title,
        title: a.title,
        start_time: a.due_date,
        end_time: a.due_date,
        event_type: 'deadline',
        status: 'upcoming'
      }));
    }

    res.json([...events, ...deadlines]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new event
// @route   POST /api/events
exports.createEvent = async (req, res) => {
  const { course_id, title, start_time, end_time, event_type, meeting_link } = req.body;
  try {
    // Verify ownership
    if (req.user.role !== 'admin') {
      const [courses] = await db.query('SELECT * FROM courses WHERE id = ? AND lecturer_id = ?', [course_id, req.user.id]);
      if (courses.length === 0) return res.status(403).json({ message: 'Not authorized for this course' });
    }

    const [result] = await db.query(
      'INSERT INTO events (course_id, lecturer_id, title, start_time, end_time, event_type, meeting_link) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
      [course_id, req.user.id, title, start_time, end_time, event_type || 'lecture', meeting_link || null]
    );

    res.status(201).json({ 
      id: result[0].id, course_id, lecturer_id: req.user.id, title, start_time, end_time, event_type, meeting_link 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
exports.updateEvent = async (req, res) => {
  const { title, start_time, end_time, event_type, meeting_link, status } = req.body;
  try {
    const [event] = await db.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (event.length === 0) return res.status(404).json({ message: 'Event not found' });
    
    if (req.user.role !== 'admin' && event[0].lecturer_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await db.query(
      'UPDATE events SET title=?, start_time=?, end_time=?, event_type=?, meeting_link=?, status=? WHERE id=?',
      [
        title || event[0].title, 
        start_time || event[0].start_time, 
        end_time || event[0].end_time, 
        event_type || event[0].event_type, 
        meeting_link !== undefined ? meeting_link : event[0].meeting_link,
        status || event[0].status,
        req.params.id
      ]
    );
    res.json({ message: 'Event updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
exports.deleteEvent = async (req, res) => {
  try {
    const [event] = await db.query('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (event.length === 0) return res.status(404).json({ message: 'Event not found' });
    
    if (req.user.role !== 'admin' && event[0].lecturer_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await db.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
