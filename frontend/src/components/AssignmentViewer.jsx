import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const AssignmentViewer = ({ assignment, onSubmissionSuccess }) => {
  const { user } = useContext(AuthContext);
  const [answers, setAnswers] = useState(assignment.my_submission?.answers || {});
  const [content, setContent] = useState(assignment.my_submission?.content || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isQuiz = assignment.type === 'quiz';
  const mySub = assignment.my_submission;
  const isPastDue = assignment.due_date && new Date() > new Date(assignment.due_date);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = isQuiz ? { answers } : { content };
      const res = await api.post(`/assignments/${assignment.id}`, payload);
      alert(res.data.message || 'Submitted successfully!');
      if (onSubmissionSuccess) onSubmissionSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '1rem 0' }}>
      <div style={{ fontSize: '0.95rem', lineHeight: 1.8, color: 'var(--text)', whiteSpace: 'pre-wrap', marginBottom: '2rem' }}>
        {assignment.description || 'No description provided.'}
      </div>

      <div style={{ background: 'var(--bg-alt)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', fontSize: '0.9rem' }}>
        <div><strong>Type:</strong> <span style={{ textTransform: 'capitalize' }}>{assignment.type}</span></div>
        <div><strong>Total Points:</strong> {assignment.total_points}</div>
        <div><strong>Due:</strong> {assignment.due_date ? new Date(assignment.due_date).toLocaleString() : 'No due date'}</div>
      </div>

      {mySub && (
        <div className={`alert ${mySub.status === 'graded' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '2rem' }}>
          <div>
            <div style={{ fontWeight: 600 }}>{mySub.status === 'graded' ? `Graded: ${mySub.score} / ${assignment.total_points}` : 'Submitted - Waiting for grade'}</div>
            {mySub.feedback && <div style={{ marginTop: 4, fontStyle: 'italic' }}>Feedback: {mySub.feedback}</div>}
            <div style={{ fontSize: '0.8rem', marginTop: 4 }}>Submitted on: {new Date(mySub.submitted_at).toLocaleString()}</div>
          </div>
        </div>
      )}

      {user.role === 'student' && (
        <form onSubmit={handleSubmit}>
          {isQuiz ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {assignment.questions?.map((q, i) => (
                <div key={q.id} className="card" style={{ padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>{i + 1}. {q.question_text} <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 400 }}>({q.points} pts)</span></h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {q.options?.map((opt, optIdx) => (
                      <label key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="radio" 
                          name={`q_${q.id}`} 
                          value={optIdx}
                          checked={answers[q.id] == optIdx}
                          onChange={() => setAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Your Essay Submission</label>
              <textarea 
                className="form-textarea" 
                rows="8" 
                value={content} 
                onChange={e => setContent(e.target.value)} 
                placeholder="Write your answer here..."
                required
              />
            </div>
          )}

          {error && <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}

          <div style={{ marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting || isPastDue}>
              {submitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
            {isPastDue && <span style={{ marginLeft: '1rem', color: 'var(--danger)', fontSize: '0.85rem' }}><AlertCircle size={14} style={{ verticalAlign: 'middle' }}/> Past Due</span>}
          </div>
        </form>
      )}

      {user.role === 'lecturer' && (
        <div>
          {isQuiz && (
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Quiz Questions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {assignment.questions?.length > 0 ? (
                  assignment.questions.map((q, i) => (
                    <div key={q.id} style={{ padding: '1rem', background: 'var(--bg-alt)', borderRadius: '0.5rem' }}>
                      <div style={{ fontWeight: 600 }}>{i + 1}. {q.question_text} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({q.points} pts)</span></div>
                      <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0 }}>
                        {q.options?.map((opt, oIdx) => (
                          <li key={oIdx} style={{ color: 'var(--text-muted)', fontWeight: q.correct_option === oIdx ? 600 : 400, color: q.correct_option === oIdx ? 'var(--success)' : 'inherit' }}>
                            {opt} {q.correct_option === oIdx && '✓'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-muted)' }}>No questions added yet.</div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Add New Question</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   <input type="text" className="form-input" id="new-q-text" placeholder="Question Text" />
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                     <input type="text" className="form-input" id="new-q-opt0" placeholder="Option 1" />
                     <input type="text" className="form-input" id="new-q-opt1" placeholder="Option 2" />
                     <input type="text" className="form-input" id="new-q-opt2" placeholder="Option 3 (Optional)" />
                     <input type="text" className="form-input" id="new-q-opt3" placeholder="Option 4 (Optional)" />
                   </div>
                   <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                     <div style={{ flex: 1 }}>
                       <label className="form-label" style={{ marginBottom: 4 }}>Correct Option (1-4)</label>
                       <select className="form-input" id="new-q-correct">
                         <option value="0">Option 1</option>
                         <option value="1">Option 2</option>
                         <option value="2">Option 3</option>
                         <option value="3">Option 4</option>
                       </select>
                     </div>
                     <div style={{ width: '100px' }}>
                       <label className="form-label" style={{ marginBottom: 4 }}>Points</label>
                       <input type="number" className="form-input" id="new-q-points" defaultValue="10" min="1" />
                     </div>
                   </div>
                   <button className="btn btn-secondary" onClick={async () => {
                     const text = document.getElementById('new-q-text').value;
                     const opts = [
                       document.getElementById('new-q-opt0').value,
                       document.getElementById('new-q-opt1').value,
                       document.getElementById('new-q-opt2').value,
                       document.getElementById('new-q-opt3').value
                     ].filter(Boolean);
                     const correct = parseInt(document.getElementById('new-q-correct').value);
                     const pts = parseInt(document.getElementById('new-q-points').value);
                     
                     if (!text || opts.length < 2) return alert('Enter question and at least 2 options.');
                     if (correct >= opts.length) return alert('Correct option index out of bounds.');

                     try {
                       await api.post(`/assignments/${assignment.id}/questions`, {
                         question_text: text, options: opts, correct_option: correct, points: pts
                       });
                       if (onSubmissionSuccess) onSubmissionSuccess(); // reload assignment
                     } catch (err) { alert(err.response?.data?.message || 'Failed to add question'); }
                   }}>Add Question</button>
                </div>
              </div>
            </div>
          )}

          <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>Manage submissions and grades in the <strong>Course Gradebook</strong>.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentViewer;
