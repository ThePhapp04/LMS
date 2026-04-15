import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { assetUrl } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { ArrowLeft, Plus, Trash2, CheckCircle, X, Upload, FileText, Clock, Award } from 'lucide-react';

const AssignmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Question Form State (for quiz)
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    options: ['', '', '', ''],
    correct_option: 0,
    points: 10
  });
  
  // Submission State (for essay)
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  
  // Grading State (for instructor)
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  const fetchAssignment = async () => {
    try {
      const res = await api.get(`/assignments/${id}`);
      setAssignment(res.data);
      
      // If instructor, fetch all submissions
      if (user.role === 'instructor' || user.role === 'admin') {
        const subRes = await api.get(`/assignments/${id}/submissions`);
        setSubmissions(subRes.data);
      }
    } catch (err) {
      alert('Không thể tải bài tập');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  // Question Management (Quiz only)
  const openQuestionModal = () => {
    setQuestionForm({
      question_text: '',
      options: ['', '', '', ''],
      correct_option: 0,
      points: 10
    });
    setShowQuestionModal(true);
  };

  const closeQuestionModal = () => {
    setShowQuestionModal(false);
  };

  const updateOption = (index, value) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = value;
    setQuestionForm({ ...questionForm, options: newOptions });
  };

  const addOption = () => {
    setQuestionForm({
      ...questionForm,
      options: [...questionForm.options, '']
    });
  };

  const removeOption = (index) => {
    if (questionForm.options.length <= 2) return;
    const newOptions = questionForm.options.filter((_, i) => i !== index);
    setQuestionForm({
      ...questionForm,
      options: newOptions,
      correct_option: questionForm.correct_option >= newOptions.length ? 0 : questionForm.correct_option
    });
  };

  const saveQuestion = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/assignments/${id}/questions`, questionForm);
      closeQuestionModal();
      fetchAssignment();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi thêm câu hỏi');
    } finally {
      setSaving(false);
    }
  };

  const deleteQuestion = async (questionId) => {
    if (!window.confirm('Xóa câu hỏi này?')) return;
    try {
      // Assuming we have a delete endpoint
      await api.delete(`/assignments/questions/${questionId}`);
      fetchAssignment();
    } catch (err) {
      alert('Lỗi xóa câu hỏi');
    }
  };

  // Submission (Essay only - for students)
  const submitAssignment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      if (assignment.type === 'essay') {
        fd.append('content', submissionText);
        if (submissionFile) fd.append('file', submissionFile);
      }
      
      await api.post(`/assignments/${id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert('Đã nộp bài thành công!');
      fetchAssignment();
      setSubmissionText('');
      setSubmissionFile(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi nộp bài');
    } finally {
      setSaving(false);
    }
  };

  // Grading (for instructor)
  const gradeSubmission = async (submissionId) => {
    const score = prompt('Nhập điểm (0-' + assignment.total_points + '):');
    const feedback = prompt('Nhận xét (tùy chọn):');
    if (score === null) return;
    
    try {
      await api.put(`/assignments/submissions/${submissionId}`, {
        score: parseFloat(score),
        feedback: feedback || ''
      });
      alert('Đã chấm điểm thành công!');
      fetchAssignment();
    } catch (err) {
      alert('Lỗi chấm điểm');
    }
  };

  if (loading) return <div className="loading-wrapper"><div className="spinner" /></div>;
  if (!assignment) return null;

  const isInstructor = user.role === 'instructor' || user.role === 'admin';
  const isStudent = user.role === 'student';
  const isQuiz = assignment.type === 'quiz';
  const isEssay = assignment.type === 'essay';
  const hasSubmitted = assignment.my_submission;

  return (
    <div className="main-content">
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: '1.5rem' }} onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Quay lại
      </button>

      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{assignment.title}</h1>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span className={`badge ${isQuiz ? 'badge-success' : 'badge-warning'}`}>
                {isQuiz ? '📋 Quiz' : '📄 Essay'}
              </span>
              <span className="badge badge-primary">🎯 {assignment.total_points} điểm</span>
              {assignment.due_date && (
                <span className="badge badge-secondary">
                  <Clock size={14} style={{ marginRight: '0.25rem' }} />
                  Hạn: {new Date(assignment.due_date).toLocaleString('vi-VN')}
                </span>
              )}
            </div>
          </div>
        </div>

        {assignment.description && (
          <div style={{ 
            padding: '1rem', 
            background: 'var(--bg)', 
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            borderLeft: '4px solid var(--primary)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>📝 Mô tả bài tập</h3>
            <p style={{ color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{assignment.description}</p>
          </div>
        )}

        {/* QUIZ: Questions List (Instructor) */}
        {isQuiz && isInstructor && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Danh sách câu hỏi</h2>
              <button className="btn btn-primary" onClick={openQuestionModal}>
                <Plus size={16} /> Thêm câu hỏi
              </button>
            </div>

            {assignment.questions && assignment.questions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {assignment.questions.map((q, idx) => (
                  <div key={q.id} style={{ 
                    padding: '1.5rem', 
                    background: 'var(--surface)', 
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem' }}>
                          Câu {idx + 1}: {q.question_text}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} style={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem',
                              background: q.correct_option === optIdx ? 'var(--success-light)' : 'var(--bg)',
                              borderRadius: '0.25rem',
                              border: q.correct_option === optIdx ? '2px solid var(--success)' : '1px solid var(--border)'
                            }}>
                              {q.correct_option === optIdx && <CheckCircle size={16} color="var(--success)" />}
                              <span style={{ fontWeight: q.correct_option === optIdx ? 600 : 400 }}>
                                {String.fromCharCode(65 + optIdx)}. {opt}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <span className="badge badge-primary">{q.points} điểm</span>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          style={{ color: 'var(--error)' }}
                          onClick={() => deleteQuestion(q.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">❓</div>
                <h3>Chưa có câu hỏi nào</h3>
                <p>Hãy thêm câu hỏi để tạo bài quiz hoàn chỉnh</p>
              </div>
            )}
          </div>
        )}

        {/* QUIZ: Take Quiz (Student) */}
        {isQuiz && isStudent && (
          <div>
            {hasSubmitted ? (
              <div className="alert alert-success">
                <CheckCircle size={20} />
                <div>
                  <strong>Bạn đã hoàn thành bài quiz này!</strong>
                  <p>Điểm: {assignment.my_submission.score}/{assignment.total_points}</p>
                </div>
              </div>
            ) : (
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>Làm bài Quiz</h2>
                {assignment.questions && assignment.questions.length > 0 ? (
                  <div style={{ color: 'var(--text-muted)' }}>
                    <p>Số câu hỏi: {assignment.questions.length}</p>
                    <p>Chức năng làm bài quiz sẽ được triển khai sau...</p>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>Bài quiz chưa có câu hỏi</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ESSAY: Submit Form (Student) */}
        {isEssay && isStudent && (
          <div>
            {hasSubmitted ? (
              <div>
                <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                  <CheckCircle size={20} />
                  <div>
                    <strong>Bạn đã nộp bài!</strong>
                    <p>Nộp lúc: {new Date(assignment.my_submission.submitted_at).toLocaleString('vi-VN')}</p>
                    {assignment.my_submission.score !== null && (
                      <p style={{ fontWeight: 700, color: 'var(--success)' }}>
                        <Award size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                        Điểm: {assignment.my_submission.score}/{assignment.total_points}
                      </p>
                    )}
                  </div>
                </div>
                
                <div style={{ padding: '1rem', background: 'var(--surface)', borderRadius: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Bài làm của bạn:</h3>
                  <p style={{ whiteSpace: 'pre-wrap', marginBottom: '0.5rem' }}>{assignment.my_submission.content}</p>
                  {assignment.my_submission.file_url && (
                    <a href={assetUrl(assignment.my_submission.file_url)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                      <FileText size={14} /> Xem file đã nộp
                    </a>
                  )}
                  {assignment.my_submission.feedback && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--primary-light)', borderRadius: '0.25rem' }}>
                      <strong>Nhận xét của giảng viên:</strong>
                      <p style={{ marginTop: '0.25rem' }}>{assignment.my_submission.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={submitAssignment}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>Nộp bài</h2>
                
                <div className="form-group">
                  <label className="form-label">Nội dung bài làm</label>
                  <textarea 
                    className="form-textarea"
                    rows="10"
                    value={submissionText}
                    onChange={e => setSubmissionText(e.target.value)}
                    placeholder="Nhập nội dung bài làm của bạn..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">File đính kèm (tùy chọn)</label>
                  <label className="form-file-label">
                    <Upload size={20} />
                    <span>{submissionFile ? submissionFile.name : 'Chọn file để upload'}</span>
                    <input 
                      type="file"
                      className="form-file-input"
                      onChange={e => setSubmissionFile(e.target.files[0])}
                    />
                  </label>
                </div>

                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Đang nộp...' : 'Nộp bài'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* INSTRUCTOR: View Submissions */}
        {isInstructor && (
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1rem' }}>
              Bài nộp của học viên ({submissions.length})
            </h2>
            
            {submissions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {submissions.map(sub => (
                  <div key={sub.id} style={{ 
                    padding: '1.5rem', 
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{sub.student_name || `Học viên #${sub.student_id}`}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Nộp lúc: {new Date(sub.submitted_at).toLocaleString('vi-VN')}
                        </div>
                      </div>
                      <div>
                        {sub.score !== null ? (
                          <span className="badge badge-success" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                            {sub.score}/{assignment.total_points}
                          </span>
                        ) : (
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => gradeSubmission(sub.id)}
                          >
                            Chấm điểm
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {isEssay && (
                      <div>
                        <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: '0.25rem', marginBottom: '0.5rem' }}>
                          <p style={{ whiteSpace: 'pre-wrap' }}>{sub.content}</p>
                        </div>
                        {sub.file_url && (
                          <a href={assetUrl(sub.file_url)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                            <FileText size={14} /> Xem file
                          </a>
                        )}
                      </div>
                    )}
                    
                    {sub.feedback && (
                      <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'var(--primary-light)', borderRadius: '0.25rem' }}>
                        <strong>Nhận xét:</strong> {sub.feedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h3>Chưa có bài nộp nào</h3>
                <p>Học viên chưa nộp bài tập này</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Question Modal */}
      {showQuestionModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={closeQuestionModal}>
          <div className="card" style={{
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '2rem',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button 
              type="button"
              onClick={closeQuestionModal}
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
              Thêm câu hỏi mới
            </h2>

            <form onSubmit={saveQuestion}>
              <div className="form-group">
                <label className="form-label">Câu hỏi *</label>
                <textarea 
                  className="form-textarea"
                  rows="3"
                  required
                  value={questionForm.question_text}
                  onChange={e => setQuestionForm({...questionForm, question_text: e.target.value})}
                  placeholder="Nhập nội dung câu hỏi..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Các đáp án</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {questionForm.options.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input 
                        type="radio"
                        name="correct-option"
                        checked={questionForm.correct_option === idx}
                        onChange={() => setQuestionForm({...questionForm, correct_option: idx})}
                        title="Đáp án đúng"
                      />
                      <input 
                        type="text"
                        className="form-input"
                        style={{ flex: 1 }}
                        required
                        value={opt}
                        onChange={e => updateOption(idx, e.target.value)}
                        placeholder={`Đáp án ${String.fromCharCode(65 + idx)}`}
                      />
                      {questionForm.options.length > 2 && (
                        <button 
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--error)' }}
                          onClick={() => removeOption(idx)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button 
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ marginTop: '0.5rem' }}
                  onClick={addOption}
                >
                  <Plus size={14} /> Thêm đáp án
                </button>
                <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                  Chọn radio button bên trái để đánh dấu đáp án đúng
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Điểm cho câu hỏi này</label>
                <input 
                  type="number"
                  className="form-input"
                  style={{ maxWidth: '150px' }}
                  min="1"
                  required
                  value={questionForm.points}
                  onChange={e => setQuestionForm({...questionForm, points: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={closeQuestionModal}>Hủy</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Thêm câu hỏi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentDetail;
