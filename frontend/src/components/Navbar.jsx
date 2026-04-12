import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { GraduationCap, BookOpen, LogOut, LayoutDashboard, MessageSquare } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const initial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <div className="nav-brand-icon">
          <GraduationCap size={20} />
        </div>
        <span className="nav-brand-text">LearnHub</span>
      </Link>

      <div className="nav-links">
        {user ? (
          <>
            <Link to="/" className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}
              style={isActive('/') ? { color: 'var(--primary)', background: 'var(--primary-light)' } : {}}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <LayoutDashboard size={15} /> Dashboard
              </span>
            </Link>
            <Link to="/courses" className={`nav-link ${isActive('/courses') ? 'nav-link-active' : ''}`}
              style={isActive('/courses') ? { color: 'var(--primary)', background: 'var(--primary-light)' } : {}}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={15} /> Courses
              </span>
            </Link>
            <Link to="/forum" className={`nav-link ${isActive('/forum') ? 'nav-link-active' : ''}`}
              style={isActive('/forum') ? { color: 'var(--primary)', background: 'var(--primary-light)' } : {}}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={15} /> Forum
              </span>
            </Link>

            <div className="nav-user" style={{ marginLeft: '0.5rem', paddingLeft: '1rem', borderLeft: '1px solid var(--border)' }}>
              <div className="avatar">{initial}</div>
              <span style={{ color: 'var(--text)' }}>{user.name}</span>
              <span className="badge badge-primary">{user.role}</span>
            </div>

            <button onClick={handleLogout} className="btn btn-ghost btn-sm">
              <LogOut size={15} />
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
