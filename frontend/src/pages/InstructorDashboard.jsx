import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { assetUrl } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, BarChart2, Book, Users, Star } from 'lucide-react';

const InstructorDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'lecturer' && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    try {
      // Assuming GET /courses with no filters returns all, but really should filter by lecturer
      const res = await api.get('/courses');
      const myCourses = res.data.filter(c => c.lecturer_id === user.id);
      setCourses(myCourses);
    } catch { } 
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khóa học này? Mọi dữ liệu sẽ bị mất.')) return;
    try {
      await api.delete(`/courses/${id}`);
      fetchCourses();
    } catch {
      alert('Lỗi xóa khóa học');
    }
  };

  if (loading) return <div className="loading-wrapper"><div className="spinner" /></div>;

  const totalStudents = courses.reduce((acc, c) => acc + (c.student_count || 0), 0);
  const totalRevenue = courses.reduce((acc, c) => acc + ((c.student_count || 0) * (c.price || 0)), 0);

  return (
    <div className="main-content">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Instructor Dashboard</h1>
          <p className="page-subtitle">Quản lý và theo dõi hiệu suất các khóa học của bạn</p>
        </div>
        <div>
          <Link to="/instructor/course/create" className="btn btn-primary">
            <Plus size={16} /> Tạo khóa học mới
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}><Book size={28} /></div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{courses.length}</div>
            <div style={{ color: 'var(--text-muted)' }}>Khóa học đã tạo</div>
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}><Users size={28} /></div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{totalStudents}</div>
            <div style={{ color: 'var(--text-muted)' }}>Tổng học viên</div>
          </div>
        </div>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}><BarChart2 size={28} /></div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>${totalRevenue.toFixed(2)}</div>
            <div style={{ color: 'var(--text-muted)' }}>Doanh thu (Ước tính)</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Danh sách khóa học</h3>
        </div>
        {courses.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Chưa có khóa học nào. Hãy tạo khóa học đầu tiên của bạn!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>Khóa học</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Trạng thái</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Giá trị</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Thống kê</th>
                  <th style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <tr key={course.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: 80, height: 45, borderRadius: '4px', background: '#e2e8f0', overflow: 'hidden' }}>
                          {course.thumbnail_url ? <img src={assetUrl(course.thumbnail_url)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ''}
                        </div>
                        <div>
                          <Link to={`/courses/${course.id}`} style={{ fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>{course.title}</Link>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{course.category}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-success">Đã xuất bản</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600 }}>{course.price > 0 ? `$${course.price}` : 'Miễn phí'}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> {course.student_count || 0}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#eab308' }}><Star size={14} fill="currentColor" /> {parseFloat(course.rating || 4).toFixed(1)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <Link 
                          to={`/instructor/course/${course.id}/students`} 
                          className="btn btn-ghost btn-sm" 
                          style={{ padding: '0.4rem 0.75rem' }}
                          title="Xem học viên"
                        >
                          <Users size={14} />
                        </Link>
                        <Link to={`/instructor/course/${course.id}/edit`} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem 0.5rem' }}>
                          <Edit size={14} />
                        </Link>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '0.4rem 0.5rem', color: 'var(--error)' }} onClick={() => handleDelete(course.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;
