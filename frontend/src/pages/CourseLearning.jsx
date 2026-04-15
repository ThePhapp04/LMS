import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import {
  FileText, FileVideo, Circle, ArrowLeft, Download, Link2, BookOpen, ClipboardList, Check
} from 'lucide-react';
import AssignmentViewer from '../components/AssignmentViewer';
import { Confetti, FunProgressBar, LessonCompleteToast } from '../components/FunElements';

function getYoutubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?/\s]{11})/);
  return match ? match[1] : null;
}

function LessonTypeIcon({ lesson }) {
  if (lesson.video_url || lesson.file_type === 'video') return <FileVideo size={14} color="var(--accent)" />;
  if (lesson.file_url) return <FileText size={14} color="var(--warning)" />;
  return <BookOpen size={14} color="var(--primary)" />;
}

const CourseLearning = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [progress, setProgress] = useState({});
  const [activeTab, setActiveTab] = useState('overview');

  const [notes, setNotes] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showCompleteToast, setShowCompleteToast] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    fetchCourseAndProgress();
  }, [id, user]);

  useEffect(() => {
    if (activeLesson) {
      if (activeLesson.item_type === 'assignment') {
        fetchFullAssignment(activeLesson.id);
      } else {
        fetchNotes();
        fetchComments();
      }
    }
  }, [activeLesson?.id, activeLesson?.item_type]);

  const fetchFullAssignment = async (assignmentId) => {
    try {
      const res = await api.get(`/assignments/${assignmentId}`);
      setActiveLesson(prev => ({ ...prev, ...res.data, item_type: 'assignment' }));
    } catch { }
  };

  const fetchCourseAndProgress = async () => {
    try {
      // Must be enrolled or owner
      const res = await api.get(`/courses/${id}`);
      setCourse(res.data);
      if (res.data.lessons?.length > 0) setActiveLesson(res.data.lessons[0]);

      if (user?.role === 'student') {
        const progRes = await api.get(`/lessons/progress/${id}`);
        const map = {};
        progRes.data.forEach(p => { map[p.lesson_id] = p.completed; });
        setProgress(map);
      }
    } catch {
      navigate(`/courses/${id}`); // fallback if error / no access
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await api.get(`/interactions/notes/${activeLesson.id}`);
      setNotes(res.data.content || '');
    } catch { } 
  };

  const fetchComments = async () => {
    try {
      const res = await api.get(`/interactions/comments/${activeLesson.id}`);
      setComments(res.data || []);
    } catch { }
  };

  const saveNotes = async () => {
    try {
      await api.post(`/interactions/notes/${activeLesson.id}`, { content: notes });
    } catch(err) {
      alert('Failed to save note');
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/interactions/comments/${activeLesson.id}`, { content: newComment });
      setComments([res.data, ...comments]);
      setNewComment('');
    } catch {
      alert('Failed to post comment');
    }
  };

  const toggleProgress = async (lessonId, current) => {
    try {
      await api.post('/lessons/progress', { lesson_id: lessonId, completed: !current });
      setProgress(p => ({ ...p, [lessonId]: !current }));
      if (!current) {
        setShowCompleteToast(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3500);
      }
    } catch { }
  };

  if (loading) return <div className="loading-wrapper"><div className="spinner" /><p>Đang tải bài học...</p></div>;
  if (!course) return null;

  const lessons = course.lessons || [];
  const completedCount = lessons.filter(l => progress[l.id]).length;
  const progressPct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
  const ytId = activeLesson ? getYoutubeId(activeLesson.video_url) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)' }}>
      {/* Top Navbar Context */}
      <div style={{ background: '#1e293b', color: '#fff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="btn btn-ghost" style={{ color: '#94a3b8', padding: '0.25rem' }} onClick={() => navigate(`/courses/${id}`)}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{course.title}</div>
        </div>
        
        {user?.role === 'student' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '300px' }}>
            <FunProgressBar pct={progressPct} />
          </div>
        )}
      </div>

      {/* Main Split Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* Left: Content Player (70%) */}
        <div style={{ flex: '1', overflowY: 'auto', background: 'var(--bg)', padding: '2rem' }}>
          {activeLesson ? (
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
              
              {/* Content Header */}
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{activeLesson.title}</h2>
                </div>
                {user?.role === 'student' && activeLesson.item_type !== 'assignment' && (
                    <button
                      className={`btn ${progress[activeLesson.id] ? 'btn-success' : 'btn-secondary'}`}
                      style={progress[activeLesson.id] ? {} : { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none' }}
                      onClick={() => toggleProgress(activeLesson.id, progress[activeLesson.id])}>
                      {progress[activeLesson.id]
                          ? <>✅ Đã hoàn thành!</>
                          : <>🎯 Đánh dấu hoàn thành</>}
                    </button>
                )}
              </div>

              {/* Viewers */}
              {activeLesson.item_type === 'assignment' ? (
                <div className="card" style={{ padding: '1.5rem' }}>
                  <AssignmentViewer assignment={activeLesson} onSubmissionSuccess={() => fetchFullAssignment(activeLesson.id)} />
                </div>
              ) : (
                <>
                  {ytId && (
                    <div className="video-embed" style={{ boxShadow: 'var(--shadow-lg)' }}>
                      <iframe src={`https://www.youtube.com/embed/${ytId}`} allowFullScreen style={{ border: 'none' }} />
                    </div>
                  )}

                  {!ytId && activeLesson.file_type === 'video' && activeLesson.file_url && (
                    <div className="video-embed" style={{ boxShadow: 'var(--shadow-lg)' }}>
                      <video controls style={{ width: '100%', height: '100%' }}>
                        <source src={`http://localhost:5000${activeLesson.file_url}`} />
                      </video>
                    </div>
                  )}

                  {activeLesson.video_url && !ytId && (
                    <div className="doc-preview" style={{ marginBottom: '1.5rem' }}>
                      <div className="doc-icon" style={{ background: '#CFFAFE' }}>🎬</div>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>Liên kết Video ngoài</div>
                        <a href={activeLesson.video_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm"><Link2 size={13} /> Mở Video</a>
                      </div>
                    </div>
                  )}

                  {activeLesson.file_url && activeLesson.file_type !== 'video' && (
                    <>
                      {activeLesson.file_type === 'pdf' ? (
                        <div style={{ marginBottom: '1.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                              📄 {activeLesson.file_name || 'Tài liệu PDF'}
                            </div>
                            <a href={`http://localhost:5000${activeLesson.file_url}`} download className="btn btn-secondary btn-sm">
                              <Download size={13} /> Tải xuống
                            </a>
                          </div>
                          <div style={{ 
                            width: '100%', 
                            height: '600px', 
                            border: '1px solid var(--border)', 
                            borderRadius: 'var(--radius)',
                            overflow: 'hidden',
                            boxShadow: 'var(--shadow-lg)'
                          }}>
                            <iframe 
                              src={`http://localhost:5000${activeLesson.file_url}#view=FitH`}
                              style={{ width: '100%', height: '100%', border: 'none' }}
                              title="PDF Viewer"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="doc-preview">
                          <div className="doc-icon" style={{ background: '#EDE9FE' }}>📝</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, marginBottom: 4 }}>{activeLesson.file_name || 'Tài liệu'}</div>
                            <a href={`http://localhost:5000${activeLesson.file_url}`} download className="btn btn-secondary btn-sm">
                              <Download size={13} /> Tải xuống
                            </a>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Context Tabs */}
                  <div className="tabs" style={{ marginTop: '2rem', borderBottom: '1px solid var(--border)' }}>
                    <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Tổng quan</button>
                    {user?.role === 'student' && <button className={`tab ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>Ghi chú</button>}
                    <button className={`tab ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>Hỏi đáp (Q&A)</button>
                  </div>

                  <div className="tab-content" style={{ marginTop: '1.5rem', minHeight: '300px' }}>
                    {activeTab === 'overview' && (
                      <div style={{ fontSize: '1rem', lineHeight: 1.8, color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
                        {activeLesson.content || <div style={{ color: 'var(--text-muted)' }}>Chưa có mô tả cho bài học này.</div>}
                      </div>
                    )}
                    {activeTab === 'notes' && user?.role === 'student' && (
                      <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Ghi chú riêng tư cho bài học này.</p>
                          <button className="btn btn-primary btn-sm" onClick={saveNotes}>Lưu ghi chú</button>
                        </div>
                        <textarea className="form-textarea" rows="8" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Nhập ghi chú của bạn..." />
                      </div>
                    )}
                    {activeTab === 'comments' && (
                      <div className="card" style={{ padding: '1.5rem' }}>
                        <form onSubmit={submitComment} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
                          <input type="text" className="form-input" style={{ flex: 1 }} value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Đặt câu hỏi hoặc thảo luận..." />
                          <button type="submit" className="btn btn-primary">Gửi</button>
                        </form>
                        <div className="comments-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          {comments.map(c => (
                            <div key={c.id} style={{ display: 'flex', gap: '1rem' }}>
                              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {c.user_name[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.user_name} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>{new Date(c.created_at).toLocaleDateString()}</span></div>
                                <div style={{ fontSize: '1rem', color: 'var(--text)', marginTop: 4 }}>{c.content}</div>
                              </div>
                            </div>
                          ))}
                          {comments.length === 0 && <div style={{ color: 'var(--text-muted)' }}>Chưa có thảo luận nào. Hãy đặt câu hỏi!</div>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Nav Buttons below video */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                    {(() => {
                      const idx = lessons.findIndex(l => l.id === activeLesson.id);
                      const prev = lessons[idx - 1];
                      const next = lessons[idx + 1];
                      return (
                        <>
                          {prev ? <button className="btn btn-secondary" onClick={() => setActiveLesson(prev)}>← {prev.title}</button> : <div />}
                          {next ? <button className="btn btn-primary" onClick={() => setActiveLesson(next)}>Hiểu rồi, Tiếp tục →</button> : <div style={{ fontSize: '1rem', color: 'var(--success)', fontWeight: 600 }}>🎉 Bạn đã học xong!</div>}
                        </>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">👈</div>
              <h3>Chọn bài học</h3>
              <p>Chọn bài học từ danh sách bên phải.</p>
            </div>
          )}
        </div>

        {/* Right: Sticky Syllabus (30%) */}
        <div style={{ 
          width: '350px', background: 'var(--surface)', borderLeft: '1px solid var(--border)', 
          overflowY: 'auto', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 800, fontSize: '1.1rem' }}>
            Nội dung khoá học
          </div>
          <div className="lesson-list" style={{ padding: '1rem' }}>
            {course.chapters?.map((chapter) => (
              <div key={chapter.id} style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 800, padding: '0 0.5rem', color: 'var(--text)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                  {chapter.title}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {chapter.lessons?.map((lesson, idx) => {
                    const isDone = !!progress[lesson.id];
                    const isActive = activeLesson?.id === lesson.id;
                    return (
                      <div key={lesson.id}
                        className={`lesson-item ${isActive ? 'active' : ''}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'var(--transition)',
                          background: isActive ? 'var(--primary-light)' : 'transparent',
                          border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                          opacity: isDone && !isActive ? 0.7 : 1
                        }}
                        onClick={() => setActiveLesson(lesson)}>
                        
                        <div style={{ color: isDone ? 'var(--success)' : 'var(--text-light)', flexShrink: 0, marginTop: '2px' }}>
                          {isDone ? <Check size={18} /> : <Circle size={18} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--primary-dark)' : 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {idx + 1}. {lesson.title}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            <LessonTypeIcon lesson={lesson} /> {lesson.duration || '00:00'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {chapter.assignments?.map((assignment) => {
                    const isActive = activeLesson?.id === assignment.id && activeLesson?.item_type === 'assignment';
                    return (
                      <div key={`ass_${assignment.id}`}
                        className={`lesson-item ${isActive ? 'active' : ''}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                          borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'var(--transition)',
                          background: isActive ? 'var(--warning-light)' : 'transparent',
                          border: isActive ? '1px solid var(--warning)' : '1px solid transparent'
                        }}
                        onClick={() => setActiveLesson({...assignment, item_type: 'assignment'})}>
                        
                        <div style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }}>
                          <ClipboardList size={18} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: isActive ? 700 : 500, color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            Bài tập / Quiz
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Confetti active={showConfetti} />
      <LessonCompleteToast show={showCompleteToast} onClose={() => setShowCompleteToast(false)} />
    </div>
  );
};

export default CourseLearning;
