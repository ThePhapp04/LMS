import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { FileEdit, List, DollarSign, CheckCircle, ArrowLeft, Upload, Plus, Trash2 } from 'lucide-react';

const CATEGORIES = ['General', 'Technology', 'Business', 'Design', 'Science', 'Language', 'Arts'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const CourseEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isEdit = !!id;

  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [course, setCourse] = useState({
    title: '', description: '', category: 'General', price: 0, level: 'Beginner', thumbnail_url: ''
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  
  // Curriculum State
  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    if (user && user.role !== 'lecturer' && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    if (isEdit) fetchCourse();
  }, [id, user]);

  const fetchCourse = async () => {
    try {
      const res = await api.get(`/courses/${id}`);
      const data = res.data;
      setCourse({
        title: data.title, description: data.description, category: data.category,
        price: data.price || 0, level: data.level || 'Beginner', thumbnail_url: data.thumbnail_url
      });
      setChapters(data.chapters || []);
    } catch {
      navigate('/instructor/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBasic = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('title', course.title);
      fd.append('description', course.description);
      fd.append('category', course.category);
      fd.append('price', course.price);
      fd.append('level', course.level);
      if (thumbnailFile) fd.append('thumbnail', thumbnailFile);

      if (isEdit) {
        await api.put(`/courses/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        alert('Đã lưu thông tin khóa học');
      } else {
        const res = await api.post('/courses', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        navigate(`/instructor/course/${res.data.id}/edit`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi lưu thông tin');
    } finally {
      setSaving(false);
    }
  };

  // Curriculum Handlers (Simplified representations)
  const addChapter = async () => {
    const title = prompt('Tên chương mới:');
    if (!title) return;
    try {
      if (isEdit) {
        await api.post('/chapters', { course_id: id, title, chapter_order: chapters.length + 1 });
        fetchCourse();
      }
    } catch { alert('Lỗi tạo chương. Vui lòng lưu thông tin cơ bản trước.')}
  };

  const deleteChapter = async (chapId) => {
    if (!window.confirm('Xóa chương này?')) return;
    try {
      await api.delete(`/chapters/${chapId}`);
      fetchCourse();
    } catch {}
  };

  if (loading) return <div className="loading-wrapper"><div className="spinner" /></div>;

  return (
    <div className="main-content">
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }} onClick={() => navigate('/instructor/dashboard')}>
        <ArrowLeft size={16} /> Quay lại Dashboard
      </button>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Sidebar Menu */}
        <div className="card" style={{ width: '250px', flexShrink: 0, padding: '1rem' }}>
          <div style={{ fontWeight: 800, padding: '0.5rem 1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
            Quản lý khóa học
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className={`btn ${activeTab === 'basic' ? 'btn-primary' : 'btn-ghost'}`} style={{ justifyContent: 'flex-start' }} onClick={() => setActiveTab('basic')}>
              <FileEdit size={16} /> Thông tin cơ bản
            </button>
            <button className={`btn ${activeTab === 'curriculum' ? 'btn-primary' : 'btn-ghost'}`} style={{ justifyContent: 'flex-start' }} onClick={() => setActiveTab('curriculum')} disabled={!isEdit}>
              <List size={16} /> Chương trình học (Curriculum)
            </button>
            <button className={`btn ${activeTab === 'pricing' ? 'btn-primary' : 'btn-ghost'}`} style={{ justifyContent: 'flex-start' }} onClick={() => setActiveTab('pricing')}>
              <DollarSign size={16} /> Định giá & Cấp độ
            </button>
            <button className={`btn ${activeTab === 'publish' ? 'btn-success' : 'btn-ghost'}`} style={{ justifyContent: 'flex-start' }} onClick={() => setActiveTab('publish')} disabled={!isEdit}>
              <CheckCircle size={16} /> Xuất bản
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
          
          <form className="card" style={{ padding: '2rem' }} onSubmit={handleSaveBasic}>
            
            {activeTab === 'basic' && (
              <>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Thông tin cơ bản</h2>
                <div className="form-group">
                  <label className="form-label">Tiêu đề khóa học</label>
                  <input type="text" className="form-input" required value={course.title} onChange={e => setCourse({...course, title: e.target.value})} placeholder="VD: Lập trình ReactJS từ A-Z" />
                </div>
                <div className="form-group">
                  <label className="form-label">Mô tả chi tiết</label>
                  <textarea className="form-textarea" required rows="6" value={course.description} onChange={e => setCourse({...course, description: e.target.value})} placeholder="Mô tả những gì học viên sẽ đạt được..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Danh mục</label>
                  <select className="form-select" value={course.category} onChange={e => setCourse({...course, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Hình ảnh Thumbnail</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    {course.thumbnail_url && !thumbnailFile && (
                      <img src={`http://localhost:5000${course.thumbnail_url}`} style={{ width: 150, height: 100, objectFit: 'cover', borderRadius: '4px' }} />
                    )}
                    <label className="form-file-label" style={{ flex: 1 }}>
                      <Upload size={20} />
                      <span>{thumbnailFile ? thumbnailFile.name : 'Nhấn để chọn ảnh mới'}</span>
                      <input type="file" className="form-file-input" accept="image/*" onChange={e => setThumbnailFile(e.target.files[0])} />
                    </label>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thông tin cơ bản'}</button>
              </>
            )}

            {activeTab === 'pricing' && (
              <>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Định giá và Cấp độ</h2>
                <div className="form-group">
                  <label className="form-label">Giá khóa học (USD)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-muted)' }}>$</span>
                    <input type="number" min="0" step="0.01" className="form-input" style={{ maxWidth: '200px' }} value={course.price} onChange={e => setCourse({...course, price: e.target.value})} />
                  </div>
                  <small style={{ color: 'var(--text-muted)' }}>Để giá 0 để cung cấp khóa học miễn phí.</small>
                </div>
                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <label className="form-label">Cấp độ khó</label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {LEVELS.map(l => (
                      <label key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="radio" name="level" checked={course.level === l} onChange={() => setCourse({...course, level: l})} />
                        {l}
                      </label>
                    ))}
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '1rem' }}>{saving ? 'Đang lưu...' : 'Lưu lại'}</button>
              </>
            )}

            {activeTab === 'curriculum' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Chương trình học</h2>
                  <button type="button" className="btn btn-secondary" onClick={addChapter}><Plus size={16} /> Thêm Chương</button>
                </div>
                
                {chapters.length === 0 ? (
                  <div className="empty-state" style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
                    <div className="empty-state-icon">📚</div>
                    <h3>Chưa có chương nào</h3>
                    <p>Hãy bắt đầu bằng cách tạo chương đầu tiên để cấu trúc danh sách bài học.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {chapters.map((ch, i) => (
                      <div key={ch.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)' }}>
                        <div style={{ background: 'var(--surface-2)', padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700 }}>Chương {i + 1}: {ch.title}</span>
                          <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => deleteChapter(ch.id)}><Trash2 size={16} /></button>
                        </div>
                        <div style={{ padding: '1rem' }}>
                          {/* We instruct user to use CourseDetail old methods for heavy lesson logic or implement a simpler modal here. For brevity, linking to old editor flow or showing summary */}
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            {ch.lessons?.length || 0} bài học, {ch.assignments?.length || 0} bài tập. (Quản lý bài học tại giao diện cũ hoặc nâng cấp sau)
                          </div>
                          <button type="button" className="btn btn-secondary btn-sm" disabled>+ Thêm bài học (Tính năng đang xây dựng)</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'publish' && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <CheckCircle size={64} color="var(--success)" style={{ marginBottom: '1rem' }} />
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem' }}>Sẵn sàng xuất bản!</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Khóa học của bạn đã có đủ thông tin cơ bản. Bạn có thể cho phép học viên đăng ký ngay bây giờ.</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => navigate(`/courses/${id}`)}>Xem trước (Preview)</button>
                  <button type="button" className="btn btn-primary btn-lg" onClick={() => alert('Khóa học đã online!')}>Xuất bản (Publish)</button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CourseEditor;
