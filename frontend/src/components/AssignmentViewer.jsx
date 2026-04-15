import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { CheckCircle2, AlertCircle, Clock, Award, ChevronLeft, ChevronRight, Circle } from 'lucide-react';
import { Confetti, StarRating, MascotMessage } from './FunElements';

const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
const optionColors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const AssignmentViewer = ({ assignment, onSubmissionSuccess }) => {
  const { user } = useContext(AuthContext);

  const isQuiz = assignment.type === 'quiz';
  const mySub = assignment.my_submission;
  const isPastDue = assignment.due_date && new Date() > new Date(assignment.due_date);
  const questions = assignment.questions || [];

  const [answers, setAnswers] = useState({});
  const [content, setContent] = useState(mySub?.content || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeQIdx, setActiveQIdx] = useState(0);
  // Start in submitted view if student already has a submission for this quiz
  const [submitted, setSubmitted] = useState(isQuiz && !!mySub);
  const [submitResult, setSubmitResult] = useState(
    isQuiz && mySub ? { score: mySub.score, total: assignment.total_points, question_results: null } : null
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isQuiz && Object.keys(answers).length < questions.length) {
      return setError(`Bạn còn ${questions.length - Object.keys(answers).length} câu chưa trả lời!`);
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = isQuiz ? { answers } : { content };
      const res = await api.post(`/assignments/${assignment.id}`, payload);
      if (isQuiz) {
        setSubmitResult(res.data);
        setSubmitted(true);
      } else {
        alert(res.data.message || 'Nộp bài thành công!');
      }
      if (onSubmissionSuccess) onSubmissionSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Nộp bài thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div style={{ padding: '1rem 0' }}>
      {/* Assignment Info Bar */}
      <div style={{
        background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px',
        padding: '1rem 1.5rem', marginBottom: '1.5rem',
        display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.9rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Award size={16} color="var(--warning)" />
          <span><strong>Tổng điểm:</strong> {assignment.total_points}</span>
        </div>
        {assignment.due_date && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isPastDue ? 'var(--error)' : 'var(--text)' }}>
            <Clock size={16} />
            <span><strong>Hạn nộp:</strong> {new Date(assignment.due_date).toLocaleString('vi-VN')}</span>
            {isPastDue && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>(Đã hết hạn)</span>}
          </div>
        )}
        {isQuiz && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Circle size={16} color="var(--primary)" />
            <span><strong>{questions.length} câu hỏi</strong></span>
          </div>
        )}
      </div>

      {assignment.description && (
        <div style={{ fontSize: '0.95rem', lineHeight: 1.8, color: 'var(--text)', whiteSpace: 'pre-wrap', marginBottom: '1.5rem' }}>
          {assignment.description}
        </div>
      )}

      {/* Already submitted result banner — only for non-quiz types */}
      {mySub && !isQuiz && (
        <div style={{
          background: mySub.status === 'graded' ? '#dcfce7' : '#fef9c3',
          border: `1px solid ${mySub.status === 'graded' ? 'var(--success)' : '#ca8a04'}`,
          borderRadius: '10px', padding: '1rem 1.5rem', marginBottom: '1.5rem'
        }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>
            {mySub.status === 'graded'
              ? `✅ Đã chấm điểm: ${mySub.score} / ${assignment.total_points} điểm`
              : '⏳ Đã nộp — Chờ chấm điểm'}
          </div>
          {mySub.feedback && <div style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>📝 {mySub.feedback}</div>}
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Nộp lúc: {new Date(mySub.submitted_at).toLocaleString('vi-VN')}
          </div>
        </div>
      )}

      {/* ===== POST-SUBMIT RESULT (Quiz) ===== */}
      {submitted && submitResult && (
        <div style={{ marginBottom: '2rem' }}>
          <Confetti active={submitted && !!submitResult.question_results} />

          {/* Score Card */}
          <div className="card" style={{
            padding: '2rem', textAlign: 'center', marginBottom: '1rem',
            background: 'linear-gradient(135deg, #fef9c3 0%, #dcfce7 50%, #dbeafe 100%)',
            border: '2px solid #fde68a', borderRadius: '20px'
          }}>
            <StarRating score={submitResult.score} total={submitResult.total} />
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1e293b', margin: '0.5rem 0' }}>
              {submitResult.score} <span style={{ fontSize: '1.2rem', color: '#64748b' }}>/ {submitResult.total} điểm</span>
            </div>
            <div style={{
              display: 'inline-block', padding: '0.4rem 1.2rem', borderRadius: '99px',
              background: '#fff', fontWeight: 700, fontSize: '1rem', color: '#374151',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginTop: '0.25rem'
            }}>
              ✅ Đúng {submitResult.question_results?.filter(r => r.is_correct).length ?? 0} / {questions.length} câu
            </div>
            <MascotMessage score={submitResult.score} total={submitResult.total} />

            {/* Submission history */}
            {mySub && (
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.5rem' }}>
                🕐 Nộp lúc: {new Date(mySub.submitted_at).toLocaleString('vi-VN')}
                {mySub.status === 'graded' && mySub.feedback && (
                  <div style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>📝 {mySub.feedback}</div>
                )}
              </div>
            )}

            {/* Làm lại button */}
            <button
              type="button"
              onClick={() => { setSubmitted(false); setAnswers({}); setSubmitResult(null); setActiveQIdx(0); setError(''); }}
              style={{
                marginTop: '1rem', padding: '0.6rem 1.5rem', borderRadius: '99px',
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff',
                border: 'none', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
              }}
            >
              🔄 Làm lại
            </button>
          </div>

          {/* Show each question with result — only available for fresh submissions */}
          {submitResult.question_results ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {questions.map((q, i) => {
              const chosen = answers[q.id];
              // Use server-returned results for accuracy, fallback to q.correct_option if available
              const qResult = submitResult.question_results?.find(r => r.id === q.id);
              const correctOption = qResult?.correct_option ?? q.correct_option;
              const isCorrect = qResult ? qResult.is_correct : (chosen !== undefined && chosen === correctOption);
              return (
                <div key={q.id} className="card" style={{
                  padding: '1.25rem',
                  background: isCorrect ? '#f0fdf4' : '#fff7f7',
                  border: `2px solid ${isCorrect ? 'var(--success)' : 'var(--error)'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 700 }}>Câu {i + 1}. {q.question_text}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      {isCorrect
                        ? <><CheckCircle2 size={16} color="var(--success)" /><span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>+{q.points}đ</span></>
                        : <><AlertCircle size={16} color="var(--error)" /><span style={{ color: 'var(--error)', fontSize: '0.85rem' }}>0đ</span></>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {q.options.map((opt, oIdx) => {
                      const isChosen = chosen === oIdx;
                      const isAnsCorrect = correctOption !== undefined && oIdx === correctOption;
                      let bg = 'transparent'; let border = '1px solid var(--border)';
                      if (isAnsCorrect && isChosen) { bg = '#dcfce7'; border = '2px solid var(--success)'; }
                      else if (isAnsCorrect) { bg = '#dcfce7'; border = '1px solid var(--success)'; }
                      else if (isChosen) { bg = '#fee2e2'; border = '1px solid var(--error)'; }
                      return (
                        <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '8px', background: bg, border }}>
                          <span style={{ width: 24, height: 24, borderRadius: '50%', background: isAnsCorrect ? 'var(--success)' : isChosen ? 'var(--error)' : optionColors[oIdx], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                            {optionLabels[oIdx]}
                          </span>
                          <span style={{ flex: 1 }}>{opt}</span>
                          {isAnsCorrect && <CheckCircle2 size={14} color="var(--success)" />}
                          {isChosen && !isAnsCorrect && <AlertCircle size={14} color="var(--error)" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', padding: '1rem', background: 'var(--bg)', borderRadius: '10px', border: '1px dashed var(--border)' }}>
              💡 Làm lại bài để xem chi tiết từng câu
            </div>
          )}
        </div>
      )}

      {/* ===== STUDENT QUIZ FORM ===== */}
      {user.role === 'student' && !submitted && (
        <form onSubmit={handleSubmit}>
          {isQuiz ? (
            <>
              {/* Progress bar */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  <span>Tiến độ trả lời</span>
                  <span>{answeredCount} / {questions.length} câu</span>
                </div>
                <div style={{ height: 6, background: 'var(--border)', borderRadius: 99 }}>
                  <div style={{ height: '100%', width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%`, background: 'var(--success)', borderRadius: 99, transition: 'width 0.3s' }} />
                </div>
                {/* Question pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
                  {questions.map((q, i) => (
                    <button
                      type="button" key={q.id}
                      onClick={() => setActiveQIdx(i)}
                      style={{
                        width: 36, height: 36, borderRadius: '50%', border: 'none',
                        background: answers[q.id] !== undefined ? 'var(--success)' : activeQIdx === i ? 'var(--primary)' : 'var(--border)',
                        color: answers[q.id] !== undefined || activeQIdx === i ? '#fff' : 'var(--text)',
                        fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s'
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Question */}
              {questions[activeQIdx] && (() => {
                const q = questions[activeQIdx];
                return (
                  <div className="card" style={{ padding: '1.75rem', marginBottom: '1rem', borderRadius: '16px', border: '2px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', alignItems: 'flex-start' }}>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 800, flex: 1, lineHeight: 1.5 }}>
                        <span style={{ color: 'var(--primary)', marginRight: '0.5rem' }}>Câu {activeQIdx + 1}.</span>
                        {q.question_text}
                      </h4>
                      <span style={{
                        background: '#fef9c3', color: '#92400e', fontWeight: 700,
                        fontSize: '0.85rem', padding: '0.25rem 0.6rem', borderRadius: '99px',
                        flexShrink: 0, marginLeft: '1rem', border: '1px solid #fde68a'
                      }}>🏅 {q.points} điểm</span>
                    </div>
                    <style>{`
                      @keyframes optionBounce {
                        0%   { transform: scale(1); }
                        40%  { transform: scale(1.04); }
                        100% { transform: scale(1); }
                      }
                    `}</style>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {q.options?.map((opt, oIdx) => {
                        const isChosen = answers[q.id] === oIdx;
                        return (
                          <label key={oIdx} style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.9rem 1.1rem', borderRadius: '12px', cursor: 'pointer',
                            background: isChosen ? 'var(--primary-light)' : 'var(--bg)',
                            border: isChosen ? '2px solid var(--primary)' : '1px solid var(--border)',
                            animation: isChosen ? 'optionBounce 0.25s ease' : 'none',
                            boxShadow: isChosen ? '0 4px 12px rgba(99,102,241,0.2)' : '0 1px 3px rgba(0,0,0,0.04)',
                            transition: 'background 0.15s, border 0.15s, box-shadow 0.15s',
                          }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                              background: isChosen ? 'var(--primary)' : optionColors[oIdx],
                              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 900, fontSize: '1rem',
                              boxShadow: isChosen ? '0 2px 8px rgba(99,102,241,0.4)' : 'none',
                              transition: 'all 0.15s'
                            }}>
                              {optionLabels[oIdx]}
                            </div>
                            <span style={{ flex: 1, fontSize: '1rem', fontWeight: isChosen ? 700 : 400 }}>{opt}</span>
                            <input
                              type="radio" name={`q_${q.id}`} value={oIdx}
                              checked={isChosen}
                              onChange={() => setAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                              style={{ display: 'none' }}
                            />
                            {isChosen && <span style={{ fontSize: 20 }}>✅</span>}
                          </label>
                        );
                      })}
                    </div>

                    {/* Prev / Next navigation */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                      <button type="button" className="btn btn-ghost btn-sm" disabled={activeQIdx === 0} onClick={() => setActiveQIdx(activeQIdx - 1)}>
                        <ChevronLeft size={16} /> Câu trước
                      </button>
                      {activeQIdx < questions.length - 1 ? (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => setActiveQIdx(activeQIdx + 1)}>
                          Câu tiếp <ChevronRight size={16} />
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>Câu cuối cùng</span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="form-group">
              <label className="form-label">Bài làm của bạn</label>
              <textarea
                className="form-textarea"
                rows="10"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Nhập bài làm của bạn tại đây..."
                required
              />
            </div>
          )}

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)', padding: '0.75rem 1rem', background: '#fee2e2', borderRadius: '8px', marginTop: '1rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || isPastDue}
              style={{ minWidth: '140px' }}
            >
              {submitting ? 'Đang nộp...' : isQuiz ? `Nộp bài (${answeredCount}/${questions.length})` : 'Nộp bài'}
            </button>
            {isPastDue && (
              <span style={{ color: 'var(--error)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={14} /> Đã hết hạn nộp
              </span>
            )}
          </div>
        </form>
      )}

      {/* ===== LECTURER VIEW ===== */}
      {user.role === 'lecturer' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          {isQuiz && questions.length > 0 ? (
            <>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Danh sách câu hỏi ({questions.length} câu)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {questions.map((q, i) => (
                  <div key={q.id} style={{ padding: '0.75rem 1rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{i + 1}. {q.question_text} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({q.points}đ)</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {q.options?.map((opt, oIdx) => (
                        <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: oIdx === q.correct_option ? 'var(--success)' : 'var(--text-muted)', fontWeight: oIdx === q.correct_option ? 700 : 400 }}>
                          {oIdx === q.correct_option ? <CheckCircle2 size={14} color="var(--success)" /> : <Circle size={14} />}
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
              {isQuiz ? 'Chưa có câu hỏi nào. Vào Course Editor để soạn câu hỏi.' : 'Quản lý bài nộp tại trang Gradebook.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AssignmentViewer;
