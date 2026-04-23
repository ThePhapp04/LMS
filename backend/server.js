const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap = {
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.ppt':  'application/vnd.ms-powerpoint',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.doc':  'application/msword',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xls':  'application/vnd.ms-excel',
    };
    if (mimeMap[ext]) res.setHeader('Content-Type', mimeMap[ext]);
  }
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/chapters', require('./routes/chapters'));
app.use('/api/lessons', require('./routes/lessons'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/interactions', require('./routes/interactions'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/events', require('./routes/events'));

app.get('/', (req, res) => {
  res.send('LMS API is running...');
});

app.get('/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
