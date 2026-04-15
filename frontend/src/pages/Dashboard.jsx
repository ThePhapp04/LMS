import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { assetUrl } from '../services/api';
import { BookOpen, GraduationCap, TrendingUp, PlusCircle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [enrollments, setEnrollments] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === 'student') {
          const [enrRes, allRes] = await Promise.all([
            api.get('/enrollments/my'),
            api.get('/courses')
          ]);
          setEnrollments(enrRes.data);
          setAllCourses(allRes.data);
        } else {
          const res = await api.get('/courses');
          const mine = res.data.filter(c => c.lecturer_id === user.id);
          setAllCourses(mine);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    if (user) fetchData();
  }, [user]);

  const initial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div>
      {/* Welcome Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 60%, #06B6D4 100%)',
        borderRadius: 'var(--radius)',
        padding: '2rem 2.5rem',
        color: '#fff',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>
            Hello, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p style={{ opacity: 0.85, fontSize: '1rem' }}>
            {user?.role === 'student' ? 'Ready to continue learning today?' : 'Manage your courses and inspire students.'}
          </p>
        </div>
        <Link to="/courses" className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(8px)', padding: '0.65rem 1.4rem' }}>
          {user?.role === 'student' ? 'Browse Courses' : '+ New Course'}
        </Link>
      </div>

      {/* Stats */}
      {user?.role === 'student' && (
        <div className="stats-grid">
          <div className="stat-card indigo">
            <div className="stat-label">Enrolled</div>
            <div className="stat-value">{enrollments.length}</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-label">Available Courses</div>
            <div className="stat-value">{allCourses.length}</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">Completed</div>
            <div className="stat-value">0</div>
          </div>
        </div>
      )}
      {user?.role === 'lecturer' && (
        <div className="stats-grid">
          <div className="stat-card indigo">
            <div className="stat-label">My Courses</div>
            <div className="stat-value">{allCourses.length}</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-label">Total Lessons</div>
            <div className="stat-value">{allCourses.reduce((s, c) => s + (c.lesson_count || 0), 0)}</div>
          </div>
          <div className="stat-card cyan">
            <div className="stat-label">Enrolled Students</div>
            <div className="stat-value">{allCourses.reduce((s, c) => s + (c.student_count || 0), 0)}</div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="loading-wrapper"><div className="spinner"></div><p>Loading...</p></div>
      ) : (
        <>
          {user?.role === 'student' && (
            <div>
              <div className="page-header">
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>My Enrolled Courses</h2>
                  <p className="page-subtitle">Pick up where you left off</p>
                </div>
              </div>
              {enrollments.length === 0 ? (
                <div className="empty-state card" style={{ padding: '3rem' }}>
                  <div className="empty-state-icon">📚</div>
                  <h3>No courses yet</h3>
                  <p>You haven't enrolled in any courses. Start learning today!</p>
                  <Link to="/courses" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse Courses</Link>
                </div>
              ) : (
                <div className="grid-cards">
                  {enrollments.map(course => (
                    <div key={course.id} className="course-card">
                      <div className="course-card-thumb">
                        {course.thumbnail_url
                          ? <img src={assetUrl(course.thumbnail_url)} alt={course.title} />
                          : <GraduationCap size={48} />
                        }
                      </div>
                      <div className="course-card-body">
                        <div className="course-card-title">{course.title}</div>
                        <div className="course-card-desc">{course.description?.substring(0, 90)}{course.description?.length > 90 && '...'}</div>
                        <Link to={`/courses/${course.id}`} className="btn btn-primary btn-sm btn-block">Continue Learning →</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {user?.role === 'lecturer' && (
            <div>
              <div className="page-header">
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>My Courses</h2>
                  <p className="page-subtitle">Manage your course catalog</p>
                </div>
                <Link to="/courses" className="btn btn-primary"><PlusCircle size={16} /> Create Course</Link>
              </div>
              {allCourses.length === 0 ? (
                <div className="empty-state card" style={{ padding: '3rem' }}>
                  <div className="empty-state-icon">🎓</div>
                  <h3>No courses yet</h3>
                  <p>Create your first course and start inspiring students!</p>
                  <Link to="/courses" className="btn btn-primary" style={{ marginTop: '1rem' }}>+ Create Course</Link>
                </div>
              ) : (
                <div className="grid-cards">
                  {allCourses.map(course => (
                    <div key={course.id} className="course-card">
                      <div className="course-card-thumb">
                        {course.thumbnail_url
                          ? <img src={assetUrl(course.thumbnail_url)} alt={course.title} />
                          : <BookOpen size={48} />
                        }
                      </div>
                      <div className="course-card-body">
                        <div className="course-card-title">{course.title}</div>
                        <div className="course-card-meta">
                          <span className="course-card-meta-item"><TrendingUp size={13} /> {course.lesson_count || 0} lessons</span>
                          <span className="course-card-meta-item">👥 {course.student_count || 0} students</span>
                        </div>
                        <Link to={`/courses/${course.id}`} className="btn btn-secondary btn-sm btn-block">Manage Course</Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
