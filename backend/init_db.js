require('dotenv').config();
const mysql = require('mysql2/promise');

async function initializeDB() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    console.log('Connected to MySQL server.');
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    console.log(`Database '${process.env.DB_NAME}' created or already exists.`);
    await connection.query(`USE \`${process.env.DB_NAME}\`;`);

    // Users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'lecturer', 'admin') DEFAULT 'student',
        avatar_url VARCHAR(500)
      )
    `);

    // Courses
    await connection.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100) DEFAULT 'General',
        thumbnail_url VARCHAR(500),
        lecturer_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Add category & thumbnail if upgrading from old schema
    await connection.query(`
      ALTER TABLE courses
        ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General',
        ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500)
    `).catch(() => {});

    // Chapters
    await connection.query(`
      CREATE TABLE IF NOT EXISTS chapters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        chapter_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      )
    `);

    // Lessons
    await connection.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        chapter_id INT,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        video_url VARCHAR(500),
        file_url VARCHAR(500),
        file_name VARCHAR(255),
        file_type VARCHAR(50),
        lesson_order INT DEFAULT 0,
        duration VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
      )
    `);

    // Add new cols if upgrading
    await connection.query(`
      ALTER TABLE lessons
        ADD COLUMN IF NOT EXISTS chapter_id INT,
        ADD FOREIGN KEY IF NOT EXISTS (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS file_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS file_type VARCHAR(50),
        ADD COLUMN IF NOT EXISTS lesson_order INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS duration VARCHAR(50)
    `).catch(() => {});

    // Enrollments
    await connection.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        course_id INT NOT NULL,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        UNIQUE(student_id, course_id)
      )
    `);

    // Progress tracking
    await connection.query(`
      CREATE TABLE IF NOT EXISTS lesson_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        lesson_id INT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
        UNIQUE(student_id, lesson_id)
      )
    `);

    // Personal Notes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        lesson_id INT NOT NULL,
        content TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
        UNIQUE(user_id, lesson_id)
      )
    `);

    // Comments for Discussion
    await connection.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        lesson_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
      )
    `);

    // Forum Topics
    await connection.query(`
      CREATE TABLE IF NOT EXISTS forum_topics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        views INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Forum Replies
    await connection.query(`
      CREATE TABLE IF NOT EXISTS forum_replies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        topic_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('All tables created/updated successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    if (connection) await connection.end();
    process.exit();
  }
}

initializeDB();
