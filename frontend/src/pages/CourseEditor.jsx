import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { FileEdit, List, DollarSign, CheckCircle, ArrowLeft, Upload, Plus, Trash2, X, Video, File, FileText, ClipboardList, Calendar } from 'lucide-react';

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
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  
  // Curriculum State
  const [chapters, setChapters] = useState([]);
  
  // Lesson Modal State
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    title: '', content: '', video_url: '', lesson_order: 0, duration: ''
  });
  const [lessonFile, setLessonFile] = useState(null);

  // Assignment Modal State
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '', description: '', type: 'essay', total_points: 100, due_date: ''
  });

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
        const res = await api.put(`/courses/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setCourse({ ...course, thumbnail_url: res.data.thumbnail_url });
        setThumbnailFile(null);
        setThumbnailPreview(null);
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

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
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

  // Lesson Handlers
  const openLessonModal = (chapterId, lesson = null) => {
    setCurrentChapterId(chapterId);
    setEditingLesson(lesson);
    if (lesson) {
      setLessonForm({
        title: lesson.title,
        content: lesson.content || '',
        video_url: lesson.video_url || '',
        lesson_order: lesson.lesson_order || 0,
        duration: lesson.duration || ''
      });
    } else {
      setLessonForm({ title: '', content: '', video_url: '', lesson_order: 0, duration: '' });
    }
    setLessonFile(null);
    setShowLessonModal(true);
  };

  const closeLessonModal = () => {
    setShowLessonModal(false);
    setEditingLesson(null);
    setCurrentChapterId(null);
    setLessonForm({ title: '', content: '', video_url: '', lesson_order: 0, duration: '' });
    setLessonFile(null);
  };

  const saveLessonForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('course_id', id);
      fd.append('chapter_id', currentChapterId);
      fd.append('title', lessonForm.title);
      fd.append('content', lessonForm.content);
      fd.append('video_url', lessonForm.video_url);
      fd.append('lesson_order', lessonForm.lesson_order);
      fd.append('duration', lessonForm.duration);
      if (lessonFile) fd.append('file', lessonFile);

      if (editingLesson) {
        await api.put(`/lessons/${editingLesson.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/lessons', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      
      closeLessonModal();
      fetchCourse();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi lưu bài học');
    } finally {
      setSaving(false);
    }
  };

  const deleteLesson = async (lessonId) => {
    if (!window.confirm('Xóa bài học này?')) return;
    try {
      await api.delete(`/lessons/${lessonId}`);
      fetchCourse();
    } catch {}
  };

  // Assignment Handlers
  const openAssignmentModal = (chapterId, assignment = null) => {
    setCurrentChapterId(chapterId);
    setEditingAssignment(assignment);
    if (assignment) {
      setAssignmentForm({
        title: assignment.title,
        description: assignment.description || '',
        type: assignment.type || 'essay',
        total_points: assignment.total_points || 100,
        due_date: assignment.due_date ? assignment.due_date.substring(0, 16) : ''
      });
    } else {
      setAssignmentForm({ title: '', description: '', type: 'essay', total_points: 100, due_date: '' });
    }
    setShowAssignmentModal(true);
  };

  const closeAssignmentModal = () => {
    setShowAssignmentModal(false);
    setEditingAssignment(null);
    setCurrentChapterId(null);
    setAssignmentForm({ title: '', description: '', type: 'essay', total_points: 100, due_date: '' });
  };

  const saveAssignmentForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: assignmentForm.title,
        description: assignmentForm.description,
        chapter_id: currentChapterId,
        type: assignmentForm.type,
        total_points: assignmentForm.total_points,
        due_date: assignmentForm.due_date || null
      };

      if (editingAssignment) {
        // Note: Backend might not have PUT for assignments, we'll use POST/DELETE pattern
        await api.delete(`/assignments/${editingAssignment.id}`);
        await api.post(`/assignments/course/${id}`, payload);
      } else {
        await api.post(`/assignments/course/${id}`, payload);
      }
      
      closeAssignmentModal();
      fetchCourse();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi lưu bài tập');
    } finally {
      setSaving(false);
    }
  };

  const deleteAssignment = async (assignmentId) => {
    if (!window.confirm('Xóa bài tập này?')) return;
    try {
      await api.delete(`/assignments/${assignmentId}`);
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
                    {(thumbnailPreview || (course.thumbnail_url && !thumbnailFile)) && (
                      <img 
                        src={thumbnailPreview || `http://localhost:5000${course.thumbnail_url}`} 
                        alt="Thumbnail preview"
                        style={{ width: 150, height: 100, objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }} 
                      />
                    )}
                    <label className="form-file-label" style={{ flex: 1 }}>
                      <Upload size={20} />
                      <span>{thumbnailFile ? thumbnailFile.name : 'Nhấn để chọn ảnh mới'}</span>
                      <input type="file" className="form-file-input" accept="image/*" onChange={handleThumbnailChange} />
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
                          {/* Lessons Section */}
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text)', fontSize: '0.9rem' }}>📚 Bài học</div>
                            {ch.lessons && ch.lessons.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                {ch.lessons.map((lesson, idx) => (
                                  <div key={lesson.id} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    padding: '0.75rem',
                                    background: 'var(--bg)',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border)'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                      {lesson.video_url ? <Video size={16} color="var(--primary)" /> : <File size={16} color="var(--text-muted)" />}
                                      <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{idx + 1}. {lesson.title}</div>
                                        {lesson.video_url && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📹 Video: {lesson.video_url.substring(0, 40)}...</div>}
                                        {lesson.duration && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⏱️ {lesson.duration} phút</div>}
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => openLessonModal(ch.id, lesson)}>Sửa</button>
                                      <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => deleteLesson(lesson.id)}><Trash2 size={14} /></button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '0.75rem' }}>Chưa có bài học nào</div>
                            )}
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => openLessonModal(ch.id)}>
                              <Plus size={14} /> Thêm bài học
                            </button>
                          </div>

                          {/* Assignments Section */}
                          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text)', fontSize: '0.9rem' }}>📝 Bài tập / Quiz</div>
                            {ch.assignments && ch.assignments.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                {ch.assignments.map((assignment, idx) => (
                                  <div key={assignment.id} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    padding: '0.75rem',
                                    background: 'var(--bg)',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border)'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                                      {assignment.type === 'quiz' ? 
                                        <ClipboardList size={16} color="var(--success)" /> : 
                                        <FileText size={16} color="var(--warning)" />
                                      }
                                      <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{idx + 1}. {assignment.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
                                          <span>{assignment.type === 'quiz' ? '📋 Quiz' : '📄 Essay'}</span>
                                          <span>🎯 {assignment.total_points} điểm</span>
                                          {assignment.due_date && <span>📅 {new Date(assignment.due_date).toLocaleDateString('vi-VN')}</span>}
                                        </div>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                      <button 
                                        type="button" 
                                        className="btn btn-primary btn-sm"
                                        onClick={() => navigate(`/assignments/${assignment.id}`)}
                                      >
                                        Chi tiết
                                      </button>
                                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => openAssignmentModal(ch.id, assignment)}>Sửa</button>
                                      <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => deleteAssignment(assignment.id)}><Trash2 size={14} /></button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', marginBottom: '0.75rem' }}>Chưa có bài tập nào</div>
                            )}
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => openAssignmentModal(ch.id)}>
                              <Plus size={14} /> Thêm bài tập / Quiz
                            </button>
                          </div>
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

      {/* Lesson Modal */}
      {showLessonModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={closeLessonModal}>
          <div className="card" style={{
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '2rem',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button 
              type="button"
              onClick={closeLessonModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '0.5rem'
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
              {editingLesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
            </h2>

            <form onSubmit={saveLessonForm}>
              <div className="form-group">
                <label className="form-label">Tiêu đề bài học *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={lessonForm.title}
                  onChange={e => setLessonForm({...lessonForm, title: e.target.value})}
                  placeholder="VD: Giới thiệu về React Hooks"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả / Nội dung</label>
                <textarea 
                  className="form-textarea" 
                  rows="4"
                  value={lessonForm.content}
                  onChange={e => setLessonForm({...lessonForm, content: e.target.value})}
                  placeholder="Mô tả chi tiết nội dung bài học..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Video size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Link YouTube / Video URL
                </label>
                <input 
                  type="url" 
                  className="form-input"
                  value={lessonForm.video_url}
                  onChange={e => setLessonForm({...lessonForm, video_url: e.target.value})}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Dán link YouTube, Vimeo hoặc URL video khác
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Tài liệu đính kèm (PDF, Video, ...)</label>
                <label className="form-file-label">
                  <Upload size={20} />
                  <span>{lessonFile ? lessonFile.name : 'Nhấn để chọn file'}</span>
                  <input 
                    type="file" 
                    className="form-file-input"
                    onChange={e => setLessonFile(e.target.files[0])}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Thứ tự</label>
                  <input 
                    type="number" 
                    className="form-input"
                    min="0"
                    value={lessonForm.lesson_order}
                    onChange={e => setLessonForm({...lessonForm, lesson_order: e.target.value})}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Thời lượng (phút)</label>
                  <input 
                    type="number" 
                    className="form-input"
                    min="0"
                    value={lessonForm.duration}
                    onChange={e => setLessonForm({...lessonForm, duration: e.target.value})}
                    placeholder="30"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={closeLessonModal}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : (editingLesson ? 'Cập nhật' : 'Tạo bài học')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={closeAssignmentModal}>
          <div className="card" style={{
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '2rem',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button 
              type="button"
              onClick={closeAssignmentModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '0.5rem'
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
              {editingAssignment ? 'Chỉnh sửa bài tập' : 'Thêm bài tập / Quiz mới'}
            </h2>

            <form onSubmit={saveAssignmentForm}>
              <div className="form-group">
                <label className="form-label">Tiêu đề bài tập *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={assignmentForm.title}
                  onChange={e => setAssignmentForm({...assignmentForm, title: e.target.value})}
                  placeholder="VD: Bài tập về React Hooks"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <textarea 
                  className="form-textarea" 
                  rows="4"
                  value={assignmentForm.description}
                  onChange={e => setAssignmentForm({...assignmentForm, description: e.target.value})}
                  placeholder="Hướng dẫn và yêu cầu cho bài tập..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Loại bài tập</label>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="assignment-type"
                      checked={assignmentForm.type === 'essay'}
                      onChange={() => setAssignmentForm({...assignmentForm, type: 'essay'})}
                    />
                    <FileText size={16} />
                    <span>Essay / Tự luận</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="assignment-type"
                      checked={assignmentForm.type === 'quiz'}
                      onChange={() => setAssignmentForm({...assignmentForm, type: 'quiz'})}
                    />
                    <ClipboardList size={16} />
                    <span>Quiz / Trắc nghiệm</span>
                  </label>
                </div>
                <small style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {assignmentForm.type === 'quiz' ? 
                    '💡 Sau khi tạo quiz, bạn có thể thêm câu hỏi trong trang chi tiết bài tập' : 
                    '💡 Học viên sẽ upload file hoặc nhập văn bản để nộp bài'}
                </small>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      Tổng điểm
                    </span>
                  </label>
                  <input 
                    type="number" 
                    className="form-input"
                    min="1"
                    max="1000"
                    value={assignmentForm.total_points}
                    onChange={e => setAssignmentForm({...assignmentForm, total_points: e.target.value})}
                    placeholder="100"
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">
                    <Calendar size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                    Hạn nộp
                  </label>
                  <input 
                    type="datetime-local" 
                    className="form-input"
                    value={assignmentForm.due_date}
                    onChange={e => setAssignmentForm({...assignmentForm, due_date: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={closeAssignmentModal}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : (editingAssignment ? 'Cập nhật' : 'Tạo bài tập')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseEditor;
