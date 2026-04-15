import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, UserRound, BookOpen } from 'lucide-react';

const ROLES = [
  { value: 'student', label: 'Student', desc: 'I want to learn new skills', icon: <UserRound size={20} /> },
  { value: 'lecturer', label: 'Lecturer', desc: 'I want to teach and create courses', icon: <BookOpen size={20} /> },
];

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <GraduationCap size={28} color="#fff" />
          </div>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Join VanAnhLMS today, it's free</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input id="reg-name" type="text" className="form-input" value={form.name}
              onChange={e => set('name', e.target.value)} required placeholder="John Doe" />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input id="reg-email" type="email" className="form-input" value={form.email}
              onChange={e => set('email', e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="reg-password" type="password" className="form-input" value={form.password}
              onChange={e => set('password', e.target.value)} required placeholder="Min. 6 characters" />
          </div>

          <div className="form-group">
            <label className="form-label">I am joining as...</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.25rem' }}>
              {ROLES.map(r => (
                <div key={r.value}
                  onClick={() => set('role', r.value)}
                  style={{
                    border: `2px solid ${form.role === r.value ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.9rem',
                    cursor: 'pointer',
                    background: form.role === r.value ? 'var(--primary-light)' : 'var(--surface)',
                    transition: 'var(--transition)',
                  }}>
                  <div style={{ color: form.role === r.value ? 'var(--primary)' : 'var(--text-muted)', marginBottom: 4 }}>{r.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{r.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <button id="reg-submit" type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <hr className="divider" />
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>Sign in instead</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
